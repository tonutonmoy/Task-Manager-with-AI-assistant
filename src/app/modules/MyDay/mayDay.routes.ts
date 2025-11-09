import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { MyDayValidations } from "./myDay.validation";
import { MyDayControllers } from "./mayDay.controller";


const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(MyDayValidations.createMyDaySchema),
  MyDayControllers.createMyDay
);

router.get("/", auth(), MyDayControllers.getMyDays);

router.get("/:id", auth(), MyDayControllers.getSingleMyDayController);


router.put(
  "/:id",
  auth(),
  validateRequest(MyDayValidations.updateMyDaySchema),
  MyDayControllers.updateMyDay
);

router.delete("/:id", auth(), MyDayControllers.deleteMyDay);

export const MyDayRoutes = router;
