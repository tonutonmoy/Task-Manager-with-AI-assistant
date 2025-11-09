import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

import { calculatePagination } from '../../utils/calculatePagination';
import { ConnectionServices } from './connection.service';


// ✅ Send Connection Request
const sendRequest = catchAsync(async (req, res) => {
  const { userId } = req.user; // sender
  const { receiverId } = req.body;

  const result = await ConnectionServices.sendConnectionRequest(userId, receiverId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Connection request sent successfully',
    data: result,
  });
});

// ✅ Accept Connection Request
const acceptRequest = catchAsync(async (req, res) => {
  const { userId } = req.user; // receiver
  const { connectionId } = req.body;

  const result = await ConnectionServices.acceptConnectionRequest(connectionId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Connection request accepted successfully',
    data: result,
  });
});

// ✅ Reject Connection Request
const rejectRequest = catchAsync(async (req, res) => {
  const { userId } = req.user; // receiver
  const { connectionId } = req.body;

  const result = await ConnectionServices.rejectConnectionRequest(connectionId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Connection request rejected successfully',
    data: result,
  });
});

// ✅ Get All User Connections
const getConnections = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { skip, limit, page } = calculatePagination({});

  const result = await ConnectionServices.getUserConnections(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Connections retrieved successfully',
     data:result
  });
});

// ✅ Get Pending Requests
const getPendingRequests = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { skip, limit, page } = calculatePagination({});

  const { data, total } = await ConnectionServices.getPendingRequests(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Pending connection requests retrieved successfully',
    meta: {
      limit,
      page,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data,
  });
});

export const ConnectionControllers = {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getConnections,
  getPendingRequests,
};
