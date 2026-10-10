import React, {
  useEffect,
  useState,
} from "react";

import "./UserChat.css";

import {
  sendDirectMessage,
  searchUsers,
  listenToDirectMessages,
  findRandomChatUser,
  joinRandomChatQueue,
  leaveRandomChatQueue,
} from "../../firebase";


function UserChat({ user }) {

  /* =====================================================
     BASIC CHAT STATE
  ===================================================== */

  const [
    receiverId,
    setReceiverId,
  ] = useState("");

  const [
    messageText,
    setMessageText,
  ] = useState("");

  const [
    directMessages,
    setDirectMessages,
  ] = useState([]);


  /* =====================================================
     RANDOM CHAT STATE
  ===================================================== */

  const [
    randomChatUser,
    setRandomChatUser,
  ] = useState(null);

  const [
    randomChatSearching,
    setRandomChatSearching,
  ] = useState(false);

  const [
    randomChatActive,
    setRandomChatActive,
  ] = useState(false);


  /* =====================================================
     UI STATE
  ===================================================== */

  const [
    activeMode,
    setActiveMode,
  ] = useState("chat");

  const [
    showMoreOptions,
    setShowMoreOptions,
  ] = useState(false);


  /* =====================================================
     START RANDOM CHAT
  ===================================================== */

  const handleRandomChat = async () => {

    if (!user?.uid) {
      return;
    }

    setActiveMode("random");
    setRandomChatSearching(true);
    setRandomChatActive(false);
    setRandomChatUser(null);
    setDirectMessages([]);

    try {

      const existingUser =
        await findRandomChatUser(
          user.uid
        );

      if (existingUser?.userId) {

        setRandomChatUser(
          existingUser.userId
        );

        setReceiverId(
          existingUser.userId
        );

        setRandomChatActive(true);
        setRandomChatSearching(false);

        return;
      }

      await joinRandomChatQueue(
        user.uid
      );

    } catch (error) {

      console.error(
        "❌ RANDOM CHAT ERROR:",
        error
      );

      setRandomChatSearching(false);
    }
  };


  /* =====================================================
     CHECK FOR RANDOM CHAT MATCH
  ===================================================== */

  useEffect(() => {

    if (
      !randomChatSearching ||
      !user?.uid ||
      randomChatActive
    ) {
      return;
    }

    const checkForRandomUser =
      async () => {

        try {

          const matchedUser =
            await findRandomChatUser(
              user.uid
            );

          if (matchedUser?.userId) {

            setRandomChatUser(
              matchedUser.userId
            );

            setReceiverId(
              matchedUser.userId
            );

            setRandomChatActive(true);
            setRandomChatSearching(false);

            await leaveRandomChatQueue(
              user.uid
            );
          }

        } catch (error) {

          console.error(
            "❌ RANDOM CHAT MATCH CHECK ERROR:",
            error
          );

        }
      };

    checkForRandomUser();

    const interval =
      setInterval(
        checkForRandomUser,
        3000
      );

    return () => {
      clearInterval(interval);
    };

  }, [
    randomChatSearching,
    randomChatActive,
    user?.uid,
  ]);


  /* =====================================================
     LISTEN FOR DIRECT MESSAGES
  ===================================================== */

  useEffect(() => {

    if (
      !user?.uid ||
      !receiverId.trim()
    ) {

      setDirectMessages([]);

      return;
    }

    const unsubscribe =
      listenToDirectMessages(
        user.uid,
        receiverId.trim(),
        (messages) => {

          setDirectMessages(
            messages
          );

        }
      );

    return () => {

      if (
        typeof unsubscribe ===
        "function"
      ) {

        unsubscribe();

      }

    };

  }, [
    user?.uid,
    receiverId,
  ]);


  /* =====================================================
     SEND MESSAGE
  ===================================================== */

  const handleSendMessage =
    async () => {

      const text =
        messageText.trim();

      const targetUser =
        receiverId.trim();

      if (
        !user?.uid ||
        !targetUser ||
        !text
      ) {
        return;
      }

      const result =
        await sendDirectMessage(
          user.uid,
          targetUser,
          text
        );

      if (result) {

        setMessageText("");

      }
    };


  /* =====================================================
     ENTER KEY
  ===================================================== */

  const handleKeyDown =
    (event) => {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        handleSendMessage();

      }

    };


  /* =====================================================
     END RANDOM CHAT
  ===================================================== */

  const handleEndRandomChat =
    async () => {

      if (user?.uid) {

        await leaveRandomChatQueue(
          user.uid
        );

      }

      setRandomChatSearching(false);
      setRandomChatActive(false);
      setRandomChatUser(null);
      setReceiverId("");
      setDirectMessages([]);
      setMessageText("");
      setActiveMode("chat");
    };


  /* =====================================================
     RANDOM CHAT DISPLAY NAME
  ===================================================== */

  const chatDisplayName =
    randomChatActive
      ? "Random User"
      : receiverId
      ? "User Chat"
      : "User Chat";


  /* =====================================================
     USER CHAT UI
  ===================================================== */

  return (

    <div className="user-chat">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="user-chat-header">

        <div className="user-chat-title">

          <h3>
            User Chat
          </h3>

          <span>
            Private • Secure • Real-time
          </span>

        </div>

      </div>


      {/* =================================================
          TOP CHAT MODES
      ================================================= */}

      <div className="user-chat-modes">

        <button
          type="button"
          className={
            activeMode === "chat"
              ? "active"
              : ""
          }
          onClick={() => {

            setActiveMode("chat");

            if (randomChatSearching) {

              leaveRandomChatQueue(
                user?.uid
              );

            }

            setRandomChatSearching(false);

          }}
        >
          💬 Chat
        </button>


        <button
          type="button"
          className={
            activeMode === "random"
              ? "active"
              : ""
          }
          onClick={
            handleRandomChat
          }
        >
          🔀 Random Chat
        </button>


        <button
          type="button"
          className="user-chat-mode-disabled"
          onClick={() => {}}
        >
          👥 Contacts
        </button>


        <button
          type="button"
          className="user-chat-mode-disabled"
          onClick={() => {}}
        >
          🔍 Search
        </button>

      </div>


      {/* =================================================
          CONNECTION / USER HEADER
      ================================================= */}

      <div className="user-chat-profile">

        <div className="user-chat-avatar">

          {randomChatActive
            ? "👤"
            : "👥"}

        </div>


        <div className="user-chat-profile-info">

          <strong>
            {chatDisplayName}
          </strong>

          {randomChatActive ? (

            <span className="random-online">

              <i></i>

              Online • Anonymous Chat

            </span>

          ) : (

            <span>
              {receiverId
                ? "Direct Chat"
                : "Select a user to chat"}
            </span>

          )}

        </div>


        {/* RANDOM CHAT CONTROLS */}

        {randomChatActive && (

          <div className="user-chat-profile-actions">

            <button
              type="button"
              onClick={
                handleEndRandomChat
              }
            >
              End Chat
            </button>

            <button
              type="button"
              onClick={
                handleRandomChat
              }
            >
              Next
            </button>

          </div>

        )}

      </div>


      {/* =================================================
          DIRECT USER ID
      ================================================= */}

      {!randomChatActive && (

        <div className="user-chat-user">

          <input
            type="text"
            placeholder="Enter user UID..."
            value={receiverId}
            onChange={(event) =>
              setReceiverId(
                event.target.value
              )
            }
          />

        </div>

      )}


      {/* =================================================
          RANDOM CHAT SEARCHING
      ================================================= */}

      {randomChatSearching &&
        !randomChatActive && (

        <div className="random-chat-status">

          <div className="random-chat-spinner">
            ⟳
          </div>

          <strong>
            Finding someone...
          </strong>

          <span>
            Looking for another
            Trulexity user who
            selected Random Chat.
          </span>

          <button
            type="button"
            onClick={
              handleEndRandomChat
            }
          >
            Cancel
          </button>

        </div>

      )}


      {/* =================================================
          MESSAGE AREA
      ================================================= */}

      <div className="user-chat-messages">

        {directMessages.length === 0 ? (

          <div className="user-chat-empty">

            {randomChatSearching ? (

              <>
                <div className="empty-icon">
                  🔎
                </div>

                <strong>
                  Finding someone to chat with...
                </strong>

                <span>
                  Please wait a few seconds.
                </span>
              </>

            ) : randomChatActive ? (

              <>
                <div className="empty-icon">
                  👋
                </div>

                <strong>
                  You're connected
                </strong>

                <span>
                  Start your anonymous
                  conversation.
                </span>
              </>

            ) : (

              <>
                <div className="empty-icon">
                  💬
                </div>

                <strong>
                  No messages yet
                </strong>

                <span>
                  Enter a user UID or
                  start Random Chat.
                </span>
              </>

            )}

          </div>

        ) : (

          directMessages.map(
            (msg) => (

              <div
                key={msg.id}
                className={
                  `user-chat-message ${
                    msg.senderId ===
                    user?.uid
                      ? "sent"
                      : "received"
                  }`
                }
              >

                <div
                  className="user-chat-bubble"
                >

                  {msg.text}

                </div>

              </div>

            )
          )

        )}

      </div>


      {/* =================================================
          FEATURE TOOLBAR
      ================================================= */}

      <div className="user-chat-toolbar">

        <button
          type="button"
          title="Text"
          className="toolbar-active"
        >
          💬
          <span>Text</span>
        </button>


        <button
          type="button"
          title="Image"
        >
          🖼️
          <span>Image</span>
        </button>


        <button
          type="button"
          title="Camera"
        >
          📷
          <span>Camera</span>
        </button>


        <button
          type="button"
          title="Voice"
        >
          🎤
          <span>Voice</span>
        </button>


        <button
          type="button"
          title="File"
        >
          📎
          <span>File</span>
        </button>


        <button
          type="button"
          title="Emoji"
        >
          😊
          <span>Emoji</span>
        </button>


        <button
          type="button"
          title="GIF"
        >
          GIF
          <span>GIF</span>
        </button>


        <button
          type="button"
          title="Location"
        >
          📍
          <span>Location</span>
        </button>


        <button
          type="button"
          title="More"
          onClick={() =>
            setShowMoreOptions(
              !showMoreOptions
            )
          }
        >
          ⋯
          <span>More</span>
        </button>

      </div>


      {/* =================================================
          MORE OPTIONS
      ================================================= */}

      {showMoreOptions && (

        <div className="user-chat-more-options">

          <button
            type="button"
          >
            📹
            <span>
              Video Call
            </span>
          </button>


          <button
            type="button"
          >
            📞
            <span>
              Voice Call
            </span>
          </button>


          <button
            type="button"
          >
            📎
            <span>
              Send File
            </span>
          </button>


          <button
            type="button"
          >
            📊
            <span>
              Create Poll
            </span>
          </button>


          <button
            type="button"
          >
            📍
            <span>
              Share Location
            </span>
          </button>


          <button
            type="button"
          >
            🧹
            <span>
              Clear Chat
            </span>
          </button>


          <button
            type="button"
          >
            🚩
            <span>
              Report User
            </span>
          </button>


          <button
            type="button"
          >
            🚫
            <span>
              Block User
            </span>
          </button>


          <button
            type="button"
          >
            ℹ️
            <span>
              Chat Info
            </span>
          </button>

        </div>

      )}


      {/* =================================================
          MESSAGE COMPOSER
      ================================================= */}

      <div className="user-chat-input">

        <input
          type="text"
          placeholder={
            randomChatActive
              ? "Message Random User..."
              : "Type a message..."
          }
          value={messageText}
          onChange={(event) =>
            setMessageText(
              event.target.value
            )
          }
          onKeyDown={
            handleKeyDown
          }
        />


        <button
          type="button"
          className="user-chat-mic"
          title="Voice message"
        >
          🎤
        </button>


        <button
          type="button"
          className="user-chat-send"
          onClick={
            handleSendMessage
          }
          disabled={
            !user?.uid ||
            !receiverId.trim() ||
            !messageText.trim()
          }
        >
          ➤
        </button>

      </div>

    </div>

  );

}


export default UserChat;