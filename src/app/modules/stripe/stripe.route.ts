import { Router } from "express";

import { subscriptionController } from "./stripe.controller";
import auth from "../../middlewares/auth";

const router = Router();

router.post("/create-subscription", 
  // auth(),

subscriptionController.createPlanController);
router.get("/get-subscription",
  //  auth(),
    subscriptionController.getAllPlansController);
router.post("/purchase-subscription",
   auth(),
    subscriptionController.purchaseSubscriptionController);
router.post("/un-subscription",
   auth(),
    subscriptionController.unsubscribeSubscriptionController);

export const subscriptionRouter = router;
