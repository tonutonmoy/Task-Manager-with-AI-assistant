import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

import httpStatus from "http-status";
import { MyDayServices } from "./myDay.service";

const createMyDay = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await MyDayServices.createMyDay(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "MyDay created successfully",
    data: result,
  });
});

const getMyDays = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const page = Number(req.query.page) || 1;   // default page 1
  const limit = Number(req.query.limit) || 10; // default 10 per page

  const result = await MyDayServices.getMyDays(userId, page, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "MyDays retrieved successfully",
    meta: result.meta,   // pagination meta
    data: result.data,
  });
});

const updateMyDay = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const result = await MyDayServices.updateMyDay(id, userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "MyDay updated successfully",
    data: result,
  });
});

const deleteMyDay = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const result = await MyDayServices.deleteMyDay(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "MyDay deleted successfully",
    data: result,
  });
});

const getSingleMyDayController = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  const result = await MyDayServices.getSingleMyDay(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "MyDay retrieved successfully",
    data: result,
  });
});


export const MyDayControllers = {
  createMyDay,
  getMyDays,
  updateMyDay,
  deleteMyDay,
  getSingleMyDayController
};
