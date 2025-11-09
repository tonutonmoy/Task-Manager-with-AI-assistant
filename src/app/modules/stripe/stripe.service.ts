import Stripe from "stripe";
import prisma from "../../utils/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { SubscriptionStatus } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SK_KEY as string);

// ===== Interfaces =====
interface CreatePlanPayload {
  title: string; 
  price: number; 
  currency: string;
  billingPeriod: "month" | "year" | "lifetime";
  features: any; // features object array
}

interface PurchaseSubscriptionPayload {
  subscriptionId: string;
  paymentMethodId?: string; 
}

// ===== Create Plan =====
export const createSubscriptionIntoDb = async (payload: CreatePlanPayload) => {
  const currency = payload.currency || "usd";
  const interval = payload.billingPeriod === "month" ? "month" : "lifetime";

  let productId: string | null = null;
  let pricingId: string | null = null;

  // Paid plan only
  if (payload.price > 0) {
    const product = await stripe.products.create({ name: payload.title });
    productId = product.id;

    const priceData: Stripe.PriceCreateParams = {
      unit_amount: Math.round(payload.price * 100),
      currency,
      product: product.id,
    };

    if (interval !== "lifetime") {
      priceData.recurring = { interval };
    }

    const price = await stripe.prices.create(priceData);
    pricingId = price.id;
  }

  // Features JSON string হিসেবে save করা


  const duplicatePlan= await prisma.subscriptionPlan.findFirst({
where:{
  name:payload.title
}
  })

   if (duplicatePlan) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Plan is already exist');
      }
 
  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: payload.title,
      price: payload.price,
      currency,
      billingPeriod: interval === "month" ? "MONTHLY" : "LIFETIME",
      features:payload.features,
      productId,
      pricingId,
    },
  
  });

  return plan;
};

// ===== Get All Plans =====
export const getAllSubscriptionPlans = async () => {
  return prisma.subscriptionPlan.findMany({
    orderBy: { createdAt: "asc" },
  
  });
};

// ===== Purchase Subscription =====
export const purchaseSubscription = async (payload: PurchaseSubscriptionPayload, userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: payload.subscriptionId } });
  if (!plan) throw new AppError(httpStatus.NOT_FOUND, "Subscription plan not found");

  const existing = await prisma.userSubscription.findFirst({
    where: { userId, status: SubscriptionStatus.ACTIVE },
  });
  if (existing) throw new AppError(httpStatus.CONFLICT, "You already have an active subscription.");

  // Free plan
  if ((plan.price ?? 0) === 0) {
    return prisma.userSubscription.upsert({
      where: { userId_planId_unique: { userId, planId: plan.id } },
      update: { status: SubscriptionStatus.ACTIVE, startDate: new Date(), updatedAt: new Date() },
      create: { userId, planId: plan.id, status: SubscriptionStatus.ACTIVE, startDate: new Date() },
    });
  }

  if (!plan.pricingId)
    throw new AppError(httpStatus.BAD_REQUEST, "This plan is not configured with a Stripe price.");
  if (!payload.paymentMethodId)
    throw new AppError(httpStatus.BAD_REQUEST, "paymentMethodId is required for paid plans");

  const fullname = user.name || user.email;
  const customer = await stripe.customers.create({ email: user.email, name: fullname });
  const stripeCustomerId = customer.id;

  await stripe.paymentMethods.attach(payload.paymentMethodId, { customer: stripeCustomerId });
  await stripe.customers.update(stripeCustomerId, {
    invoice_settings: { default_payment_method: payload.paymentMethodId },
  });

  const stripeSub = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: plan.pricingId }],
    expand: ["latest_invoice.payment_intent"],
    metadata: { userId, subscriptionId: plan.id },
    payment_settings: { payment_method_types: ["card"] },
  });

  return prisma.userSubscription.create({
    data: {
      userId,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      transactionId: stripeSub.id,
      paymentMethod: "stripe",
    },
  });
};

// ===== Unsubscribe =====
export const unsubscribeSubscription = async (userId: string, planId: string) => {
  const userSub = await prisma.userSubscription.findFirst({ where: { userId, planId } });
  if (!userSub) throw new AppError(httpStatus.NOT_FOUND, "User subscription not found");

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new AppError(httpStatus.NOT_FOUND, "Plan not found");

  if ((plan.price ?? 0) === 0) {
    await prisma.userSubscription.delete({ where: { id: userSub.id } });
    return { success: true };
  }

  if (userSub.transactionId) {
    try {
      await stripe.subscriptions.cancel(userSub.transactionId);
       await prisma.userSubscription.delete({
    where: { id: userSub.id },
    // data: { status: SubscriptionStatus.CANCELLED, cancelAt: new Date() },
  });
    } catch (err) {
      console.error("Stripe cancel error:", err);
    }
  }

 

  return { success: true };
};

// ===== Stripe Webhook Handlers =====
export const handleStripeSubscriptionCreated = async (stripeSub: Stripe.Subscription) => {
  const metadata = stripeSub.metadata || {};
  const userId = metadata.userId;
  const subscriptionId = metadata.subscriptionId;

  if (!userId || !subscriptionId) return;

  const existing = await prisma.userSubscription.findFirst({ where: { transactionId: stripeSub.id } });

  if (existing) {
    await prisma.userSubscription.update({
      where: { id: existing.id },
      data: { status: SubscriptionStatus.ACTIVE, transactionId: stripeSub.id, updatedAt: new Date() },
    });
  } else {
    await prisma.userSubscription.create({
      data: {
        userId,
        planId: subscriptionId,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        transactionId: stripeSub.id,
      },
    });
  }
};

export const handleStripeSubscriptionDeleted = async (stripeSub: Stripe.Subscription) => {
  await prisma.userSubscription.updateMany({
    where: { transactionId: stripeSub.id },
    data: { status: SubscriptionStatus.CANCELLED, cancelAt: new Date() },
  });
};

export const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice) => {
  const subscriptionId = (invoice as any).subscription as string | undefined;
  if (!subscriptionId) return;

  await prisma.userSubscription.updateMany({
    where: { transactionId: subscriptionId },
    data: { status: SubscriptionStatus.ACTIVE },
  });
};

export const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
  const subscriptionId = (invoice as any).subscription as string | undefined;
  if (!subscriptionId) return;

  await prisma.userSubscription.updateMany({
    where: { transactionId: subscriptionId },
    data: { status: SubscriptionStatus.PENDING },
  });
};
