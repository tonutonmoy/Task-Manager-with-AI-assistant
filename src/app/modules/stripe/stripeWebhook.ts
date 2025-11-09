import { Request, Response } from "express";
import Stripe from "stripe";
import {
  handleStripeSubscriptionCreated,
  handleStripeSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
} from "./stripe.service";

const stripe = new Stripe(process.env.STRIPE_SK_KEY as string, );

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleStripeSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleStripeSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Error handling webhook", err);
    res.status(500).send("Webhook handler failed");
  }
};
