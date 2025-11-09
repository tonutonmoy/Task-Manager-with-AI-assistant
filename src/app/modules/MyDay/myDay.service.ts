import prisma from "../../utils/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const createMyDay = async (userId: string, payload: { title: string; description: string }) => {
  const result = await prisma.myDay.create({
    data: {
      userId,
      ...payload,
    },
  });
  return {id:result.id};
};

const getMyDays = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  // মোট MyDay count
  const total = await prisma.myDay.count({ where: { userId } });

  // Pagination সহ data fetch
  const data = await prisma.myDay.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
};

const updateMyDay = async (id: string, userId: string, payload: { title?: string; description?: string }) => {
  const myDay = await prisma.myDay.findUnique({ where: { id } });
  if (!myDay) throw new AppError(httpStatus.NOT_FOUND, "MyDay not found");
  if (myDay.userId !== userId) throw new AppError(httpStatus.FORBIDDEN, "Not authorized");

  const result = await prisma.myDay.update({
    where: { id },
    data: payload,
  });
  return {id: result.id};
};

const deleteMyDay = async (id: string, userId: string) => {
  const myDay = await prisma.myDay.findUnique({ where: { id } });
  if (!myDay) throw new AppError(httpStatus.NOT_FOUND, "MyDay not found");
  if (myDay.userId !== userId) throw new AppError(httpStatus.FORBIDDEN, "Not authorized");

  const reult= await prisma.myDay.delete({ where: { id } });
  return { id: reult.id };
};


const getSingleMyDay = async (id: string, userId: string) => {
  const myDay = await prisma.myDay.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true, skill: true, number: true } } },
  });

  if (!myDay) throw new AppError(httpStatus.NOT_FOUND, "MyDay not found");

  if (myDay.userId !== userId) throw new AppError(httpStatus.FORBIDDEN, "Not authorized");

  return myDay;
};

export const MyDayServices = {
  createMyDay,
  getMyDays,
  updateMyDay,
  deleteMyDay,
  getSingleMyDay
};
