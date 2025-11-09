import httpStatus from 'http-status';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';

const createJobTaskIntoDB = async (payload: any) => {
  const { userId, startDate, endDate } = payload;

    const UserSubscription:any= await prisma.userSubscription.findFirst({
       where:{
        userId
       },
       include:{plan:true}
    })
 if (!UserSubscription) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized! please update your plan');
      }


      if(UserSubscription.plan.price<1){
            throw new AppError(httpStatus.UNAUTHORIZED, `You are not authorized! your using ${UserSubscription.plan.name}.  please update your plan`);
          }

   
  const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

const totalJobTaskThisMonth = await prisma.jobTask.count({
  where: {
    userId: userId,
    createdAt: {
      gte: startOfMonth, 
      lte: endOfMonth,   
    },
  },
});

  // --- Plan features থেকে limit বের করা
  const postLimit = UserSubscription?.plan?.features?.taskLimit?.post;



  if(totalJobTaskThisMonth>=postLimit){
    throw new AppError(httpStatus.UNAUTHORIZED,  `You have reached your post limit ${postLimit} for this month.`);

  }




  if (new Date(startDate) > new Date(endDate)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Start date cannot be after end date');
  }

  const result = await prisma.jobTask.create({
    data: payload,
  });

  return {id:result.id};
};



interface LocationFilter {
  lat: number;
  lng: number;
  distance: number; // km
}

