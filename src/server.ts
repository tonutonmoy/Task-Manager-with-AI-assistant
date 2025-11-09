// import { Server } from 'http';
// import app from './app';
// import seedSuperAdmin from './app/DB';
// import config from './config';

// const port = config.port || 5000;

// async function main() {
//   const server: Server = app.listen(port, () => {
//     console.log('Sever is running on port ', port);
//     seedSuperAdmin();
//   });
//   const exitHandler = () => {
//     if (server) {
//       server.close(() => {
//         console.info('Server closed!');
//       });
//     }
//     process.exit(1);
//   };

//   process.on('uncaughtException', error => {
//     console.log(error);
//     exitHandler();
//   });

//   process.on('unhandledRejection', error => {
//     console.log(error);
//     exitHandler();
//   });
// }

// main();




import { Server } from "http";
import { WebSocketServer } from "ws";
import app from "./app";
import seedSuperAdmin from "./app/DB";
import config from "./config";
import { setupWebSocket } from "./app/utils/wsHandler";


const port = config.port || 5001;

async function main() {
  // Express + HTTP server
  const httpServer: Server = app.listen(port, () => {
    console.log(`✅ Server is running on port ${port}`);
    seedSuperAdmin();
  });

  // WebSocket attach
  const wss = new WebSocketServer({ server: httpServer });
  setupWebSocket(wss); // সব WebSocket logic এখানে handle হবে

  // graceful shutdown
  const exitHandler = () => {
    if (httpServer) httpServer.close(() => console.info("Server closed!"));
    process.exit(1);
  };

  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    exitHandler();
  });

  process.on("unhandledRejection", (error) => {
    console.error("Unhandled Rejection:", error);
    exitHandler();
  });
}

main();

