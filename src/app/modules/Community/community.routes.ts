import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';

import { CommunityValidations } from './community.validation';
import { CommunityControllers } from './comments.controller';

const router = express.Router();

// Create post
router.post(
  '/',
  auth(),
  validateRequest(CommunityValidations.createPost),
  CommunityControllers.createPost
);
router.get(
  '/',
  auth(), CommunityControllers.getAllPosts
);

// Edit post
router.put(
  '/:id',
  auth(),
  validateRequest(CommunityValidations.editPost),
  CommunityControllers.editPost
);

// Delete post
router.delete('/:id', auth(), CommunityControllers.deletePost);

// Get own posts
router.get('/me', auth(), CommunityControllers.getOwnPosts);

// News feed
router.get('/feed', auth(), CommunityControllers.getNewsFeed);

export const CommunityRouters = router;
