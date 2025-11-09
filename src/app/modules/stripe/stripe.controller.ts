import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";

import {
  createSubscriptionIntoDb,
  getAllSubscriptionPlans,
  purchaseSubscription,
  unsubscribeSubscription,
} from "./stripe.service";

// ===== Subscription Controllers =====
const createPlanController = catchAsync(async (req, res) => {
  const plan = await createSubscriptionIntoDb(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Subscription plan created successfully",
    data: plan,
  });
});

const getAllPlansController = catchAsync(async (_req, res) => {
  const plans = await getAllSubscriptionPlans();

  console.log(plans)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription plans retrieved successfully",
    data: plans,
  });
});

const purchaseSubscriptionController = catchAsync(async (req, res) => {
  const userId = req.user.userId; // normally from auth middleware
  const sub = await purchaseSubscription(req.body, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription purchased successfully",
    data: sub,
  });
});

const unsubscribeSubscriptionController = catchAsync(async (req, res) => {
  const { planId } = req.body;
  const userId = req.user.userId;
  const result = await unsubscribeSubscription(userId, planId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription cancelled successfully",
    data: result,
  });
});

export const subscriptionController = {
  createPlanController,
  getAllPlansController,
  purchaseSubscriptionController,
  unsubscribeSubscriptionController,
};
