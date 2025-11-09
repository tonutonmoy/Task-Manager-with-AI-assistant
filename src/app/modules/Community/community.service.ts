import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';
import { TaskService } from '../Task/task.service';
;

interface ICommunityPayload {
  userId: string;
  description?: string;
  mind?: number;
  body?: number;
  soul?: number;
  purpose?: number;
  spirituality?: number;
  isShare: boolean
}




const createCommunityPost = async (payload: ICommunityPayload) => {


  // যদি user isShare true দেয়
if (payload.isShare) {
  const today = new Date();
  const date = today.toISOString().split("T")[0];

  // ট্রানজ্যাকশন শুরু
  const result = await prisma.$transaction(async (tx) => {
    // graph ডেটা ফেচ (TaskService এর graph method)
    const graph: any = await TaskService.graph(payload?.userId, "daily", date);

    console.log(graph)

    // community post create
    const community = await tx.community.create({
      data: {
        userId: payload?.userId,
        description: payload?.description,
        mind: graph?.data?.mind?.inProgress,
        body: graph?.data?.body?.inProgress,
        soul: graph?.data?.soul?.inProgress,
        purpose: graph?.data?.purpose?.inProgress,
        spirituality: graph?.data?.spirituality?.inProgress,
        isShare:payload?.isShare?true:false
      },
    });

    // return value (transaction শেষ হবে)
    return { id: community.id };
  });

  return result;
}


  // Normal community post create
  const result = await prisma.community.create({
    data: {
      userId: payload.userId,
      description: payload.description,
    },
  });

 return {id:result.id};
};

export default createCommunityPost;


// 2️⃣ Edit Post (only owner)
const editCommunityPost = async (postId: string, userId: string, payload: Partial<ICommunityPayload>) => {
  // Check owner
  const post = await prisma.community.findUnique({ where: { id: postId } });

   if (!post){
        throw new AppError(httpStatus.NOT_FOUND, 'Post not found');
      }

 
  if (post.userId !== userId) 
    
    {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Not authorized to edit this post');
      }


  const updatedPost = await prisma.community.update({
    where: { id: postId },
    data: payload,
  });

  return {id:updatedPost.id};
};

// 3️⃣ Delete Post (only owner)
const deleteCommunityPost = async (postId: string, userId: string) => {
  const post = await prisma.community.findUnique({ where: { id: postId } });
    if (!post){
        throw new AppError(httpStatus.NOT_FOUND, 'Post not found');
      }

  if (post.userId !== userId) 
    
    {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Not authorized to edit this post');
      }


  await prisma.community.delete({ where: { id: postId } });
  return { message: 'Post deleted successfully' };
};


const allPost = async (page = 1, limit = 10, userId: string) => {
  // 1️⃣ ইউজার আছে কিনা চেক করা
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  // 2️⃣ সব posts load করা
  const posts = await prisma.community.findMany({
    select: {
      id: true,
      userId: true,
      description: true,
      isShare: true,
     mind  :true,

  body:true,         
  soul:true,        
  purpose:true,     
  spirituality :true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          name: true,
          image: true,
          skill: true,
          SentConnections: true,
          ReceivedConnections: true,
        },
      },
    },
  });

  // 3️⃣ Randomize / shuffle
  const shuffled = posts.sort(() => 0.5 - Math.random());

  // 4️⃣ Pagination
  const start = (page - 1) * limit;
  const paginatedPosts = shuffled.slice(start, start + limit);

  // 5️⃣ Connection চেক
paginatedPosts.forEach((element: any) => {
  element.isConnet = false;

  for (const rc of element.user.ReceivedConnections) {
    if (
      (rc.senderId === user.id || rc.receiverId === user.id) &&
      rc.status === "ACCEPTED"
    ) {
      element.isConnet = true;
      break;
    }
  }

  if (!element.isConnet) {
    for (const sc of element.user.SentConnections) {
      if (
        (sc.senderId === user.id || sc.receiverId === user.id) &&
        sc.status === "ACCEPTED"
      ) {
        element.isConnet = true;
        break;
      }
    }
  }

  // 🔥 Unwanted fields মুছে দিচ্ছি
  delete element.user.SentConnections;
  delete element.user.ReceivedConnections;
});
  return {
    data: paginatedPosts,
    meta: {
      total: posts.length,
      page,
      limit,
      totalPages: Math.ceil(posts.length / limit),
    },
  };
};



const getOwnPosts = async (userId: string) => {
  const posts = await prisma.community.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return { data: posts, total: posts.length };
};

// 5️⃣ News Feed (other users' posts) - only connections
const getNewsFeed = async (userId: string, limit = 10) => {
  // Get connected user ids
  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { senderId: userId, status: 'ACCEPTED' },
        { receiverId: userId, status: 'ACCEPTED' },
      ],
    },
    select: { senderId: true, receiverId: true },
  });

  const connectedUserIds = new Set<string>();
  connections.forEach(conn => {
    if (conn.senderId !== userId) connectedUserIds.add(conn.senderId);
    if (conn.receiverId !== userId) connectedUserIds.add(conn.receiverId);
  });

  // Fetch posts from connected users only, randomly
  const posts = await prisma.community.findMany({
    where: { userId: { in: Array.from(connectedUserIds) } },
    include: { user: { select: { id: true, name: true, image: true } } },
    take: limit,
    orderBy: { createdAt: 'desc' }, // চাইলে shuffle করতে পারো random
  });

  return { data: posts, total: posts.length };
};

export const CommunityServices = {
  createCommunityPost,
  editCommunityPost,
  deleteCommunityPost,
  getOwnPosts,
  getNewsFeed,
  allPost
};
