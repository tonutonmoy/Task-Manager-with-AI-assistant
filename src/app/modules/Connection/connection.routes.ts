import express from 'express';
import auth from '../../middlewares/auth';
import { ConnectionControllers } from './connection.controller';
import { UserRoleEnum } from '../User/user.constant';



// চাইলে পরে ConnectionValidations আলাদা করে বানানো যাবে
// import { ConnectionValidations } from './connection.validation';

const router = express.Router();

// ✅ Send connection request
router.post(
  '/send',
  auth(UserRoleEnum.USER),
  // validateRequest(ConnectionValidations.sendRequest),
  ConnectionControllers.sendRequest,
);

// ✅ Accept connection request
router.post(
  '/accept',
auth(UserRoleEnum.USER),
  // validateRequest(ConnectionValidations.handleRequest),
  ConnectionControllers.acceptRequest,
);

// ✅ Reject connection request
router.post(
  '/reject',
auth(UserRoleEnum.USER),
  // validateRequest(ConnectionValidations.handleRequest),
  ConnectionControllers.rejectRequest,
);

// ✅ Get all user connections
router.get(
  '/',
auth(UserRoleEnum.USER),
  ConnectionControllers.getConnections,
);

// ✅ Get pending connection requests
router.get(
  '/pending',
auth(UserRoleEnum.USER),
  ConnectionControllers.getPendingRequests,
);

export const ConnectionRouters = router;
