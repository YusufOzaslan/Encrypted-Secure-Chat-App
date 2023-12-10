import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import { AES, enc } from "crypto-js";

function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const encryptMessage = (message) => {
    // Here encrypts the message
    const encryptedMessage = AES.encrypt(message, "your-secret-key").toString();
    return encryptedMessage;
  };

  const decryptMessage = (encryptedMessage) => {
    // Here decrypts the encrypted message
    const decryptedMessage = AES.decrypt(
      encryptedMessage,
      "your-secret-key"
    ).toString(enc.Utf8);
    return decryptedMessage;
  };

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const encryptedMessage = encryptMessage(currentMessage);
      const messageData = {
        room: room,
        author: username,
        message: encryptedMessage,
        time:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes(),
      };

      await socket.emit("send_message", messageData);
      messageData.message = currentMessage;
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  useEffect(() => {
    const eventListener = (data) => {
      // Add the incoming message by decrypting it
      // The problem of the message being displayed twice has been solved with eventListener
      const decryptedMessage = decryptMessage(data.message);
      const updatedData = { ...data, message: decryptedMessage };
      setMessageList((list) => [...list, updatedData]);
    };
    socket.on("receive_message", eventListener);
    return () => socket.off("receive_message", eventListener);
  }, [socket]);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <p>Güvenli Canlı Sohbet</p>
      </div>
      <div className="chat-body">
        <ScrollToBottom className="message-container">
          {messageList.map((messageContent) => {
            return (
              <div
                className="message"
                id={username === messageContent.author ? "other" : "you"}
              >
                <div>
                  <div className="message-content">
                    <p>{messageContent.message}</p>
                  </div>
                  <div className="message-meta">
                    <p id="time">{messageContent.time}</p>
                    <p id="author">{messageContent.author}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollToBottom>
      </div>
      <div className="chat-footer">
        <input
          type="text"
          value={currentMessage}
          placeholder="Merhaba..."
          onChange={(event) => {
            setCurrentMessage(event.target.value);
          }}
          onKeyPress={(event) => {
            event.key === "Enter" && sendMessage();
          }}
        />
        <button onClick={sendMessage}>&#9658;</button>
      </div>
    </div>
  );
}

export default Chat;
