import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { JobTaskServices } from './job.service';


const createJobTask = catchAsync(async (req, res) => {
  const { userId } = req.user;
  req.body.userId = userId;

  const result = await JobTaskServices.createJobTaskIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Job Task created successfully',
    data: result,
  });
});

const getAllJobTasks = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
  const distance = req.query.distance ? parseFloat(req.query.distance as string) : undefined;

  const locationFilter =
    lat !== undefined && lng !== undefined && distance !== undefined
      ? { lat, lng, distance }
      : undefined;

  const result = await JobTaskServices.getAllJobTasksFromDB( req.user.userId,page, limit, locationFilter);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Jobs retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});


const getMyPostedJobFromDB = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await JobTaskServices.getMyPostedJobFromDB(userId, page, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All my posted jobs retrieved successfully',
    meta: result.meta,   // ✅ pagination info
    data: result.data,   // ✅ paginated jobs
  });
});


const getMyJobReviewFromDB = catchAsync(async (req, res) => {
  const { userId } = req.user; // ✅ owner user
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await JobTaskServices.getMyJobReviewFromDB(userId, page, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All my reviews retrieved successfully',
    meta: result.meta, // ✅ pagination info
    data: result.data,
  });
});


const getSingleJobTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await JobTaskServices.getSingleJobTaskFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Job Task retrieved successfully',
    data: result,
  });
});

const updateJobTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await JobTaskServices.updateJobTaskIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Job Task updated successfully',
    data: result,
  });
});

const deleteJobTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await JobTaskServices.deleteJobTaskFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Job Task deleted successfully',
    data: result,
  });
});



const createJobRequest = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const payload = { jobId: req.params.jobId, userId };

  const result = await JobTaskServices.createJobRequestIntoDB(payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Job request sent successfully',
    data: result,
  });
});



const updateJobRequestStatus = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { status, feedback,rating,requestedUserId } = req.body;

  const result = await JobTaskServices.updateJobRequestStatusIntoDB(
    requestedUserId,
    id,
    userId,
    status,
    feedback,
    rating
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Job request updated successfully',
    data: result,
  });
});


const getMyApply = catchAsync(async (req, res) => {
  const { userId } = req.user;
  
  const result = await JobTaskServices.getMyApplyDB(
    userId,
    req.body.status
 
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Get my Job request updated successfully',
    data: result,
  });
});

export const JobTaskControllers = {
  createJobTask,
  getAllJobTasks,
  getSingleJobTask,
  updateJobTask,
  deleteJobTask,
   createJobRequest,

  updateJobRequestStatus,
  getMyPostedJobFromDB,
  getMyJobReviewFromDB,
  getMyApply
};
