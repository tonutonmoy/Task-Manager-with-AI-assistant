import express from "express";
import { MicroGoalControllers } from "./task.controller";
import auth from "../../middlewares/auth";




const router = express.Router();


router.post("/",auth(), MicroGoalControllers.createTask);
router.get("/me",auth(), MicroGoalControllers.getAllTask);
router.patch("/:id",auth(), MicroGoalControllers.updateTask);
router.get("/slingle-task/:id",auth(), MicroGoalControllers.singleTask);

router.put("/micro-goal", MicroGoalControllers.updateMicroGoalController);

// Get single MicroGoal (user এর প্রথম MicroGoal)
router.get("/micro-goal",  MicroGoalControllers.getSingleMicroGoalController);


// 🟣 Task sharing routes
router.post("/share", auth(), MicroGoalControllers.sendTaskToFriend);
router.get("/friend-tasks", auth(), MicroGoalControllers.getAllFriendTask);
router.put("/share/respond", auth(), MicroGoalControllers.respondToTaskShare);


router.get("/graph", auth(), MicroGoalControllers.graph);

export const TaskRouters =  router;
