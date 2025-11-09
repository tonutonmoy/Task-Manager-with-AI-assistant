import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { JobTaskValidations } from './job.validation';
import { JobTaskControllers } from './job.controller';


const router = express.Router();

router.post(
  '/',
  auth(),
  validateRequest(JobTaskValidations.createJobTask),
  JobTaskControllers.createJobTask
);

router.get('/', auth(), JobTaskControllers.getAllJobTasks);

router.get('/my-posted/me', auth(), JobTaskControllers.getMyPostedJobFromDB);
router.get('/my-apply/me', auth(), JobTaskControllers.getMyApply);

router.get('/:id', auth(), JobTaskControllers.getSingleJobTask);

router.put(
  '/:id',
  auth(),
  validateRequest(JobTaskValidations.updateJobTask),
  JobTaskControllers.updateJobTask
);

router.delete('/:id', auth(), JobTaskControllers.deleteJobTask);



router.post('/job-request/:jobId', auth(), JobTaskControllers.createJobRequest);



// Owner accept/reject/feedback দিবে
router.patch('/job-request/:id', auth(), JobTaskControllers.updateJobRequestStatus);


router.get('/job-review/me', auth(), JobTaskControllers.getMyJobReviewFromDB);



export const JobTaskRouters = router;
