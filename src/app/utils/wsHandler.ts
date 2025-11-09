// import { WebSocketServer, WebSocket } from "ws";
// import { AIAssistanceService } from "../modules/AIAssistance/aiAssistance.service";
// import { TaskService } from "../modules/Task/task.service";

// interface ClientMessage {
//   event: string;
//   userId: string;
//   user_query?: string;
// }

// interface ServerResponse {
//   success: boolean;
//   event?: string;
//   data?: any;
//   error?: string;
// }

// export const setupWebSocket = (wss: WebSocketServer) => {
//   wss.on("connection", (ws: WebSocket) => {
//     console.log("🔌 WebSocket client connected");

//     ws.on("message", async (msg) => {
//       let parsed: ClientMessage;

//       try {
//         parsed = JSON.parse(msg.toString());
//       } catch (err) {
//         ws.send(JSON.stringify({ success: false, error: "Invalid JSON format" }));
//         return;
//       }

//       const event = parsed?.event;
//       const userId = parsed?.userId;

//       if (!userId) {
//         ws.send(JSON.stringify({ success: false, error: "userId is required" }));
//         return;
//       }

//       // ---------------------------
//       // Chat message event
//       // ---------------------------
//       if (event === "message") {
//         const user_query = parsed?.user_query;
//         if (!user_query) {
//           ws.send(JSON.stringify({ success: false, error: "user_query is required" }));
//           return;
//         }

//         try {
//           const { answer } = await AIAssistanceService.chatWithAI(userId, user_query);

//           const response: ServerResponse = {
//             success: true,
//             event: "message",
//             data: { answer },
//           };

//           ws.send(JSON.stringify(response));
//         } catch (err: any) {
//           ws.send(JSON.stringify({ success: false, error: err.message || "Something went wrong" }));
//         }
//       }



//     });

//     ws.on("close", () => {
//       console.log("❌ WebSocket client disconnected");
//     });
//   });
// };





import { WebSocketServer, WebSocket } from "ws";
import { AIAssistanceService } from "../modules/AIAssistance/aiAssistance.service";
import { QueryType } from "@prisma/client";

interface ClientMessage {
  event: string;
  userId: string;
  user_query?: string;
  fileUrl?: string; // 🎤 voiceChat ইভেন্টের জন্য দরকার হবে
}

interface ServerResponse {
  success: boolean;
  event?: string;
  data?: any;
  error?: string;
}

export const setupWebSocket = (wss: WebSocketServer) => {
  wss.on("connection", (ws: WebSocket) => {
    console.log("🔌 WebSocket client connected");

    ws.on("message", async (msg) => {
      let parsed: ClientMessage;

      // -------------------------------
      // 🧩 Step 1: JSON validation
      // -------------------------------
      try {
        parsed = JSON.parse(msg.toString());
      } catch (err) {
        ws.send(JSON.stringify({ success: false, error: "Invalid JSON format" }));
        return;
      }

      const { event, userId, user_query, fileUrl } = parsed;

      if (!userId) {
        ws.send(JSON.stringify({ success: false, error: "userId is required" }));
        return;
      }

      // -------------------------------
      // 💬 Text message to AI
      // -------------------------------
      if (event === "message") {
        if (!user_query) {
          ws.send(JSON.stringify({ success: false, error: "user_query is required" }));
          return;
        }

        try {
          const { answer } = await AIAssistanceService.chatWithAI(userId, user_query,QueryType.text);

          const response: ServerResponse = {
            success: true,
            event: "message",
            data: { answer },
          };

          ws.send(JSON.stringify(response));
        } catch (err: any) {
          ws.send(JSON.stringify({ success: false, error: err.message || "AI chat failed" }));
        }
      }

      // -------------------------------
      // 🎤 Voice message to AI
      // -------------------------------
    if (event === "voiceChat") {
  const fileUrl = (parsed as any)?.fileUrl; // ✅ fileUrl extract from client message

  if (!fileUrl) {
    ws.send(
      JSON.stringify({
        success: false,
        event: "voiceChat",
        error: "fileUrl is required",
      })
    );
    return;
  }

  try {
    // 🧠 Call AI voice processing service
    const result = await AIAssistanceService.voiceWithAI(userId, fileUrl);

    const response: ServerResponse = {
      success: true,
      event: "voiceChat",
      data: result, // ✅ result: { transcript, aiAnswer, voiceUrl }
    };

    ws.send(JSON.stringify(response));
  } catch (err: any) {
    ws.send(
      JSON.stringify({
        success: false,
        event: "voiceChat",
        error: err.message || "Voice processing failed",
      })
    );
  }
}




    });

    ws.on("close", () => {
      console.log("❌ WebSocket client disconnected");
    });
  });
};
