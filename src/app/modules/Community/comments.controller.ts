import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CommunityServices } from './community.service';

const createPost = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  req.body.userId = userId;
  const result = await CommunityServices.createCommunityPost(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Post created successfully',
    data: result,
  });
});

const editPost = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const postId = req.params.id;
  const result = await CommunityServices.editCommunityPost(postId, userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Post updated successfully',
    data: result,
  });
});

const deletePost = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const postId = req.params.id;
  const result = await CommunityServices.deleteCommunityPost(postId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Post deleted successfully',
    data: result,
  });
});

const getOwnPosts = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const result = await CommunityServices.getOwnPosts(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Own posts fetched successfully',
    data: result,
  });
});


const getAllPosts = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result:any = await CommunityServices.allPost(page, limit,req.user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All posts fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});


const getNewsFeed = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const limit = Number(req.query.limit) || 10;
  const result = await CommunityServices.getNewsFeed(userId, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'News feed fetched successfully',
    data: result,
  });
});

export const CommunityControllers = {
  createPost,
  editPost,
  deletePost,
  getOwnPosts,
  getNewsFeed,
  getAllPosts
};
