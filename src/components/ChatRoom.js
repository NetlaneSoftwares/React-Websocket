import React, { useEffect, useState } from 'react';
import { over } from 'stompjs';
import SockJS from 'sockjs-client';

var stompClient = null;
const ChatRoom = () => {
  const [privateChats, setPrivateChats] = useState(new Map());
  const [publicChats, setPublicChats] = useState([]);
  const [tab, setTab] = useState('CHATROOM');
  const [userData, setUserData] = useState({
    username: '',
    receivername: '',
    connected: false,
    message: '',
    id: 2,
  });
  // you wil get it from localstorage.
  const token =
    "Bearer eyJhbGciOiJIUzI1NiJ9.eyJjb21wYW55X21jIjoiNjc3MDQ3IiwidXNlcl9lbWFpbCI6InRlc3RlckBnbWFpbC5jb20iLCJjb21wYW55X3BoIjpudWxsLCJjb21wYW55X2ZheCI6IjMwOS0yMDUtNjc0NCIsImNvbXBhbnlfZG90IjoiMzI4MzAxIiwiZnVsbF9uYW1lIjoiRGV2ZWxvcGVyIFRlc3QiLCJ1c2VyX3R5cGUiOiJTVVBFUiIsInVzZXJfaWQiOjIsInVzZXJfcGgiOiI0MzI0NTQyMzI2IiwiY29tcGFueV9uYW1lIjoiU0lQIExvZ2lzdGljcyBJbmMiLCJjb21wYW55IjoyLCJleHAiOjE2NTIyOTgyMTUsImlhdCI6MTY1MjIxMTgxNSwiZW1haWwiOiJ0ZXN0ZXJAZ21haWwuY29tIn0.SdJXrCR27pPvkfArUGKs0OZD7GnW8qK76HqzL5_CtKc";

  useEffect(() => {
    console.log(userData);
  }, [userData]);

  const connect = () => {
    let Sock = new SockJS(`https://api.netlanetms.com/tms-message-channel?Authorization=${token}`);
    stompClient = over(Sock);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    setUserData({ ...userData, connected: true });
    stompClient.subscribe('/chatroom/public', onMessageReceived);
    
    stompClient.subscribe(
      '/user/'+ userData.id+'/private',
      onPrivateMessage
    );
    userJoin();
  };

  const userJoin = () => {
    var chatMessage = {
      senderName: userData.id,
      status: 'JOIN',
    };
    stompClient.send('/tms-message-channel/message', {}, JSON.stringify(chatMessage));
  };

  const onMessageReceived = (payload) => {
    var payloadData = JSON.parse(payload.body);
    switch (payloadData.status) {
      case 'JOIN':
        if (!privateChats.get(payloadData.senderName)) {
          privateChats.set(payloadData.senderName, []);
          setPrivateChats(new Map(privateChats));
        }
        break;
      case 'MESSAGE':
        publicChats.push(payloadData);
        setPublicChats([...publicChats]);
        break;
    }
  };

  const onPrivateMessage = (payload) => {
   
    var payloadData = JSON.parse(payload.body);
    console.log("payload", payloadData);
    if (privateChats.get(payloadData.sender.id)) {
      privateChats.get(payloadData.sender.id).push(payloadData);
      setPrivateChats(new Map(privateChats));
    } else {
      let list = [];
      list.push(payloadData);
      privateChats.set(payloadData.sender.id, list);
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
        status: 'MESSAGE'       
      };
      console.log(chatMessage);
      stompClient.send('/tms-message-channel/message', {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: '' });
    }
  };

  const sendPrivateValue = () => {
    if (stompClient) {
      var chatMessage = {
        body: userData.message,
        title: "private message",
        subject: "privateMessage",
        recipient: {
          id: 3,
          email_address: tab,
        },
        sender: {
          id: 2,
          email_address: userData.username,
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
      } else if(userData.username === tab) {
        privateChats.get(userData.username).push(chatMessage);
        setPrivateChats(new Map(privateChats));
      }
      
      console.log("Sending private message", chatMessage);

      stompClient.send('/tms-message-channel/private-message', {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: '' });
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
                      chat.sender.id === userData.username && "self"
                    }`}
                    key={index}
                  >
                    {chat.sender.id !== userData.username && (
                      <div className="avatar">{chat.sender.email_address}</div>
                    )}
                    <div className="message-data">{chat.body}</div>
                    {chat.sender.id === userData.username && (
                      <div className="avatar self">
                        {chat.sender.email_address}
                      </div>
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
