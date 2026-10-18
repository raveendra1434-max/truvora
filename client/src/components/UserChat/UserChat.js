
import React, { useEffect, useState } from "react";
import "./UserChat.css";

import {
  sendDirectMessage,
  searchUsers,
    loadAllUsers,
  listenToDirectMessages,
  findRandomChatUser,
  joinRandomChatQueue,
  leaveRandomChatQueue,
  saveUserProfile,
} from "../../firebase";

function UserChat({ user }) {
  // Direct chat state
  const [receiverId, setReceiverId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [directMessages, setDirectMessages] = useState([]);

  // Random chat state
  const [randomChatUser, setRandomChatUser] = useState(null);
  const [randomChatSearching, setRandomChatSearching] = useState(false);
  const [randomChatActive, setRandomChatActive] = useState(false);

  // UI state
  const [activeMode, setActiveMode] = useState("chat");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendError, setSendError] = useState("");
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // User search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [contacts, setContacts] = useState([]);
const [loadingContacts, setLoadingContacts] = useState(false);
const [phoneContacts, setPhoneContacts] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState("");
  // Save the signed-in user's profile for people search
  useEffect(() => {
    if (!user?.uid) return;

    const saveProfile = async () => {
      try {
        const saved = await saveUserProfile(user);

        if (!saved) {
          console.error("Could not save the Trulexity user profile.");
        }
      } catch (error) {
        console.error("User profile save error:", error);
      }
    };

    saveProfile();
  }, [user?.uid]);
  // Load registered users as contacts
useEffect(() => {
  if (!user?.uid) return;

  const loadContacts = async () => {
    setLoadingContacts(true);

    try {
      const results = await loadAllUsers(user.uid);
      setContacts(Array.isArray(results) ? results : []);
      console.log("CONTACTS LOADED:", results);
    } catch (error) {
      console.error("Load contacts error:", error);
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  loadContacts();
}, [user?.uid]);
  // Search registered Trulexity users
  const handleSearchUsers = async (event) => {
    event?.preventDefault();

    const term = searchTerm.trim();

    if (!user?.uid) {
      setSearchError("Please sign in to search users.");
      return;
    }

    if (!term) {
      setSearchResults([]);
      setSearchError("Enter a username or display name.");
      return;
    }

    setSearchingUsers(true);
    setSearchError("");

    try {
      const results = await searchUsers(term, user.uid);
      setSearchResults(Array.isArray(results) ? results : []);

      if (!results?.length) {
        setSearchError(
          "No users found. The person must have a Trulexity user profile."
        );
      }
    } catch (error) {
      console.error("User search error:", error);
      setSearchResults([]);
      setSearchError("Could not search users. Please try again.");
    } finally {
      setSearchingUsers(false);
    }
  };

  // Select a search result to start a direct conversation
  const selectUser = (selectedUser) => {
    const uid = selectedUser?.uid || selectedUser?.userId;

    if (!uid || uid === user?.uid) return;

    setReceiverId(uid);
    setMessageText("");
    setDirectMessages([]);
    setSendError("");
    setActiveMode("chat");
    setRandomChatSearching(false);
    setRandomChatActive(false);
    setRandomChatUser(null);
  };

  // Start Random Chat
  const handleRandomChat = async () => {
    if (!user?.uid) {
      setSendError("Please sign in before starting Random Chat.");
      return;
    }

    setActiveMode("random");
    setRandomChatSearching(true);
    setRandomChatActive(false);
    setRandomChatUser(null);
    setReceiverId("");
    setDirectMessages([]);
    setSendError("");

    try {
      const existingUser = await findRandomChatUser(user.uid);

      if (existingUser?.userId && existingUser.userId !== user.uid) {
        setRandomChatUser(existingUser.userId);
        setReceiverId(existingUser.userId);
        setRandomChatActive(true);
        setRandomChatSearching(false);
        return;
      }

      await joinRandomChatQueue(user.uid);
    } catch (error) {
      console.error("Random Chat error:", error);
      setSendError("Could not start Random Chat. Please try again.");
      setRandomChatSearching(false);
    }
  };

  // Check whether another user is waiting for Random Chat
  useEffect(() => {
    if (!randomChatSearching || !user?.uid || randomChatActive) {
      return undefined;
    }

    let cancelled = false;

    const checkForRandomUser = async () => {
      try {
        const matchedUser = await findRandomChatUser(user.uid);

        if (
          !cancelled &&
          matchedUser?.userId &&
          matchedUser.userId !== user.uid
        ) {
          setRandomChatUser(matchedUser.userId);
          setReceiverId(matchedUser.userId);
          setRandomChatActive(true);
          setRandomChatSearching(false);
          await leaveRandomChatQueue(user.uid);
        }
      } catch (error) {
        console.error("Random Chat match error:", error);
      }
    };

    checkForRandomUser();
    const interval = setInterval(checkForRandomUser, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [randomChatSearching, randomChatActive, user?.uid]);

  // Listen for messages in the selected conversation
  useEffect(() => {
    if (!user?.uid || !receiverId.trim()) {
      setDirectMessages([]);
      return undefined;
    }

    const unsubscribe = listenToDirectMessages(
      user.uid,
      receiverId.trim(),
      (messages) => {
        setDirectMessages(Array.isArray(messages) ? messages : []);
      }
    );

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [user?.uid, receiverId]);

  // Send a direct message
  const handleSendMessage = async () => {
    const text = messageText.trim();
    const targetUser = receiverId.trim();

    if (
      !user?.uid ||
      !targetUser ||
      !text ||
      sendingMessage
    ) {
      return;
    }

    setSendingMessage(true);
    setSendError("");

    try {
      const result = await sendDirectMessage(
        user.uid,
        targetUser,
        text
      );

      if (result) {
        setMessageText("");
      } else {
        setSendError(
          "Message could not be sent. Check the recipient ID and permissions."
        );
      }
    } catch (error) {
      console.error("Send message error:", error);
      setSendError("Failed to send the message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  // Send when Enter is pressed
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // End Random Chat
  const handleEndRandomChat = async () => {
    if (user?.uid) {
      try {
        await leaveRandomChatQueue(user.uid);
      } catch (error) {
        console.error("Leave Random Chat error:", error);
      }
    }

    setRandomChatSearching(false);
    setRandomChatActive(false);
    setRandomChatUser(null);
    setReceiverId("");
    setDirectMessages([]);
    setMessageText("");
    setActiveMode("chat");
  };

  // Display the current chat name
  const chatDisplayName = randomChatActive
    ? "Random User"
    : receiverId
      ? "Direct Chat"
      : "User Chat";

  // The JSX interface follows in Part 3.
  return (
    <div className="user-chat">
      {/* TOP HEADER */}
      <div className="user-chat-header">
        <div className="user-chat-brand">
          <div className="user-chat-brand-icon">T</div>
          <div>
            <h2>Trulexity Chat</h2>
            <span>Connect and communicate</span>
          </div>
        </div>

        <div className="user-chat-header-actions">
          <button
            type="button"
            className="user-chat-icon-button"
            title="Search users"
            onClick={() => {
              setActiveMode("search");
              setSearchError("");
              setShowMoreOptions(false);
            }}
          >
            🔍
          </button>

          <button
            type="button"
            className="user-chat-icon-button"
            title="Random Chat"
            onClick={handleRandomChat}
          >
            🎲
          </button>

          <button
            type="button"
            className="user-chat-icon-button"
            title="More options"
            onClick={() => setShowMoreOptions((previous) => !previous)}
          >
            ⋮
          </button>
        </div>
      </div>

      {/* MORE OPTIONS */}
      {showMoreOptions && (
        <div className="user-chat-more-menu">
          <button
            type="button"
            onClick={() => {
              setActiveMode("search");
              setShowMoreOptions(false);
            }}
          >
            🔍 Search people
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode("chat");
              setShowMoreOptions(false);
            }}
          >
            💬 Direct chat
          </button>

          <button
            type="button"
            onClick={() => {
              setShowMoreOptions(false);
              handleRandomChat();
            }}
          >
            🎲 Find a random person
          </button>

          {randomChatSearching || randomChatActive ? (
            <button
              type="button"
              onClick={() => {
                setShowMoreOptions(false);
                handleEndRandomChat();
              }}
            >
              ✕ End random chat
            </button>
          ) : null}
        </div>
      )}

      {/* SEARCH PEOPLE */}
      {activeMode === "search" && (
        <section className="user-chat-search-panel">
          <div className="user-chat-section-heading">
            <h3>Find people</h3>
            <p>Search Trulexity users by username or display name.</p>
          </div>

          <form
            className="user-chat-search-form"
            onSubmit={handleSearchUsers}
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Enter username or name"
              aria-label="Search users"
            />

            <button type="submit" disabled={searchingUsers}>
              {searchingUsers ? "Searching..." : "Search"}
            </button>
          </form>

          {searchError && (
            <p className="user-chat-notice" role="status">
              {searchError}
            </p>
          )}

          <div className="user-chat-search-results">
            {searchResults.map((result) => {
              const resultId = result.uid || result.userId;
              const displayName =
                result.displayName ||
                result.username ||
                "Trulexity User";

              return (
                <button
                  type="button"
                  className="user-chat-person"
                  key={resultId}
                  onClick={() => selectUser(result)}
                >
                  <div className="user-chat-avatar">
                    {result.photoURL ? (
                      <img src={result.photoURL} alt="" />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="user-chat-person-info">
                    <strong>{displayName}</strong>
                    <span>
                      {result.username
                        ? `@${result.username}`
                        : "Trulexity member"}
                    </span>
                  </div>

                  <span className="user-chat-person-action">
                    Message ›
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="user-chat-secondary-button"
            onClick={() => {
              setActiveMode("chat");
              setSearchError("");
            }}
          >
            Back to chat
          </button>
        </section>
      )}

      {/* RANDOM CHAT STATUS */}
      {activeMode === "random" && (
        <div className="user-chat-random-status" role="status">
          {randomChatSearching && !randomChatActive ? (
            <>
              <span className="user-chat-status-indicator" />
              <div>
                <strong>Finding someone to chat with...</strong>
                <p>Keep this screen open while we look for another user.</p>
              </div>

              <button
                type="button"
                onClick={handleEndRandomChat}
              >
                Cancel
              </button>
            </>
          ) : randomChatActive ? (
            <>
              <span className="user-chat-status-indicator" />
              <div>
                <strong>Random chat connected</strong>
                <p>You can start messaging now.</p>
              </div>

              <button
                type="button"
                onClick={handleEndRandomChat}
              >
                End chat
              </button>
            </>
          ) : (
            <div>
              <strong>Random Chat</strong>
              <p>Find another Trulexity user to chat with.</p>
            </div>
          )}
        </div>
      )}

      {/* DIRECT CHAT SETUP */}
      {activeMode === "chat" && !receiverId && (
        <section className="user-chat-welcome">
          <div className="user-chat-welcome-icon">💬</div>
          <h3>Your conversations</h3>

          <p>
            Search for a Trulexity user to start a conversation, or try
            Random Chat to find someone new.
          </p>
<h4>Trulexity Contacts</h4>
{phoneContacts.length > 0 && (
  <div className="user-chat-search-results">
    {phoneContacts.map((contact, index) => (
      <div className="user-chat-person" key={`${contact.phone}-${index}`}>
        <strong>{contact.name}</strong>
        <span>{contact.phone}</span>
      </div>
    ))}
  </div>
)}
<label className="user-chat-secondary-button">
  Import Phone Contacts
  <input
    type="file"
    accept=".vcf,.vcard,text/vcard"
    style={{ display: "none" }}
    onChange={(event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = () => {
  const vcfText = String(reader.result || "");

  const entries = vcfText.split(/END:VCARD/i);

  const importedContacts = entries
    .map((entry) => {
      const nameMatch = entry.match(/^FN(?:;[^:]*)?:(.*)$/im);
      const phoneMatch = entry.match(/^TEL(?:;[^:]*)?:(.*)$/im);

      return {
        name: nameMatch?.[1]?.trim() || "Unknown contact",
        phone: phoneMatch?.[1]?.trim() || "",
      };
    })
    .filter((contact) => contact.phone);

  setPhoneContacts(importedContacts);

  alert(`Imported ${importedContacts.length} phone contacts.`);

  console.log("IMPORTED PHONE CONTACTS:", importedContacts);
  event.target.value = "";
};

reader.onerror = () => {
  alert("Could not read this contact file.");
};

      reader.readAsText(file);
    }}
  />
</label>
{loadingContacts ? (
  <p>Loading contacts...</p>
) : contacts.length === 0 ? (
  <p>No contacts found.</p>
) : (
  <div className="user-chat-search-results">
    {contacts.map((contact) => (
      <button
        type="button"
        className="user-chat-person"
        key={contact.uid}
        onClick={() => selectUser(contact)}
      >
        <strong>
          {contact.displayName ||
            contact.username ||
            "Trulexity User"}
        </strong>
        <span>Message ›</span>
      </button>
    ))}
  </div>
)}
          <button
            type="button"
            onClick={() => {
              setActiveMode("search");
              setSearchError("");
            }}
          >
            Find people
          </button>

          <button
            type="button"
            className="user-chat-secondary-button"
            onClick={handleRandomChat}
          >
            Start Random Chat
          </button>

          <div className="user-chat-recipient-setup">
            <label htmlFor="user-chat-recipient-id">
              Or enter the recipient's user ID
            </label>

            <form
              onSubmit={(event) => {
                event.preventDefault();

                const id = receiverId.trim();

                if (id && id !== user?.uid) {
                  setDirectMessages([]);
                  setSendError("");
                  setActiveMode("chat");
                } else if (id === user?.uid) {
                  setSendError("You cannot start a chat with yourself.");
                }
              }}
            >
              <input
                id="user-chat-recipient-id"
                type="text"
                value={receiverId}
                onChange={(event) => setReceiverId(event.target.value)}
                placeholder="Paste user ID"
              />

              <button type="submit">Open chat</button>
            </form>
          </div>
        </section>
      )}

      {/* ACTIVE CHAT */}
      {receiverId && (
        <section className="user-chat-conversation">
          <div className="user-chat-conversation-header">
            <button
              type="button"
              className="user-chat-back-button"
              title="Back"
              onClick={() => {
                if (randomChatActive || randomChatSearching) {
                  handleEndRandomChat();
                } else {
                  setReceiverId("");
                  setDirectMessages([]);
                  setMessageText("");
                  setSendError("");
                }
              }}
            >
              ←
            </button>

            <div className="user-chat-avatar user-chat-header-avatar">
              {chatDisplayName.charAt(0)}
            </div>

            <div className="user-chat-conversation-title">
              <strong>{chatDisplayName}</strong>
              <span>
                {randomChatActive
                  ? "Connected"
                  : "User ID: " + receiverId}
              </span>
            </div>

            <button
              type="button"
              className="user-chat-icon-button"
              title="End chat"
              onClick={() => {
                if (randomChatActive || randomChatSearching) {
                  handleEndRandomChat();
                } else {
                  setReceiverId("");
                  setDirectMessages([]);
                  setMessageText("");
                  setSendError("");
                }
              }}
            >
              ✕
            </button>
          </div>

          {/* MESSAGE HISTORY */}
          <div className="user-chat-messages" aria-live="polite">
            {directMessages.length === 0 ? (
              <div className="user-chat-empty-messages">
                <div>👋</div>
                <strong>Say hello!</strong>
                <p>Your messages will appear here.</p>
              </div>
            ) : (
              directMessages.map((message, index) => {
                const ownMessage = message.senderId === user?.uid;

                return (
                  <div
                    key={message.id || message.messageId || index}
                    className={`user-chat-message-row ${
                      ownMessage ? "own-message" : "other-message"
                    }`}
                  >
                    <div className="user-chat-message-bubble">
                      <p>{message.text || ""}</p>

                      <span className="user-chat-message-time">
                        {message.createdAt?.toDate
                          ? message.createdAt.toDate().toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {sendError && (
            <p className="user-chat-send-error" role="alert">
              {sendError}
            </p>
          )}
                    {/* MESSAGE COMPOSER */}
          <form
            className="user-chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              handleSendMessage();
            }}
          >
            <textarea
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              aria-label="Write a message"
              rows={1}
              disabled={sendingMessage}
            />

            <button
              type="submit"
              className="user-chat-send-button"
              disabled={!messageText.trim() || sendingMessage}
              aria-label="Send message"
              title="Send message"
            >
              {sendingMessage ? "…" : "➤"}
            </button>
          </form>

          <p className="user-chat-composer-hint">
            Press Enter to send · Shift + Enter for a new line
          </p>
        </section>
      )}
    </div>
  );
}

export default UserChat;