import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import router from "./app/routes";
import { stripeWebhook } from "./app/modules/stripe/stripeWebhook";

import { cronJob } from "./app/utils/cronJob";


const app: Application = express();
app.use(
  cors({
    origin: [
      "*",
      "http://localhost:3001",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
app.post(
  "/api/v1/webhook",
  express.raw({ type: "application/json" }), // stripe expects raw body
  // stripeWebhookHandler
  stripeWebhook
);

//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send({
    Message: "The server is running. . .",
  });
});

app.use("/api/v1", router);

app.use(globalErrorHandler);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found!",
    },
  });
});



cronJob()




export default app;
