const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const crypto = require("crypto");

const app = express();

app.use(cors());

const server = http.createServer(app);

const userPublicKeyMap = new Map();

// Create Diffie-Hellman parameters
const serverDH = crypto.createDiffieHellman(2048);
const dhParams = {
  prime: serverDH.getPrime("hex"),
  generator: serverDH.getGenerator("hex"),
};

const io = new Server(server, {
  cors: {
    origin: "http://192.168.2.182:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Send DH Parameters
  socket.emit("dh_params", dhParams);

  // Listen for the client's public key
  socket.on("client_public_key", ({ publicKey }) => {
    console.log("Received client public key:", publicKey);
    // Associate the public key with the socket ID
    userPublicKeyMap.set(socket.id, publicKey);
  });

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`User ID: ${socket.id} joined Room: ${room}`);

    // Get the current user's public key
    const currentPublicKey = userPublicKeyMap.get(socket.id);

    // Get the other user's public key. Assuming there are only two users.
    const otherPublicKeys = Array.from(userPublicKeyMap.values()).find(
      (key) => key !== currentPublicKey
    );

    // Send the current user's public key to the other user in the room
    io.to(room).emit("share_public_key", {
      publicKey: otherPublicKeys,
    });
  });

  socket.on("send_message", (data) => {
    console.log(data);
    // Send the message to other users in the room
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
    // Remove the public key associated with the socket ID
    userPublicKeyMap.delete(socket.id);
  });
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});
