// app.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIO = require("socket.io");
const app = express();
app.use(cors());
const server = http.createServer(app);
// 웹 소켓 연결
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let messages = []; // 이전 메시지를 저장할 배열
let isStreaming = false;

const turn = {
  on: "start",
  off: "end",
};

// const turnStreaming = (turn)=> {
//   socket.on(`${turn} streaming`, () => {
//     isStreaming = true;
//     console.log("방송 시작");
//     socket.broadcast.emit("receiveStream", streamData);
//   });
// }
io.on("connection", (socket) => {
  if (isStreaming) console.log("새로운 사용자가 연결되었습니다.");
  socket.emit("currentStreamingStatus", isStreaming);

  // 새로운 클라이언트 연결될ㄷ 때 이전 메시지 전송;
  socket.emit("previousMessages", messages);
  // 영상 시작 스트리밍
  socket.on("start streaming", (streamData) => {
    isStreaming = true;
    console.log("방송 시작");
    socket.broadcast.emit("receiveStream", streamData);
  });

  // 영상 끝 스트리밍
  socket.on("end streaming", () => {
    isStreaming = false;
    console.log("방송 종료");
  });

  // 채팅 메시지 전송
  socket.on("chat message", (message) => {
    messages.push(message); // 새로운 메시지 추가
    console.log("채팅 메세지 전송");
    io.emit("chat message", message);
  });

  socket.on("disconnect", () => {
    console.log("사용자가 연결을 해제했습니다.");
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
