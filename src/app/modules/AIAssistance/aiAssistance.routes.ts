import express from "express";
import multer from "multer";

import auth from "../../middlewares/auth";
import { AIAssistanceController } from "./aiAssistance.controller";

const router = express.Router();
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

router.post(
  "/voice",
  auth(),
  upload.single("file"), // form-data key: file
  AIAssistanceController.voiceWithAI
);
router.post(
  "/chat",
  auth(),

  AIAssistanceController.chatWithAI
);
router.get(
  "/",
  auth(),

  AIAssistanceController.allChat
);

export const AIAssistanceRoutes = router;
