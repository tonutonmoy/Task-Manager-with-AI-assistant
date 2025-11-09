import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { AIAssistanceService } from "./aiAssistance.service";

const voiceWithAIController = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const file = req.file;

  if (!file) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "File is required",
      data: null,
    });
  }

  // Extra fields example
  const extraFields = {
    sessionId: req.body.sessionId || "defaultSession",
  };


    let gender;
  if (req.body.data) {
    // যদি JSON string আকারে পাঠাও (যেমন {"gender":"female"})
    try {
      gender = JSON.parse(req.body.data);
    } catch {
      gender = req.body; // fallback
    }
  } 

  const result = await AIAssistanceService.voiceWithAI(userId, file, extraFields,gender);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Voice processed successfully",
    data: result,
  });
});


const chatWithAI = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const result = await AIAssistanceService.chatWithAI(userId,req.body.user_query,req.body.query_type);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "create  chat successfully",
    data: result,
  });
});
const allChat = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const result = await AIAssistanceService.allChat(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Get all chat successfully",
    data: result,
  });
});

export const AIAssistanceController = {
  voiceWithAI: voiceWithAIController,
  allChat,
  chatWithAI
};
