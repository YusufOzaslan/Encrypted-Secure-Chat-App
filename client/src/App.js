import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import crypto from "crypto-browserify";
import { Buffer } from "buffer";
import Chat from "./Chat";
import "./App.css";

window.Buffer = Buffer;
// 192.168.10.253 192.168.2.182
const socket = io.connect("http://192.168.10.253:3001");

function App() {
  const [room, setRoom] = useState("");
  const [username, setUsername] = useState("");
  const [showChat, setShowChat] = useState(false);
  const clientDHRef = useRef(null);
  const clientPublicKey = useRef(null);
  const receivedPublicKey = useRef(null);
  const secretKey = useRef(null);

  const joinRoom = () => {
    if (username !== "" && room !== "") {
      console.log(clientPublicKey.current);
      socket.emit("join_room", room);

      // Create a Promise to wait for the public key to be received
      const waitForPublicKey = new Promise((resolve) => {
        socket.on("share_public_key", (receivedData) => {
          const receivedClientPublicKey = receivedData.publicKey;
          receivedPublicKey.current = Buffer.from(
            receivedClientPublicKey,
            "hex"
          );
          console.log("Received public key:", receivedPublicKey);
          // Resolve the Promise when the operation is complete
          resolve();
        });
      });

      // Continue when the above Promise is resolved
      waitForPublicKey.then(() => {
        // Now the share_public_key operation is complete
        secretKey.current = clientDHRef.current.computeSecret(
          receivedPublicKey.current
        );
        console.log("Generated secret key:", secretKey.current.toString("hex"));
        setShowChat(true);
      });
    }
  };

  useEffect(() => {
    // Receive DH Parameters
    const handleDHParams = (params) => {
      const clientDH = crypto.createDiffieHellman(
        Buffer.from(params.prime, "hex"),
        Buffer.from(params.generator, "hex")
      );
      console.log(socket.id);
      clientDHRef.current = clientDH;
      clientPublicKey.current = clientDHRef.current.generateKeys("hex");
      // Send the generated public key to the server
      socket.emit("client_public_key", {
        publicKey: clientPublicKey.current,
      });
    };

    socket.on("dh_params", handleDHParams);

    return () => {
      socket.off("dh_params", handleDHParams);
    };
  });

  return (
    <div className="App">
      {!showChat ? (
        <div className="joinChatContainer">
          <h3>Join the Chat</h3>
          <input
            type="text"
            placeholder="Enter username"
            onChange={(event) => {
              setUsername(event.target.value);
            }}
          />
          <input
            type="text"
            placeholder="Enter room number"
            onChange={(event) => {
              setRoom(event.target.value);
            }}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <Chat
          socket={socket}
          username={username}
          room={room}
          secretKey={secretKey}
        />
      )}
    </div>
  );
}

export default App;
