import cron from "node-cron";
import { dailyReminders } from "./dailyRemindersNotifaction";
import prisma from "./prisma";
import { firebasePushNotificationServices } from "../modules/Firebase/firebasePushNotificationServices";


// 🔹 Random motivational reminder select করার ফাংশন
function getRandomReminder(): string {
  return dailyReminders[Math.floor(Math.random() * dailyReminders.length)];
}

// 🔹 আজকের দিনের শুরুর এবং শেষের সময় বের করা
function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}






  export const cronJob=()=>{
    
    
    cron.schedule("0 12 * * *", async () => {
  console.log("🕛 Running daily reminder job...");

  try {
    const { start, end } = getTodayRange();

    // যারা আজ কোনো Task তৈরি করেনি — তাদের খোঁজ নাও
    const usersWithoutTask = await prisma.user.findMany({
      where: {
        Task: {
          none: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        },
        notification: true, // শুধু যাদের notification অন আছে
        fcmToken: { not: null }, // যাদের FCM token আছে
      },
      select: {
        id: true,
        name: true,
        email: true,
        fcmToken: true,
      },
    });

    if (!usersWithoutTask.length) {
      console.log("✅ আজ সবাই task তৈরি করেছে — কোনো reminder দরকার নেই!");
      return;
    }

    console.log(`📋 ${usersWithoutTask.length} জন ইউজার আজ task তৈরি করেনি।`);

    // 🔹 প্রত্যেক user কে এক এক করে notification পাঠানো
    for (const user of usersWithoutTask) {
      const reminder = getRandomReminder();

      const body = {
        title: "AI-ASSIST",
        body: reminder,
      };

      try {
        await firebasePushNotificationServices.sendSinglePushNotification({
          body,
          fcmToken: user.fcmToken!,
        });

        console.log(`✅ Reminder sent to ${user.name} (${user.email})`);
      } catch (err:any) {
       console.error(`❌ Failed to send reminder to ${user.email}:`, err);

    // 🔹 যদি FCM token invalid বা expired হয় → DB থেকে remove করে দিচ্ছি
    const errorCode = err?.errorInfo?.code;
    if (
      errorCode === "messaging/invalid-argument" ||
      errorCode === "messaging/registration-token-not-registered"
    ) {
      await prisma.user.update({
        where: { id: user.id },
        data: { fcmToken: null },
      });
      console.log(`🗑️ Invalid FCM token removed for ${user.email}`);
    }
      }

      // 🔹 চাইলে Database Notification এও সেভ করতে পারো
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "AI-ASSIST",
          message: reminder,
        },
      });
    }

    console.log("🎯 Daily reminders sent successfully!");
  } catch (err: any) {
    console.log(err)
  }
});

}
