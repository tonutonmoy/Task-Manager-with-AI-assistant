import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import prisma from "../../utils/prisma";
import axios from "axios";
import { firebasePushNotificationServices } from "../Firebase/firebasePushNotificationServices";
import { startOfDay, endOfDay } from "date-fns";

const updateMicroGoal = async (
  userId: string,
  payload: Partial<{
    mind: boolean;
    body: boolean;
    soul: boolean;
    purpose: boolean;
    spirituality: boolean;
  }>
) => {
  // Step 1: প্রথম MicroGoal খুঁজে পাওয়া
  const microGoal = await prisma.microGoal.findFirst({
    where: { userId },
  });

  if (!microGoal) {

    throw new AppError(httpStatus.NOT_FOUND, "MicroGoal not found");

  }

  // Step 2: Update using primary key (id)
  const updated = await prisma.microGoal.update({
    where: { id: microGoal.id },
    data: payload,
  });

  return updated;
};

const getSingleMicroGoal = async (userId: string) => {
  const microGoal = await prisma.microGoal.findFirst({
    where: { userId },
  });

  return microGoal

};






const createTask = async (userId: string,userdataString:string) => {

 
  const user = await prisma.user.findFirst({
    where: { id: userId },
    include: {
      MicroGoal: true,
      Task: true,
    },
  });



  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized!");
  }
  if (!user.age) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Age not found! please update youer age");
  }
  if (!user.goal) {
    throw new AppError(httpStatus.UNAUTHORIZED, "goal not found! please update youer goal");
  }

  // Step 1: MicroGoal থেকে userdataString তৈরি
  // const userdataString = user.MicroGoal
  //   .map((mg) => {
  //     const parts: string[] = [];
  //     if (mg.mind) parts.push("mind");
  //     if (mg.purpose) parts.push("purpose");
  //     if (mg.soul) parts.push("soul");
  //     if (mg.spirituality) parts.push("spirituality");
  //     if (mg.body) parts.push("body");
  //     return parts.join(", ");
  //   })
  //   .filter(Boolean) // empty string বাদ দিবে
  //   .join(", ");

  // Step 2: recent 5 tasks
  const tasks = user.Task
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .map((t) => ({ title: t.title, goal: t.goal }));

  // Step 3: Payload prepare
  const payload = {
    big_goal: user.goal,
    age: user.age,
    userdata: userdataString,
    tasks,
  };


    console.log(payload)

  // Step 4: Send to AI API
  try {
    const aiRes = await axios.post(
      `${process.env.AI_END_POINT}/api/microgoals/micro_goal`,
      
      payload
    );

  if (aiRes.data && Array.isArray(aiRes.data.day_plan)) {
  // যদি big_goal remove করতে চান
  delete aiRes.data.big_goal;

   return  await prisma.task.createMany({
    data: aiRes.data.day_plan.map((a: any) => ({
      userId: userId,
      category: a.category,
      title: a.title,
      goal: a.goal,
    })),
  });
}

      
   
  } catch (error: any) {
    console.error("AI API error:", error.message || error);
  }

  return payload;
};




const getAllTask = async (userId: string, date?: string) => {
  let dateFilter: any = {};

  // যদি user date না দেয়, তাহলে আজকের তারিখ ধরব
  const targetDate = date ? new Date(date) : new Date();

  // আজকের দিনের শুরু এবং শেষ সময় বের করা
  const start = startOfDay(targetDate);
  const end = endOfDay(targetDate);

  // date অনুযায়ী filter condition তৈরি
  dateFilter = {
    createdAt: {
      gte: start,
      lte: end,
    },
  };

  // Task গুলো বের করা (আজকের বা নির্দিষ্ট date অনুযায়ী)
  const task = await prisma.task.findMany({
    where: {
      userId,
      ...dateFilter,
    },
    orderBy: { createdAt: "desc" },
  });

  // total count বের করা (আজকের বা নির্দিষ্ট date অনুযায়ী)
  const totalCount = await prisma.task.count({
    where: {
      userId,
      ...dateFilter,
    },
  });

  return {
    task,
    totalCount,
  };
};



const singleTask = async (id: string) => {
  const task = await prisma.task.findFirst({
    where: { id },
  });

  return task

};


const updateTask = async (id: string, isComplete: any) => {
  const task = await prisma.task.update({
    where: { id },
    data: {
      isComplete: isComplete, // নতুন মান সেট করা
    },
  });

  return task;
};