const getAllJobTasksFromDB = async (
  userId:string,
  page: number = 1,
  limit: number = 10,
  location?: LocationFilter
) => {
  const skip = (page - 1) * limit;

  // প্রথমে সব job আনছি
  const jobs = await prisma.jobTask.findMany({
     where: {
    NOT: {
      userId: userId, 
    },
  },
    include: {
      user: { select: { name: true, email: true, skill: true, number: true,image:true } },
      JobRequest:true
    },
    
    orderBy: { createdAt: "desc" },
  });

  
  
   
const updatedJobs = jobs.map((job: any) => {
  const hasRequested =
    job.JobRequest?.some((req: any) => req.userId === userId)?true : false;

  return {
    ...job,
    isRequested: hasRequested,
    JobRequest: undefined, // remove JobRequest from final output
  };
});


  let filteredJobs = updatedJobs;

  // যদি location filter থাকে
  if (location) {
    const { lat, lng, distance }:any = location ;
    const R = 6371; // Earth radius in km

    filteredJobs = jobs.filter((job:any) => {
      if (!job.accurateLocation?.lat || !job.accurateLocation?.lng) return false;

      const jobLat = job.accurateLocation.lat;
      const jobLng = job.accurateLocation.lng;

      const dLat = ((jobLat - lat) * Math.PI) / 180;
      const dLng = ((jobLng - lng) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((jobLat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c; // distance in km

      return d <= distance;
    });
  }

  const total = filteredJobs.length;
  const paginatedJobs = filteredJobs.slice(skip, skip + limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: paginatedJobs,
  };
};

const getSingleJobTaskFromDB = async (id: string) => {
  const result = await prisma.jobTask.findUnique({
    where: { id },
    include: {
      user: {   // Job owner
        select: {
          name: true,
          email: true,
          skill: true,
          number: true,
        },
      },
      JobRequest: {   // যারা request করেছে
        include: {
          user: {   // request user info
            select: {
              name: true,
              email: true,
              skill: true,
              number: true,
            },
          },
        },
      },
    },
  });

  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Job Task not found');

  // Owner info আলাদা key তে attach করতে চাইলে
  const response:any = {
    ...result,
    owner: result.user,
    JobRequest: result.JobRequest,
  };

  delete response.user;

  return response;
};

const updateJobTaskIntoDB = async (id: string, payload: any) => {
  const result = await prisma.jobTask.update({
    where: { id },
    data: payload,
  });
  return {id:result.id};
};


const deleteJobTaskFromDB = async (id: string) => {
  const result = await prisma.jobTask.delete({
    where: { id },
  });
  return {id:result.id};
};


const createJobRequestIntoDB = async (payload: { jobId: string; userId: string }) => {

 const UserSubscription:any= await prisma.userSubscription.findFirst({
       where:{
        userId:payload.userId
       },
       include:{plan:true}
    })
 if (!UserSubscription) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized! please update your plan');
      }


      if(UserSubscription.plan.price<1){
            throw new AppError(httpStatus.UNAUTHORIZED, `You are not authorized! your using ${UserSubscription.plan.name}.  please update your plan`);
          }

   
  const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

const totalJobRequestMonth = await prisma.jobRequest.count({
  where: {
    userId: payload.userId,
    createdAt: {
      gte: startOfMonth, 
      lte: endOfMonth,   
    },
  },
});

  // --- Plan features থেকে limit বের করা
  const applyLimit = UserSubscription.plan.features.taskLimit.apply;


  if(totalJobRequestMonth>=applyLimit){
    throw new AppError(httpStatus.UNAUTHORIZED,  `You have reached your apply limit ${applyLimit} for this month.`);

  }








  // আগের request খুঁজে দেখব
  const existing = await prisma.jobRequest.findFirst({
    where: { jobId: payload.jobId, userId: payload.userId },
  });

  if (existing) {
    if (existing.status === 'REJECTED') {
      // REJECTED → PENDING এ আপডেট
      const updated = await prisma.jobRequest.update({
        where: { id: existing.id },
        data: { status: 'PENDING', feedback: null },
      });
      return {id:updated.id};
    } else {
      // PENDING বা ACCEPTED → error
      throw new AppError(httpStatus.CONFLICT, `Cannot request. Current status: ${existing.status}`);
    }
  }

  // নতুন request তৈরি করা
  const result = await prisma.jobRequest.create({
    data: payload,
  });
  return {id: result.id};
};

const getJobRequestsForOwnerFromDB = async (jobId: string, ownerId: string) => {
  // owner যাচাই
  const job = await prisma.jobTask.findFirstOrThrow({
    where: { id: jobId, userId: ownerId },
    include: { JobRequest: { include: { user: {select:{name:true,email:true,skill:true,number:true}} } } },
  });

  return job.JobRequest;
};

const getMyPostedJobFromDB = async (
  ownerId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  // ✅ owner এর job গুলো pagination + order
  const jobs = await prisma.jobTask.findMany({
    where: { userId: ownerId },
    orderBy: { createdAt: "asc" }, // আগে তৈরি হওয়া job আগে
    skip,
    take: limit,
    include: {
      JobRequest: {
        include: {
          user: true,
        },
      },
    },
  });

  // ✅ প্রতিটি job-এর সাথে তার request details যোগ করা
  const result = jobs.map((job:any) => {
    const requests = job.JobRequest.map((req:any) => ({
      jobRequestId: req.id,
      userId:req.user.id,
      isComplete: req.isComplete,
      name: req.user?.name,
      profile_image: req.user?.image,
      profession: req.user?.skill,
      rating: req.rating,
    }));
    delete job.JobRequest

    return {
      ...job,
      requests, // 👈 এখানে আলাদা key তে পুরো list রাখছি
    };
  });

  // ✅ মোট job count
  const total = await prisma.jobTask.count({
    where: { userId: ownerId },
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};


const getMyJobReviewFromDB = async (
  ownerId: string,
  page: number = 1,
  limit: number = 10
) => {

  const skip = (page - 1) * limit;

  const jobRequests = await prisma.jobRequest.findMany({
    where: {

        userId: ownerId,

      NOT: {
        feedback: null,
      },
    },
    select: {
      feedback: true,
      rating: true,
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
    orderBy: { rating: "desc" }, // ⭐ rating বেশি আগে
    skip,
    take: limit,
  });

  
  console.log(ownerId)
  const total = await prisma.jobRequest.count({
    where: {
      job: {
        userId: ownerId,
      },
      NOT: {
        feedback: null,
      },
    },
  });

return {
  meta: {
    page,
    limit,
    total,
    totalPage: Math.ceil(total / limit), // ✅ singular
  },
  data: jobRequests.map((req) => ({
    feedback: req.feedback,
    rating: req.rating,
    userName: req.user.name,
    userImage: req.user.image,
  })),
};

};

const updateJobRequestStatusIntoDB = async (
  requestedUserId: string,
  requestId: string,
  ownerId: string,
  status: 'ACCEPTED' | 'REJECTED',
  feedback?: string,
  rating?: number
) => {
  // 1️⃣ নির্দিষ্ট request খুঁজে বের করা
  const request = await prisma.jobRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: { job: true },
  });

  // 2️⃣ যাচাই করা — এই job কি owner-এর?
  if (request.job.userId !== ownerId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Not authorized!');
  }

  // 3️⃣ job টা আছে কিনা চেক
  const job = await prisma.jobTask.findFirst({
    where: { id: request.job.id },
  });

  if (!job) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job not found!');
  }

  let result;

  // ✅ যদি request ACCEPT করা হয়
  if (status === 'ACCEPTED') {
    // jobTask-এ acceptedUserId আপডেট করো
    await prisma.jobTask.update({
      where: { id: request.job.id },
      data: { acceptedUserId: requestedUserId },
    });

    // request status update করো
  return  result = await prisma.jobRequest.update({
      where: { id: requestId },
      data: { status,isComplete:true },
    });
  }


 if( status === "REJECTED") {
    // jobTask-এ rejectedUsers push করো
    await prisma.jobTask.update({
      where: { id: request.job.id },
      data: {
        rejectedUsers: {
          push: requestedUserId,
        },
        
      },
    });


    // request status update করো
 return   result = await prisma.jobRequest.update({
      where: { id: requestId },
      data: { status,isComplete:true },
    });
  }



  
    if(feedback||rating){
      
       return   result = await prisma.jobRequest.update({
      where: { id: requestId },
      data: { rating,feedback },
    });

    }

  return result;
};


const getMyApplyDB = async (userId: string,status:"PENDING") => {


  const  result= await prisma.jobRequest.findMany({

    where:{
      userId,
      status:status
    },
    include:{
      job:{
        include:{user:true}
      },
      
    }

  })


  const formatedResult= result.map((jobRequest)=>{

     

    return{
      job_id:jobRequest.job.id,
      job_title:jobRequest.job.title,
      job_description:jobRequest.job.description,
      job_city:jobRequest.job.city,
      job_state:jobRequest.job.state,
      job_zip_code:jobRequest.job.zip_code,
      job_paid:jobRequest.job.isPaid,
      job_amount:jobRequest.job.amount,
      job_working_time:`${jobRequest.job.startDate} to ${jobRequest.job.endDate}`,
      job_phone:jobRequest.job.mobileNumber,
      feedback:jobRequest.feedback,
      rating:jobRequest.rating,
      user_id:jobRequest.job.user.id,
      user_name:jobRequest.job.user.name,
      user_profile_image:jobRequest.job.user.image,
      status:jobRequest.status



    }
    
   


  })




return formatedResult

}



export const JobTaskServices = {
  createJobTaskIntoDB,
  getAllJobTasksFromDB,
  getSingleJobTaskFromDB,
  updateJobTaskIntoDB,
  deleteJobTaskFromDB,
    createJobRequestIntoDB,
  getJobRequestsForOwnerFromDB,
  updateJobRequestStatusIntoDB,
  getMyPostedJobFromDB,
  getMyJobReviewFromDB,
  getMyApplyDB
};
