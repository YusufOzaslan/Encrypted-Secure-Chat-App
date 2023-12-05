const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
      origin: "http://192.168.2.182:3000",
      methods: ["GET", "POST"],
    },
  });
  
  io.on("connection", (socket) => {
    console.log(`Kullanıcı Bağlandı: ${socket.id}`);
  
    socket.on("join_room", (data) => {
      socket.join(data);
      console.log(`Kullanıcı numarası: ${socket.id} Oda: ${data}`);
    });
  
    socket.on("send_message", (data) => {
      console.log(data)
      socket.to(data.room).emit("receive_message", data);
    });
  
    socket.on("disconnect", () => {
      console.log("Kullanıcı Ayrıldı", socket.id);
    });
  });
  
  server.listen(3001, () => {
    console.log("Server running on port 3001");
  });
  