const getAllFriendTask = async (userId: string) => {
  const task = await prisma.taskShare.findMany({
    where: { receiverId:userId ,status:"pending"},
    include:{task:{include:{user:true}}}
  
  });

  const result= task.map((a)=>{
 

    return {
       shareId:a.id,
       user_name:a.task.user.name,
       user_image:a.task.user.image,
       focus_area:a.task.category,
       title:a.task.title,
       description:a.task.goal,





      }


  })

  return result;
};




const sendTaskToFriend = async (senderId: string, receiverId: string, taskId: string) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId: senderId },
  });
  if (!task) throw new AppError(httpStatus.FORBIDDEN, "You can only send your own tasks!");

  const receiverUser = await prisma.user.findUnique({ where: { id: receiverId } });
  const senderUser = await prisma.user.findUnique({ where: { id: senderId } });
  if (!receiverUser) throw new AppError(httpStatus.NOT_FOUND, "Friend not found!");

  const existing = await prisma.taskShare.findFirst({
    where: { taskId, receiverId },
  });
  if (existing) throw new AppError(httpStatus.CONFLICT, "Already sent to this friend!");

  const shared = await prisma.taskShare.create({
    data: {
      taskId,
      senderId,
      receiverId,
    },
  });

  // 🧩 Database notification create
  const notification = await prisma.notification.create({
    data: {
      userId: receiverId,
      type: "TASK_REQUEST",
      message: `${senderUser?.name} shared a task "${task.title}" with you.`,
    },
  });

  // 🔔 Push notification পাঠানো
  if (receiverUser?.fcmToken) {
    await firebasePushNotificationServices.sendSinglePushNotification({
      body: { title: notification.type, body: notification.message },
      fcmToken: receiverUser.fcmToken,
    });
  }

  return shared;
};


// ✅ Friend accept / reject করবে
const respondToTaskShare = async (
  receiverId: string,
  shareId: string,
  action: "accept" | "reject"
) => {
  const share = await prisma.taskShare.findFirst({
    where: { id: shareId, receiverId },
    include: { task: true, sender: true, receiver: true },
  });
  if (!share) throw new AppError(httpStatus.NOT_FOUND, "Request not found!");

  const updated = await prisma.taskShare.update({
    where: { id: shareId },
    data: { status: action === "accept" ? "accepted" : "rejected" },
  });

  // যদি accept করে, তাহলে receiver এর জন্য task তৈরি হবে
  if (action === "accept") {
    await prisma.task.create({
      data: {
        userId: receiverId,
        title: share.task.title,
        goal: share.task.goal,
        category: share.task.category,
      },
    });
  }

  // 🧩 Notification তৈরি
  const notification = await prisma.notification.create({
    data: {
      userId: share.senderId,
      type: "TASK_RESPONSE",
      message:
        action === "accept"
          ? `${share.receiver.name} accepted your shared task "${share.task.title}".`
          : `${share.receiver.name} rejected your shared task "${share.task.title}".`,
    },
  });

  // 🔔 Push notification পাঠানো
  if (share.sender?.fcmToken) {
    await firebasePushNotificationServices.sendSinglePushNotification({
      body: { title: notification.type, body: notification.message },
      fcmToken: share.sender.fcmToken,
    });
  }

  return updated;
};



//   if (!userId || !type) throw new Error("userId and type required");

//   // Only "monthly" supported here
//   if (type !== "monthly") throw new Error("Only 'monthly' type is supported for this route");

//   // Month mapping
//   const months: Record<string, number> = {
//     january: 0,
//     february: 1,
//     march: 2,
//     april: 3,
//     may: 4,
//     june: 5,
//     july: 6,
//     august: 7,
//     september: 8,
//     october: 9,
//     november: 10,
//     december: 11,
//   };

//   const monthNumber = months[date.toLowerCase()];
//   if (monthNumber === undefined) throw new Error("Invalid month name");

//   const currentYear = new Date().getFullYear();

//   // Start and end of the selected month of current year
//   const startDate = new Date(currentYear, monthNumber, 1);
//   const endDate = new Date(currentYear, monthNumber + 1, 0, 23, 59, 59, 999);

//   const tasks = await prisma.task.findMany({
//     where: {
//       // userId,
//       createdAt: {
//         gte: startDate,
//         lte: endDate,
//       },
//     },
//   });

//   const categoryStats: Record<string, number> = {
//     mind: 0,
//     purpose: 0,
//     soul: 0,
//     spirituality: 0,
//     body: 0,
//   };

//   tasks.forEach((t) => {
//     if (categoryStats[t.category] !== undefined) {
//       categoryStats[t.category]++;
//     }
//   });

