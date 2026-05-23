import "./App.css";

import {
  useState,
  useRef,
  useEffect,
} from "react";

import {
  FiSend,
  FiGlobe,
  FiPlus,
  FiMenu,
  FiCopy,
  FiUser,
  FiMessageSquare,
  FiCode,
  FiCpu,
} from "react-icons/fi";

import {
  CopyToClipboard,
} from "react-copy-to-clipboard";

import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";

import {
  Prism as SyntaxHighlighter,
} from "react-syntax-highlighter";

import {
  vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";



/* FIREBASE */

import {
  auth,
  googleProvider,
  saveChatToCloud,
  loadUserChats,
} from "./firebase";

import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";



function App() {

  /* AUTH */

  const [user, setUser] =
    useState(null);

  const [email, setEmail] =
    useState("");

  const [password,
    setPassword] =
    useState("");

  const [isSignup,
    setIsSignup] =
    useState(false);



  /* CHAT */

  const [allChats, setAllChats] =
    useState([]);

  const [currentChatId,
    setCurrentChatId] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [sidebarOpen,
    setSidebarOpen] =
    useState(true);

  const [webEnabled,
    setWebEnabled] =
    useState(false);

  const [agentMode,
    setAgentMode] =
    useState(false);

  const messagesEndRef =
    useRef(null);



  /* AUTH SYSTEM */

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (
          currentUser
        ) => {

          setUser(
            currentUser
          );

          if (
            currentUser
          ) {

            const cloudChats =
              await loadUserChats(
                currentUser.uid
              );

            if (
              cloudChats.length >
              0
            ) {

              setAllChats(
                cloudChats
              );

              setCurrentChatId(
                cloudChats[0]
                  .id
              );

              setMessages(
                cloudChats[0]
                  .messages
              );
            }
          }
        }
      );

    return () =>
      unsubscribe();

  }, []);




  /* GOOGLE LOGIN */

  const handleGoogleLogin =
    async () => {

      try {

        await signInWithPopup(
          auth,
          googleProvider
        );

      } catch (error) {

        console.log(error);

        alert(
          "Google login failed"
        );
      }
    };




  /* EMAIL LOGIN */

  const handleEmailAuth =
    async () => {

      try {

        if (isSignup) {

          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );

        } else {

          await signInWithEmailAndPassword(
            auth,
            email,
            password
          );
        }

      } catch (error) {

        console.log(error);

        alert(error.message);
      }
    };




  /* LOGOUT */

  const handleLogout =
    async () => {

      await signOut(auth);
    };



  /* AUTO SCROLL */

  useEffect(() => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth",
      });

  }, [messages]);



  /* CREATE NEW CHAT */

  const createNewChat = () => {

    const newChat = {

      id: Date.now(),

      title:
        "New Conversation",

      messages: [],
    };

    setAllChats((prev) => [
      newChat,
      ...prev,
    ]);

    setCurrentChatId(
      newChat.id
    );

    setMessages([]);
  };



  /* SWITCH CHAT */

  const switchChat = (chatId) => {

    const selectedChat =
      allChats.find(
        (chat) =>
          chat.id ===
          chatId
      );

    if (selectedChat) {

      setCurrentChatId(
        chatId
      );

      setMessages(
        selectedChat.messages
      );
    }
  };



  /* SAVE CHAT */

  const saveCurrentChat =
    async (
      updatedMessages
    ) => {

      if (
        !currentChatId
      ) {

        const firstChat = {

          id: Date.now(),

          title:
            updatedMessages[0]
              ?.text
              ?.slice(0, 30) ||
            "New Chat",

          messages:
            updatedMessages,
        };

        setCurrentChatId(
          firstChat.id
        );

        setAllChats([
          firstChat,
        ]);

        if (user) {

          await saveChatToCloud(
            user.uid,
            firstChat
          );
        }

        return;
      }

      const updatedChats =
        allChats.map(
          (chat) =>
            chat.id ===
            currentChatId
              ? {
                  ...chat,

                  title:
                    updatedMessages[0]
                      ?.text
                      ?.slice(
                        0,
                        30
                      ) ||
                    "New Chat",

                  messages:
                    updatedMessages,
                }
              : chat
        );

      setAllChats(
        updatedChats
      );

      const currentChat =
        updatedChats.find(
          (chat) =>
            chat.id ===
            currentChatId
        );

      if (
        user &&
        currentChat
      ) {

        await saveChatToCloud(
          user.uid,
          currentChat
        );
      }
    };



  /* SPEAK */

  const speakText = (text) => {

    if (
      !(
        "speechSynthesis"
        in window
      )
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(
        text
      );

    speech.rate = 0.95;

    speech.pitch = 1.1;

    window.speechSynthesis
      .speak(speech);
  };



  /* SEND MESSAGE */

  const handleSend =
    async () => {

    if (!input.trim())
      return;

    const userMessage = {

      role: "user",

      text: input,
    };

    const updatedMessages =
      [
        ...messages,
        userMessage,
      ];

    setMessages(
      updatedMessages
    );

    await saveCurrentChat(
      updatedMessages
    );

    const currentInput =
      input;

    setInput("");

    setLoading(true);

    try {

      const response =
        await fetch(
          "http://localhost:5000/ask",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                message:
                  currentInput,

                web:
                  webEnabled,

                agentMode:
                  agentMode,
              }),
          }
        );

      const data =
        await response.json();

      const finalMessages =
        [
          ...updatedMessages,

          {
            role:
              "assistant",

            text:
              data.reply,
          },
        ];

      setMessages(
        finalMessages
      );

      await saveCurrentChat(
        finalMessages
      );

      speakText(data.reply);

    } catch (error) {

      console.log(error);

      alert(
        "Server error"
      );
    }

    setLoading(false);
  };



  /* LOGIN PAGE */

  if (!user) {

    return (

      <div className="auth-page">

        <div className="auth-card">

          <div className="auth-logo">
            T
          </div>

          <h1>
            TRUVORA AI
          </h1>

          <p>
            Next Generation AI
            Platform
          </p>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
          />

          <button
            className="auth-btn"
            onClick={
              handleEmailAuth
            }
          >

            {isSignup
              ? "Create Account"
              : "Login"}

          </button>

          <button
            className="google-btn"
            onClick={
              handleGoogleLogin
            }
          >

            Continue with Google

          </button>

          <div
            className="switch-auth"
            onClick={() =>
              setIsSignup(
                !isSignup
              )
            }
          >

            {isSignup
              ? "Already have account? Login"
              : "Create new account"}

          </div>

        </div>

      </div>
    );
  }



  return (

    <div className="app">

      {/* SIDEBAR */}

      <div
        className={`sidebar ${
          sidebarOpen
            ? "open"
            : "closed"
        }`}
      >

        <div className="brand">

          <div className="brand-logo">
            T
          </div>

          <div>

            <div className="brand-title">
              TRUVORA
            </div>

            <div className="brand-sub">
              GLOBAL AI
            </div>

          </div>

        </div>

        <button
          className="new-chat"
          onClick={
            createNewChat
          }
        >

          <FiPlus />

          New Chat

        </button>

        <div className="chat-list-title">
          CLOUD CHATS
        </div>

        {allChats.map(
          (chat) => (

            <div
              key={chat.id}
              className="chat-card"
              onClick={() =>
                switchChat(
                  chat.id
                )
              }
            >

              <FiMessageSquare />

              <span>
                {chat.title}
              </span>

            </div>
          )
        )}

      </div>



      {/* MAIN */}

      <div className="main">

        <div className="topbar">

          <button
            className="menu-btn"
            onClick={() =>
              setSidebarOpen(
                !sidebarOpen
              )
            }
          >

            <FiMenu />

          </button>

          <h1>
            TRUVORA GLOBAL AI
          </h1>

          <button
            className="logout-btn"
            onClick={
              handleLogout
            }
          >

            Logout

          </button>

        </div>



        {/* CHAT */}

        <div className="chat-area">

          {messages.map(
            (
              msg,
              index
            ) => (

              <div
                key={index}
                className={`message-row ${msg.role}`}
              >

                <div className="avatar">

                  {msg.role ===
                  "user"
                    ? <FiUser />
                    : "T"}

                </div>

                <div
                  className={`message-card ${msg.role}`}
                >

                  <ReactMarkdown
                    remarkPlugins={[
                      remarkGfm,
                    ]}
                    components={{

                      code({
                        inline,
                        className,
                        children,
                        ...props
                      }) {

                        const match =
                          /language-(\w+)/.exec(
                            className || ""
                          );

                        return !inline &&
                          match ? (

                          <div className="code-block">

                            <div className="code-top">

                              <div className="code-language">

                                <FiCode />

                                {match[1]}

                              </div>

                              <CopyToClipboard
                                text={String(
                                  children
                                )}
                              >

                                <button className="copy-code-btn">

                                  <FiCopy />

                                  Copy

                                </button>

                              </CopyToClipboard>

                            </div>

                            <SyntaxHighlighter
                              style={
                                vscDarkPlus
                              }
                              language={
                                match[1]
                              }
                              PreTag="div"
                              {...props}
                            >

                              {String(
                                children
                              ).replace(
                                /\n$/,
                                ""
                              )}

                            </SyntaxHighlighter>

                          </div>

                        ) : (

                          <code
                            className={
                              className
                            }
                            {...props}
                          >

                            {children}

                          </code>
                        );
                      },
                    }}
                  >

                    {msg.text}

                  </ReactMarkdown>

                </div>

              </div>
            )
          )}

          {loading && (

            <div className="typing">
              Truvora is thinking...
            </div>

          )}

          <div ref={messagesEndRef} />

        </div>



        {/* INPUT */}

        <div className="input-container">

          <button
            className={`icon-btn ${
              webEnabled
                ? "active-web"
                : ""
            }`}
            onClick={() =>
              setWebEnabled(
                !webEnabled
              )
            }
          >

            <FiGlobe />

          </button>

          <button
            className={`icon-btn ${
              agentMode
                ? "active-web"
                : ""
            }`}
            onClick={() =>
              setAgentMode(
                !agentMode
              )
            }
          >

            <FiCpu />

          </button>

          <input
            type="text"
            placeholder="Ask Truvora anything..."
            value={input}
            onChange={(e) =>
              setInput(
                e.target.value
              )
            }
            onKeyDown={(e) => {

              if (
                e.key === "Enter"
              ) {

                handleSend();
              }
            }}
          />

          <button
            className="send-btn"
            onClick={
              handleSend
            }
          >

            <FiSend />

          </button>

        </div>

      </div>

    </div>
  );
}

export default App;