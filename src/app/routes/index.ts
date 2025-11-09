import express,{Request,Response} from 'express';
import { AuthRouters } from '../modules/Auth/auth.routes';
import { UserRouters } from '../modules/User/user.routes';



import { upload } from '../middlewares/upload';
import { uploadFile } from '../utils/uploadFile';
import { ConnectionRouters } from '../modules/Connection/connection.routes';
import { CommunityRouters } from '../modules/Community/community.routes';
import { JobTaskRouters } from '../modules/Job/job.routes';
import { MyDayRoutes } from '../modules/MyDay/mayDay.routes';
import { TaskRouters } from '../modules/Task/task.routes';
import { AIAssistanceRoutes } from '../modules/AIAssistance/aiAssistance.routes';
import { subscriptionRouter } from '../modules/stripe/stripe.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRouters,
  },
  {
    path: '/users',
    route: UserRouters,
  },
  {
    path: '/connection',
    route: ConnectionRouters,
  },
  {
    path: '/community',
    route: CommunityRouters,
  },
  {
    path: '/job-task',
    route: JobTaskRouters,
  },
  {
    path: '/my-day',
    route: MyDayRoutes,
  },
  {
    path: '/plan',
    route: TaskRouters,
  },
  {
    path: '/assistance',
    route: AIAssistanceRoutes,
  },
    {
    path: '/stripe',
    route: subscriptionRouter,
  },

];
moduleRoutes.forEach(route => router.use(route.path, route.route));
router.post("/upload", upload.single("upload"), (req: Request, res: Response) => {
  if (req.file) {
    const result = uploadFile(req.file);
    result.then((response) => {
      if (response.success) {
        return res.status(200).json(response);
      } else {
        return res.status(400).json(response);
      }
    });
  } else {
    return res.status(400).json({ success: false, error: "No file provided" });
  }
});



// router.post("/upload", upload.array("upload", 15), async (req: Request, res: Response) => {
//   if (!req.files || !(req.files instanceof Array) || req.files.length === 0) {
//     return res.status(400).json({ success: false, error: "No files provided" });
//   }

//   const uploadPromises = req.files.map(file => uploadFile(file));
//   const results = await Promise.all(uploadPromises);

//   const successUploads = results.filter(result => result.success);
//   const failedUploads = results.filter(result => !result.success);

//   return res.status(200).json({
//     success: true,
//     uploaded: successUploads.map(u => u.url),
//     failed: failedUploads.map(f => f.error),
//   });
// });

export default router;