//   return {
//     type: "monthly",
//     month: date,
//     year: currentYear,
//     data: categoryStats,
//   };
// };
// const graph = async (userId: string, type: string, date: string) => {
//   if (!userId || !type) throw new Error("userId and type required");

//   // Month mapping (for monthly)
//   const months: Record<string, number> = {
//     january: 0,
//     february: 1,
//     march: 2,
//     april: 3,
//     may: 4,
//     june: 5,
//     july: 6,
//     august: 7,
//     september: 8,
//     october: 9,
//     november: 10,
//     december: 11,
//   };

//   let startDate: Date;
//   let endDate: Date;
//   const currentYear = new Date().getFullYear();

//   // ✅ DAILY
//   if (type === "daily") {
//     if (!date) throw new Error("date is required for daily stats");
//     const selectedDay = new Date(date);
//     startDate = new Date(selectedDay.setHours(0, 0, 0, 0));
//     endDate = new Date(selectedDay.setHours(23, 59, 59, 999));
//   }

//   // ✅ MONTHLY
//   else if (type === "monthly") {
//     const monthNumber = months[date.toLowerCase()];
//     if (monthNumber === undefined) throw new Error("Invalid month name");

//     startDate = new Date(currentYear, monthNumber, 1);
//     endDate = new Date(currentYear, monthNumber + 1, 0, 23, 59, 59, 999);
//   }

//   // ❌ INVALID TYPE
//   else {
//     throw new Error("Invalid type. Use 'daily' or 'monthly'");
//   }

//   // 🔍 Fetch tasks within range
//   const tasks = await prisma.task.findMany({
//     where: {
//       // userId, 
//       createdAt: {
//         gte: startDate,
//         lte: endDate,
//       },
//     },
//   });

//   // 📊 Category-wise count
//   const categoryStats: Record<string, number> = {
//     mind: 0,
//     purpose: 0,
//     soul: 0,
//     spirituality: 0,
//     body: 0,
//   };

//   tasks.forEach((t) => {
//     if (categoryStats[t.category] !== undefined) {
//       categoryStats[t.category]++;
//     }
//   });

//   // 🧾 Return structured response
//   return {
//     type,
//     date,
//     year: currentYear,
//     data: categoryStats,
//   };
// };


const graph = async (userId: string, type: string, date: string) => {
  if (!userId || !type) throw new Error("userId and type required");

  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  // Month mapping
  const months: Record<string, number> = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };

  if (type === "monthly") {
    const monthNumber = months[date.toLowerCase()];
    if (monthNumber === undefined) throw new Error("Invalid month name");

    const currentYear = now.getFullYear();
    startDate = new Date(currentYear, monthNumber, 1);
    endDate = new Date(currentYear, monthNumber + 1, 0, 23, 59, 59, 999);
  } else if (type === "daily") {
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) throw new Error("Invalid date format, use YYYY-MM-DD");

    startDate = new Date(selectedDate.setHours(0, 0, 0, 0));
    endDate = new Date(selectedDate.setHours(23, 59, 59, 999));
  } else {
    throw new Error("Invalid type, must be 'daily' or 'monthly'");
  }

  // Fetch tasks
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Initialize stats object
  const categoryStats: Record<
    string,
    { total: number; complete: number; inProgress: number; percent: number }
  > = {
    mind: { total: 0, complete: 0, inProgress: 0, percent: 0 },
    purpose: { total: 0, complete: 0, inProgress: 0, percent: 0 },
    soul: { total: 0, complete: 0, inProgress: 0, percent: 0 },
    spirituality: { total: 0, complete: 0, inProgress: 0, percent: 0 },
    body: { total: 0, complete: 0, inProgress: 0, percent: 0 },
  };

  // Count totals & completed
  tasks.forEach((t) => {
    const category = t.category.toLowerCase();
    if (categoryStats[category]) {
      categoryStats[category].total++;
      if (t.isComplete === "complete") categoryStats[category].complete++;
      else categoryStats[category].inProgress++;
    }
  });

  // Calculate percentages
  for (const key in categoryStats) {
    const cat = categoryStats[key];
    cat.percent = cat.total > 0 ? Math.round((cat.complete / cat.total) * 100) : 0;
  }

  return {
    type,
    filterDate: date,
    data: categoryStats,
  };
};


export const TaskService = {
  updateMicroGoal,
  getSingleMicroGoal,
  createTask,
  getAllTask,
  singleTask,
  updateTask,
  respondToTaskShare,
  sendTaskToFriend,
  getAllFriendTask,
  graph
};
