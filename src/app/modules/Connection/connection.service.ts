import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';
import { firebasePushNotificationServices } from '../Firebase/firebasePushNotificationServices';

const sendConnectionRequest = async (senderId: string, receiverId: string) => {
  // আগের connection খুঁজে বের করা
  const existing = await prisma.connection.findFirst({
    where: { senderId, receiverId },
  });

  if (existing) {
    if (existing.status === 'PENDING'||existing.status === 'ACCEPTED') {
      // যদি আগের request PENDING থাকে → block
      throw new AppError(httpStatus.EXPECTATION_FAILED, 'Connection request already sent!');
    } else if (existing.status === 'REJECTED') {
      // যদি REJECTED থাকে → update করে PENDING করা
      const updatedRequest = await prisma.connection.update({
        where: { id: existing.id },
        data: { status: 'PENDING' },
      });

      // Receiver info & sender name
      const receiverUser = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { fcmToken: true },
      });

      const senderUser = await prisma.user.findUnique({
        where: { id: senderId },
        select: { name: true },
      });

      // Notification তৈরি
      const notification = await prisma.notification.create({
        data: {
          userId: receiverId,
          type: 'CONNECTION_REQUEST',
          message: `You have a new connection request from user ${senderUser?.name}`,
        },
      });

      // Push notification পাঠানো
      if (receiverUser?.fcmToken) {
        await firebasePushNotificationServices.sendSinglePushNotification({
          body: { title: notification.type, body: notification.message },
          fcmToken: receiverUser.fcmToken,
        });
      }

      return updatedRequest;
    }
  }

  // আগের request না থাকলে → নতুন create করা
  const result = await prisma.connection.create({
    data: { senderId, receiverId, status: 'PENDING' },
  });

  const receiverUser = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { fcmToken: true },
  });

  const senderUser = await prisma.user.findUnique({
    where: { id: senderId },
    select: { name: true },
  });

  const notification = await prisma.notification.create({
    data: {
      userId: receiverId,
      type: 'CONNECTION_REQUEST',
      message: `You have a new connection request from user ${senderUser?.name}`,
    },
  });

  if (receiverUser?.fcmToken) {
    await firebasePushNotificationServices.sendSinglePushNotification({
      body: { title: notification.type, body: notification.message },
      fcmToken: receiverUser.fcmToken,
    });
  }

  return result;
};

const acceptConnectionRequest = async (connectionId: string, receiverId: string) => {
  const result = await prisma.connection.update({
    where: { id: connectionId },
    data: { status: 'ACCEPTED' },
  });

  // Sender user বের করি
  const senderUser = await prisma.user.findUnique({
    where: { id: result.senderId },
    select: { fcmToken: true },
  });

    const receiverUser = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { name: true },
  });
  

  // Notification তৈরি
  const notification = await prisma.notification.create({
    data: {
      userId: result.senderId,
      type: 'CONNECTION_ACCEPTED',
      message: `Your connection request was accepted by user ${receiverUser?.name}`,
    },
  });

  // Push notification পাঠানো
  if (senderUser?.fcmToken) {
    await firebasePushNotificationServices.sendSinglePushNotification({
      body: {
        title: notification.type,
        body: notification.message,
      },
      fcmToken: senderUser.fcmToken,
    });
  }

  return result;
};

const rejectConnectionRequest = async (connectionId: string, receiverId: string) => {
  const result = await prisma.connection.update({
    where: { id: connectionId },
    data: { status: 'REJECTED' },
  });

  // Sender বের করি
  const senderUser = await prisma.user.findUnique({
    where: { id: result.senderId },
    select: { fcmToken: true },
  });

  
    const receiverUser = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { name: true },
  });

  // Notification তৈরি
  const notification = await prisma.notification.create({
    data: {
      userId: result.senderId,
      type: 'CONNECTION_REJECTED',
      message: `Your connection request was rejected by user ${receiverUser?.name}`,
    },
  });

  // Push notification পাঠানো
  if (senderUser?.fcmToken) {
    await firebasePushNotificationServices.sendSinglePushNotification({
      body: {
        title: notification.type,
        body: notification.message,
      },
      fcmToken: senderUser.fcmToken,
    });
  }

  return result;
};



const getUserConnections = async (userId: string, suggestionLimit = 10) => {
  // 1️⃣ Already accepted connections fetch করা
  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { senderId: userId, status: 'ACCEPTED' },
        { receiverId: userId, status: 'ACCEPTED' },
      ],
    },
    include: {
      sender: { select: { id: true, name: true, email: true, image: true, skill: true } },
      receiver: { select: { id: true, name: true, email: true, image: true, skill: true } },
    },
  });

  // শুধু other user info filter করা
  const connectedUsers = connections.map(conn => 
    conn.senderId === userId ? conn.receiver : conn.sender
  );

  // 2️⃣ Suggestion এর জন্য exclude list বানানো
  const excludedIds = new Set<string>();
  excludedIds.add(userId); // নিজেকে exclude
  connections.forEach(conn => {
    excludedIds.add(conn.senderId);
    excludedIds.add(conn.receiverId);
  });

  // 3️⃣ Suggested users fetch করা (role = 'USER' এবং connection নেই)
  const suggestedUsers = await prisma.user.findMany({
    where: {
      role: 'USER',
      id: { notIn: Array.from(excludedIds) },
    },
    select: { id: true, name: true, email: true, image: true, skill: true },
    take: suggestionLimit,
    orderBy: { createdAt: 'desc' }, // চাইলে shuffle করতে পারো
  });

   
const suggestedUsersFinter= suggestedUsers.filter((a)=> a.id!==userId)

console.log(userId)


  return {
    connections: {
      data: connectedUsers,
      total: connectedUsers.length,
    },
    suggestions: {
      data: suggestedUsersFinter,
      total: suggestedUsersFinter.length,
    },
  };
};



const getPendingRequests = async (userId: string) => {
  const data = await prisma.connection.findMany({
    where: { receiverId: userId, status: 'PENDING' },
    include: { sender:{select:{name:true,email:true,image:true,skill:true}} },
  });

  return { data, total: data.length };
};

export const ConnectionServices = {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getUserConnections,
  getPendingRequests,
};
