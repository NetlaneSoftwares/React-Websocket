import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import webstomp from "webstomp-client";


var stompClient = null;
const ChatRoom = () => {
  const [privateChats, setPrivateChats] = useState(new Map());
  const [publicChats, setPublicChats] = useState([]);
  const [tab, setTab] = useState("CHATROOM");
  const [userData, setUserData] = useState({
    username: "",
    receivername: "",
    connected: false,
    message: "",
  });
  
  
    const token =  "Bearer eyJhbGciOiJIUzI1NiJ9.eyJjb21wYW55X21jIjoiNjc3MDQ2IiwidXNlcl9lbWFpbCI6InRlc3RlckBnbWFpbC5jb20iLCJjb21wYW55X3BoIjpudWxsLCJjb21wYW55X2ZheCI6IjMwOS0yMDUtNjc0NCIsImNvbXBhbnlfZG90IjoiMzI4MzAxIiwiZnVsbF9uYW1lIjoiRGV2ZWxvcGVyIFRlc3QiLCJ1c2VyX3R5cGUiOiJTVVBFUiIsInVzZXJfaWQiOjIzLCJ1c2VyX3BoIjoiNDMyNDU0MjMyMyIsImNvbXBhbnlfbmFtZSI6IlNJUCBMb2dpc3RpY3MgSW5jIiwiY29tcGFueSI6MjgsImV4cCI6MTY1MTYyMjYyMCwiaWF0IjoxNjUxNTM2MjIwLCJlbWFpbCI6InRlc3RlckBnbWFpbC5jb20ifQ.PwTnSXxco35SWP4r8szjUJ5Y_V7rtx6n9SOPvqyD-Kk";

 
 
  useEffect(() => {
    console.log(userData);
  }, [userData]);

  const connect = () => {
    let Sock = new SockJS(
      `http://localhost:8080/tms-message-channel?Authorization=${token}`
    );
    stompClient = webstomp.over(
      Sock,
      { debug: false },
      { headers: { Authorization: `Bearer ${token}` } }
    );
   
    stompClient.connect(
      { headers: { Authorization: `Bearer ${token}` } },
      onConnected,
      onError
    );
  };

  const onConnected = () => {
    setUserData({ ...userData, connected: true });
    stompClient.subscribe("/chatroom/public", onMessageReceived);

    stompClient.subscribe(
      "/user/" + userData.username + "/private",
      onPrivateMessage
    );
    userJoin();
  };

  const userJoin = () => {
    var chatMessage = {
      senderName: userData.username,
      status: "JOIN",
    };
    stompClient.send(
      "/tms-message-channel/message",
      JSON.stringify(chatMessage)
    );
  };

  const onMessageReceived = (payload) => {
    var payloadData = JSON.parse(payload.body);
    switch (payloadData.status) {
      case "JOIN":
        if (!privateChats.get(payloadData.senderName)) {
          privateChats.set(payloadData.senderName, []);
          setPrivateChats(new Map(privateChats));
        }
        break;
      case "MESSAGE":
        publicChats.push(payloadData);
        setPublicChats([...publicChats]);
        break;
    }
  };

  const onPrivateMessage = (payload) => {
    console.log(payload);
    console.log("payload");
    var payloadData = JSON.parse(payload.body);
    if (privateChats.get(payloadData.senderName)) {
      privateChats.get(payloadData.senderName).push(payloadData);
      setPrivateChats(new Map(privateChats));
    } else {
      let list = [];
      list.push(payloadData);
      privateChats.set(payloadData.senderName, list);
      setPrivateChats(new Map(privateChats));
    }
  };

  const onError = (err) => {
    console.log(err);
  };

  const handleMessage = (event) => {
    const { value } = event.target;
    setUserData({ ...userData, message: value });
  };
  const sendValue = () => {
    if (stompClient) {
      var chatMessage = {
        senderName: userData.username,
        message: userData.message,
        status: "MESSAGE",
      };
      console.log(chatMessage);
      stompClient.send(
        "/tms-message-channel/message",
        JSON.stringify(chatMessage)
      );
      setUserData({ ...userData, message: "" });
    }
  };

  const sendPrivateValue = () => {
    if (stompClient) {
      var chatMessage = {
        body: userData.message,
        title: "private message",
        subject: "provateMessage",
        recipient: {
          id: 25,
          email_address: "tester@gmail.com",
        },
        sender: {
          id: 36,
          email_address: "tester@gmail.com",
        },
        read_status: false,
        conversation: {
          id: null,
        },
      };
      console.log(chatMessage);
      if (userData.username !== tab) {
        privateChats.get(tab).push(chatMessage);
        setPrivateChats(new Map(privateChats));
      }
      stompClient.send(
        "/tms-message-channel/private-message",
   
  
        JSON.stringify(chatMessage)
      );
      setUserData({ ...userData, message: "" });
    }
  };

  const handleUsername = (event) => {
    const { value } = event.target;
    setUserData({ ...userData, username: value });
  };

  const registerUser = () => {
    connect();
  };
  return (
    <div className="container">
      {userData.connected ? (
        <div className="chat-box">
          <div className="member-list">
            <ul>
              <li
                onClick={() => {
                  setTab("CHATROOM");
                }}
                className={`member ${tab === "CHATROOM" && "active"}`}
              >
                Chatroom
              </li>
              {[...privateChats.keys()].map((name, index) => (
                <li
                  onClick={() => {
                    setTab(name);
                  }}
                  className={`member ${tab === name && "active"}`}
                  key={index}
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
          {tab === "CHATROOM" && (
            <div className="chat-content">
              <ul className="chat-messages">
                {publicChats.map((chat, index) => (
                  <li
                    className={`message ${
                      chat.senderName === userData.username && "self"
                    }`}
                    key={index}
                  >
                    {chat.senderName !== userData.username && (
                      <div className="avatar">{chat.senderName}</div>
                    )}
                    <div className="message-data">{chat.message}</div>
                    {chat.senderName === userData.username && (
                      <div className="avatar self">{chat.senderName}</div>
                    )}
                  </li>
                ))}
              </ul>

              <div className="send-message">
                <input
                  type="text"
                  className="input-message"
                  placeholder="Write a message"
                  value={userData.message}
                  onChange={handleMessage}
                />
                <button
                  type="button"
                  className="send-button"
                  onClick={sendValue}
                >
                  send
                </button>
              </div>
            </div>
          )}
          {tab !== "CHATROOM" && (
            <div className="chat-content">
              <ul className="chat-messages">
                {[...privateChats.get(tab)].map((chat, index) => (
                  <li
                    className={`message ${
                      chat.senderName === userData.username && "self"
                    }`}
                    key={index}
                  >
                    {chat.senderName !== userData.username && (
                      <div className="avatar">{chat.senderName}</div>
                    )}
                    <div className="message-data">{chat.message}</div>
                    {chat.senderName === userData.username && (
                      <div className="avatar self">{chat.senderName}</div>
                    )}
                  </li>
                ))}
              </ul>

              <div className="send-message">
                <input
                  type="text"
                  className="input-message"
                  placeholder="Write a message"
                  value={userData.message}
                  onChange={handleMessage}
                />
                <button
                  type="button"
                  className="send-button"
                  onClick={sendPrivateValue}
                >
                  send
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="register">
          <input
            id="user-name"
            placeholder="Enter your name"
            name="userName"
            value={userData.username}
            onChange={handleUsername}
            margin="normal"
          />
          <button type="button" onClick={registerUser}>
            connect
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
