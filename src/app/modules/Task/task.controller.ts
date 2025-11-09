import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { TaskService } from "./task.service";

// 1️⃣ MicroGoal update
const updateMicroGoalController = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await TaskService.updateMicroGoal(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "MicroGoal updated successfully",
    data: result,
  });
});

// 2️⃣ Get single MicroGoal (user er first MicroGoal)
const getSingleMicroGoalController = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const result = await TaskService.getSingleMicroGoal(userId); // service method implement korte hobe

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "MicroGoal retrieved successfully",
    data: result,
  });
});



const getAllTask = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const result = await TaskService.getAllTask(userId,req?.query?.date as string); // service method implement korte hobe

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "getAllTask retrieved successfully",
    data: result,
  });
});



const createTask = catchAsync(async (req, res) => {
 
  const { userId } = req.user;
  const result = await TaskService.createTask(userId ,req.body.data); // service method implement korte hobe

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:  "task created  successfully",
    data: result,
  });

  
});
const singleTask = catchAsync(async (req, res) => {
 

  const result = await TaskService.singleTask(req.params.id); // service method implement korte hobe

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:  " get single task retrieved successfully",
    data: result,
  });

  
});




const updateTask = catchAsync(async (req, res) => {
 

  const result = await TaskService.updateTask(req.params.id,req.body.isComplete); // service method implement korte hobe

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:  " get single task retrieved successfully",
    data: result,
  });
});



const sendTaskToFriend = catchAsync(async (req, res) => {
   const { userId } = req.user;
   const{receiverId,taskId}=req.body;
 

  const result = await TaskService.sendTaskToFriend(userId,receiverId,taskId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:  "Task send successfully",
    data: result,
  });
});

const getAllFriendTask = catchAsync(async (req, res) => {
   const { userId } = req.user;

 

  const result = await TaskService.getAllFriendTask(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:  "Get friend Task  successfully",
    data: result,
  });
});

const respondToTaskShare = catchAsync(async (req, res) => {
   const { userId } = req.user;

   const {shareId,data}= req.body

 

  const result = await TaskService.respondToTaskShare(userId,shareId,data);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:  "Update friend Task  successfully",
    data: result,
  });
});


const graph = catchAsync(async (req, res) => {
  const { userId } = req.user; // logged-in user
  const { type, date } = req.query; // type = daily | monthly

  const result = await TaskService.graph(userId, type as string, date as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task statistics fetched successfully",
    data: result,
  });
});

export const MicroGoalControllers = {
  updateMicroGoalController,
  getSingleMicroGoalController,
  getAllTask,
  singleTask,
  updateTask,
  sendTaskToFriend,
  respondToTaskShare,
  getAllFriendTask,
  createTask,
  graph
  
};
