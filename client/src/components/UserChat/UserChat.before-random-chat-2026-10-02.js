import React, {
  useEffect,
  useState,
} from "react";
import "./UserChat.css";
import {
  sendDirectMessage,
  listenToDirectMessages,
} from "../../firebase";


function UserChat({ user }) {

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
     USER CHAT UI
  ===================================================== */

  return (

    <div
      className="user-chat"
    >

      <div
        className="user-chat-header"
      >

        <h3>
          User Chat
        </h3>

      </div>


      {/* RECEIVER UID */}

      <div
        className="user-chat-user"
      >

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


      {/* MESSAGES */}

      <div
        className="user-chat-messages"
      >

        {directMessages.length ===
        0 ? (

          <div
            className="user-chat-empty"
          >
            No messages yet.
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


      {/* MESSAGE INPUT */}

      <div
        className="user-chat-input"
      >

        <input
          type="text"
          placeholder="Type a message..."
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
          onClick={
            handleSendMessage
          }
          disabled={
            !user?.uid ||
            !receiverId.trim() ||
            !messageText.trim()
          }
        >
          Send
        </button>

      </div>

    </div>

  );

}


export default UserChat;