
import axios from "axios";
import prisma from "../../utils/prisma";
import FormData from "form-data";
import fs from "fs";


import path from "path";       // <-- এইটা add করা লাগবে


import mime from "mime-types";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { QueryType } from "@prisma/client";



 const chatWithAI = async (userId: string, user_query: string,type:QueryType) => {


  const UserSubscription:any= await prisma.userSubscription.findFirst({
       where:{
        userId
       },
       include:{plan:true}
    })
 if (!UserSubscription) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized! please update your plan');
      }


      if(UserSubscription.plan.price<47){
            throw new AppError(httpStatus.UNAUTHORIZED, `You are not authorized! your using ${UserSubscription.plan.name}.  please update your plan`);
          }
   


 
  // 1️⃣ ইউজার আছে কিনা চেক করা
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  if (!user.age) throw new AppError(httpStatus.NOT_FOUND, 'Age not found!');



 

  // 2️⃣ আগের ৫টা কনভারসেশন বের করা
  const prevChats = await prisma.chattingWithAI.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

 

  // conversation_history তৈরি
  const conversation_history = prevChats.map(chat => ({
    user_query: chat.user_query,
    ai_response: chat.ai_answer,
  }));

  // 3️⃣ নতুন ইউজার কুয়েরি ডাটাবেজে সেভ করা (ai_answer ফাঁকা থাকবে)
  const newChat = await prisma.chattingWithAI.create({
    data: {
      userId,
      query_type:type,
      user_query,
    },
  });

  // 4️⃣ AI API তে পাঠানো
  const payload = {
    user_query:newChat.user_query,
    user_age: user?.age,
    conversation_history,
  
  };

  


  const aiRes = await axios.post(`${process.env.AI_END_POINT}/api/chat/chat-text`, payload);



  const answer = aiRes.data.answer; // response থেকে answer বের করা

  // 5️⃣ ডাটাবেজে answer আপডেট করা
  await prisma.chattingWithAI.update({
    where: { id: newChat.id },
    data: { ai_answer: answer },
  });

  // 6️⃣ Client-এ শুধু answer ফেরত দেওয়া
  return { answer };
};



/**
 * Convert user voice to text, chat with AI, then return AI answer as speech
 * @param userId number|string - user id
 * @param file Express.Multer.File | string - multer file object or local file path
 * @param extraFields optional object for any extra form fields FastAPI expects
 */
 const voiceWithAI = async (
  userId: number | string|any,
  file: Express.Multer.File | string,
  extraFields?: Record<string, string | number>,
  gender?:any
) => {
  try {

      const UserSubscription:any= await prisma.userSubscription.findFirst({
       where:{
        userId
       },
       include:{plan:true}
    })
 if (!UserSubscription) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized! please update your plan');
      }


      if(UserSubscription.plan.price<47){
            throw new AppError(httpStatus.UNAUTHORIZED, `You are not authorized! your using ${UserSubscription.plan.name}.  please update your plan`);
          }
   
    const formData = new FormData();

    // Append audio file
    let contentType = "audio/mpeg";

    if (typeof file === "string") {
      if (!fs.existsSync(file)) throw new Error("File not found on disk");
      contentType = mime.lookup(path.extname(file)) || "audio/mpeg";
      formData.append("audio", fs.createReadStream(file), {
        filename: path.basename(file),
        contentType,
      });
    } else {
      contentType = mime.lookup(path.extname(file.originalname || file.path)) || "audio/mpeg";
      formData.append("audio", fs.createReadStream(file.path), {
        filename: file.originalname || path.basename(file.path),
        contentType,
      });
    }

    // Append required fields
    formData.append("userId", String(userId)); // convert to string to match FastAPI int

    // Append any extra fields FastAPI expects
    if (extraFields) {
      Object.entries(extraFields).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    // Call FastAPI voice-to-text
    const voiceToTextResponse = await axios.post(
      `${process.env.AI_END_POINT}/api/voice/voice-to-text`,
      formData,
      {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    const transcript =
      voiceToTextResponse.data?.transcribed_text ||
      voiceToTextResponse.data?.text;


      console.log(transcript)

    if (!transcript) throw new Error("No text received from voice-to-text API");

    // Send transcript to AI chat
    const { answer } = await AIAssistanceService.chatWithAI( String(userId), transcript,QueryType.voice);

    console.log(gender)

    // Convert AI answer to speech
  // Convert AI answer to speech
const ttsResponse = await axios.post(
  `${process.env.AI_END_POINT}/api/voice/text-to-speech`,
  { text: answer,gender:gender?.gender||"male" },
  { headers: { "Content-Type": "application/json" } }
);

const ttsData = ttsResponse.data || {};
const voiceUrl = ttsData.audioUrl || ttsData.audio_url || null;

return {
  transcript,
  aiAnswer: answer,
  voiceUrl,
};

  } catch (error: any) {
    console.error("Voice with AI Error:", error.response?.data || error.message);
    throw new Error(error.message || "Voice-to-text conversion failed");
  }
};





  const allChat=async(userId:string)=>{

      return await prisma.chattingWithAI.findMany({
      where:{
       userId
      }
     })



    }


 export  const   AIAssistanceService={
  chatWithAI,
  voiceWithAI,
  allChat

 }