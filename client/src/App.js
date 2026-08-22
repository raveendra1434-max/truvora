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
  FiCpu,
  FiUpload,
  FiMic,
  FiSquare,
  FiX,
  FiVolume2,
  FiSearch,
} from "react-icons/fi";

import {
  CopyToClipboard,
} from "react-copy-to-clipboard";

import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";

import { useDropzone } from "react-dropzone";

import * as pdfjsLib from "pdfjs-dist";

import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";


/* ======================================================
   FIREBASE
====================================================== */

import {
  auth,
  googleProvider,
  saveChatToCloud,
  loadUserChats,
} from "./firebase";

import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";


/* ======================================================
   TRUVORA CONFIG
====================================================== */

const API_BASE =
  "http://localhost:5000";


const TRUVORA_NAME =
  "TRUVORA";

const TRUVORA_PRODUCT =
  "GLOBAL AI";

const TRUVORA_SLOGAN =
  "Intelligence • Innovation • Trust";


/* ======================================================
   AUTOMATIC WEB DETECTION
   The Web button remains available.
   This only helps Truvora decide automatically.
====================================================== */

function shouldUseWebAutomatically(
  text = ""
) {

  const value =
    text
      .toLowerCase()
      .trim();

  if (!value)
    return false;


  const webTriggers = [

    "latest",
    "current",
    "currently",
    "today",
    "tonight",
    "tomorrow",
    "yesterday",
    "recent",
    "breaking",
    "news",

    "weather",
    "price",
    "prices",
    "stock",
    "stocks",
    "bitcoin",
    "crypto",

    "score",
    "scores",
    "live",

    "schedule",
    "standings",

    "president",
    "prime minister",
    "ceo",

    "release date",
    "latest version",

    "search the web",
    "search online",
    "look online",
    "find online",

  ];


  return webTriggers.some(
    (trigger) =>
      value.includes(trigger)
  );

}


/* ======================================================
   AUTOMATIC AGENT DETECTION
====================================================== */

function shouldUseAgentAutomatically(
  text = ""
) {

  const value =
    text
      .toLowerCase()
      .trim();

  if (!value)
    return false;


  const agentTriggers = [

    "step by step",
    "do everything",
    "handle everything",
    "research and",
    "find and",
    "compare and",
    "analyze and",
    "create and",
    "generate and",
    "prepare and",
    "build and",
    "organize and",
    "plan and",
    "automate",
    "complete this task",

  ];


  return agentTriggers.some(
    (trigger) =>
      value.includes(trigger)
  );

}


/* ======================================================
   SOURCE URL HELPER
====================================================== */

function getSourceDomain(
  url = ""
) {

  try {

    return new URL(url)
      .hostname
      .replace(
        "www.",
        ""
      );

  } catch {

    return "";

  }

}


/* ======================================================
   APP
====================================================== */

function App() {


  /* ====================================================
     CHAT
  ==================================================== */

  const [
    input,
    setInput,
  ] = useState("");


  const [
    messages,
    setMessages,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(false);


  /* ====================================================
     WEB + AGENT
     KEEP BOTH BUTTONS
  ==================================================== */

  const [
    webEnabled,
    setWebEnabled,
  ] = useState(false);


  const [
    agentMode,
    setAgentMode,
  ] = useState(false);


  /* ====================================================
     AUTH
  ==================================================== */

  const [
    user,
    setUser,
  ] = useState(null);


  const [
    chatHistory,
    setChatHistory,
  ] = useState([]);


  /* ====================================================
     DOCUMENT / IMAGE
  ==================================================== */

  const [
    pdfText,
    setPdfText,
  ] = useState("");


  const [
    image,
    setImage,
  ] = useState(null);


  /* ====================================================
     TYPING
  ==================================================== */

  const [
    typingText,
    setTypingText,
  ] = useState("");


  const [
    stopGeneration,
    setStopGeneration,
  ] = useState(false);


  /* ====================================================
     MOBILE SIDEBAR
  ==================================================== */

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);


  /* ====================================================
     SEARCH CHATS
  ==================================================== */

  const [
    chatSearch,
    setChatSearch,
  ] = useState("");


  /* ====================================================
     SPEAKER
  ==================================================== */

  const [
    speaking,
    setSpeaking,
  ] = useState(false);


  /* ====================================================
     REFS
  ==================================================== */

  const messagesEndRef =
    useRef(null);


  /* ====================================================
     VOICE
  ==================================================== */

  const {
    transcript,
    resetTranscript,
  } =
    useSpeechRecognition();


  /* ====================================================
     VOICE → INPUT
  ==================================================== */

  useEffect(() => {

    if (
      typeof transcript ===
      "string"
    ) {

      setInput(
        transcript
      );

    }

  }, [transcript]);


  /* ====================================================
     AUTO SCROLL
  ==================================================== */

  useEffect(() => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior:
          "smooth",
      });

  }, [
    messages,
    loading,
    typingText,
  ]);


  /* ====================================================
     FIREBASE AUTH
  ==================================================== */

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (
          currentUser
        ) => {

          if (
            currentUser
          ) {

            setUser(
              currentUser
            );


            try {

              const chats =
                await loadUserChats(
                  currentUser.uid
                );


              setChatHistory(
                Array.isArray(
                  chats
                )
                  ? chats
                  : []
              );

            } catch (
              error
            ) {

              console.error(
                "Chat history loading error:",
                error
              );

              setChatHistory([]);

            }

          } else {

            setUser(null);

            setChatHistory([]);

          }

        }
      );


    return () =>
      unsubscribe();

  }, []);


  /* ====================================================
     LOGIN
  ==================================================== */

  const handleGoogleLogin =
    async () => {

      try {

        await signInWithPopup(
          auth,
          googleProvider
        );

      } catch (
        error
      ) {

        console.error(
          "Google login error:",
          error
        );

      }

    };


  /* ====================================================
     LOGOUT
  ==================================================== */

  const handleLogout =
    async () => {

      try {

        await signOut(
          auth
        );

        setMessages([]);

        setInput("");

        setPdfText("");

        setImage(null);

        setSidebarOpen(
          false
        );

      } catch (
        error
      ) {

        console.error(
          "Logout error:",
          error
        );

      }

    };


  /* ====================================================
     SAVE CHAT
  ==================================================== */

  const saveCurrentChat =
    async (
      updatedMessages
    ) => {

      if (!user)
        return;


      try {

        await saveChatToCloud(
          user.uid,
          updatedMessages
        );


        const chats =
          await loadUserChats(
            user.uid
          );


        setChatHistory(
          Array.isArray(
            chats
          )
            ? chats
            : []
        );

      } catch (
        error
      ) {

        console.error(
          "Save chat error:",
          error
        );

      }

    };


  /* ====================================================
     SPEAK
     Prevent duplicate voices.
  ==================================================== */

  const speakText =
    (text) => {

      if (!text?.trim())
        return;


      try {

        window.speechSynthesis
          .cancel();


        const speech =
          new SpeechSynthesisUtterance(
            text
          );


        speech.lang =
          "en-US";


        speech.rate =
          1;


        speech.pitch =
          1;


        speech.onstart =
          () => {

            setSpeaking(
              true
            );

          };


        speech.onend =
          () => {

            setSpeaking(
              false
            );

          };


        speech.onerror =
          () => {

            setSpeaking(
              false
            );

          };


        window.speechSynthesis
          .speak(
            speech
          );

      } catch (
        error
      ) {

        console.error(
          "Speech error:",
          error
        );

        setSpeaking(
          false
        );

      }

    };


  /* ====================================================
     STOP SPEAKING
  ==================================================== */

  const stopSpeaking =
    () => {

      try {

        window.speechSynthesis
          .cancel();

      } catch (
        error
      ) {

        console.error(
          "Stop speech error:",
          error
        );

      }


      setSpeaking(
        false
      );

    };


  /* ====================================================
     PDF UPLOAD
  ==================================================== */

  const handlePdfUpload =
    async (
      file
    ) => {

      if (!file)
        return;


      try {

        const fileReader =
          new FileReader();


        fileReader.onload =
          async function () {

            try {

              const typedArray =
                new Uint8Array(
                  this.result
                );


              const pdf =
                await pdfjsLib
                  .getDocument(
                    typedArray
                  )
                  .promise;


              let extractedText =
                "";


              for (
                let i = 1;
                i <=
                pdf.numPages;
                i++
              ) {

                const page =
                  await pdf.getPage(
                    i
                  );


                const content =
                  await page.getTextContent();


                const strings =
                  content.items.map(
                    (
                      item
                    ) =>
                      item.str
                  );


                extractedText +=
                  strings.join(
                    " "
                  ) +
                  "\n";

              }


              setPdfText(
                extractedText
              );


              console.log(
                "PDF extracted successfully."
              );

            } catch (
              error
            ) {

              console.error(
                "PDF extraction error:",
                error
              );

              alert(
                "Could not read this PDF."
              );

            }

          };


        fileReader.readAsArrayBuffer(
          file
        );

      } catch (
        error
      ) {

        console.error(
          "PDF upload error:",
          error
        );

      }

    };


  /* ====================================================
     FILE UPLOAD
  ==================================================== */

  const {
    getRootProps,
    getInputProps,
  } =
    useDropzone({

      accept: {

        "application/pdf":
          [
            ".pdf",
          ],

        "image/*":
          [],

      },


      onDrop:
        async (
          acceptedFiles
        ) => {

          const file =
            acceptedFiles?.[0];


          if (!file)
            return;


          /* PDF */

          if (
            file.type ===
            "application/pdf"
          ) {

            await handlePdfUpload(
              file
            );

            return;

          }


          /* IMAGE */

          try {

            const formData =
              new FormData();


            formData.append(
              "image",
              file
            );


            const response =
              await fetch(
                `${API_BASE}/upload-image`,
                {

                  method:
                    "POST",

                  body:
                    formData,

                }
              );


            const data =
              await response.json();


            if (
              data.imageUrl
            ) {

              setImage(
                data.imageUrl
              );


              console.log(
                "Image uploaded successfully."
              );

            } else {

              alert(
                "Image upload failed."
              );

            }

          } catch (
            error
          ) {

            console.error(
              "Image upload error:",
              error
            );


            alert(
              "Upload failed."
            );

          }

        },

    });


  /* ====================================================
     NEW CHAT
  ==================================================== */

  const handleNewChat =
    () => {

      stopSpeaking();


      setMessages([]);

      setInput("");

      setPdfText("");

      setImage(null);

      setTypingText("");

      setStopGeneration(
        false
      );


      /*
       * Important for mobile:
       * close sidebar after creating
       * a new conversation.
       */

      setSidebarOpen(
        false
      );

    };


  /* ====================================================
     FILTER CHAT HISTORY
  ==================================================== */

  const filteredChats =
    chatHistory.filter(
      (
        chat
      ) => {

        if (
          !chatSearch.trim()
        )
          return true;


        const firstMessage =
          Array.isArray(
            chat
          )
            ? chat[0]
            : null;


        const text =
          firstMessage?.text ||
          "";


        return text
          .toLowerCase()
          .includes(
            chatSearch
              .toLowerCase()
          );

      }
    );


  /* ====================================================
     PART 1 ENDS HERE
  ==================================================== */

  /* ====================================================
     SEND MESSAGE
     ==================================================== */

  const handleSend =
    async () => {

      if (
        !input.trim() &&
        !pdfText &&
        !image
      ) {
        return;
      }


      setStopGeneration(
        false
      );


      /*
       * Automatic capability detection.
       *
       * Manual Web/Agent buttons still work,
       * but Truvora can also activate them when
       * the request clearly requires them.
       */

      const automaticWeb =
        shouldUseWebAutomatically(
          input
        );


      const automaticAgent =
        shouldUseAgentAutomatically(
          input
        );


      const finalWeb =
        webEnabled ||
        automaticWeb;


      const finalAgent =
        agentMode ||
        automaticAgent;


      const finalPrompt =
        pdfText

          ? `
PDF CONTENT:

${pdfText}

USER QUESTION:

${input}
          `.trim()

          : input.trim();


      const userMessage = {

        role:
          "user",

        text:
          image

            ? `🖼️ Image Uploaded\n\n${
                input.trim()
              }`

            : pdfText

            ? `📄 PDF Uploaded\n\n${
                input.trim()
              }`

            : input.trim(),

      };


      const updatedMessages = [

        ...messages,

        userMessage,

      ];


      setMessages(
        updatedMessages
      );


      await saveCurrentChat(
        updatedMessages
      );


      setInput("");

      resetTranscript();


      setLoading(
        true
      );


      setTypingText("");


      try {

        const response =
          await fetch(
            `${API_BASE}/ask`,
            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "application/json",

              },

              body:
                JSON.stringify({

                  message:
                    finalPrompt,

                  /*
                   * Keep recent history small
                   * enough for reliable requests.
                   */

                  history:
                    updatedMessages
                      .slice(-10),

                  /*
                   * Existing manual controls.
                   */

                  web:
                    finalWeb,

                  agentMode:
                    finalAgent,

                  /*
                   * Explicit automatic signals
                   * for the backend.
                   */

                  automaticWeb:
                    automaticWeb,

                  automaticAgent:
                    automaticAgent,

                  imageUrl:
                    image,

                  documentContext:
                    pdfText,

                }),

            }
          );


        if (
          !response.ok
        ) {

          throw new Error(
            `Server returned ${response.status}`
          );

        }


        const data =
          await response.json();


        /*
         * Support the response format
         * already used by Truvora.
         */

        const reply =
          data.reply ||
          data.answer ||
          data.analysis ||
          "";


        if (
          !reply
        ) {

          throw new Error(
            "Empty response received from server."
          );

        }


        let currentText =
          "";


        /*
         * Streaming-style typing effect.
         */

        for (
          const char of reply
        ) {

          if (
            stopGeneration
          ) {

            break;

          }


          currentText +=
            char;


          setTypingText(
            currentText
          );


          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                8
              )
          );

        }


        /*
         * If generation was stopped,
         * keep whatever has already been produced.
         */

        const assistantMessage = {

          role:
            "assistant",

          text:
            currentText,

          /*
           * Preserve backend sources.
           */

          sources:
            Array.isArray(
              data.sources
            )
              ? data.sources
              : [],

          /*
           * Preserve generated image/document
           * information if the backend sends it.
           */

          image:
            data.image ||
            null,

          document:
            data.document ||
            null,

        };


        const finalMessages = [

          ...updatedMessages,

          assistantMessage,

        ];


        setMessages(
          finalMessages
        );


        await saveCurrentChat(
          finalMessages
        );


        /*
         * IMPORTANT:
         *
         * Do not automatically call speakText()
         * here.
         *
         * This prevents the duplicate-voice problem.
         *
         * The user can use the speaker button
         * on the AI response instead.
         */


        setTypingText("");

        setPdfText("");

        setImage(null);


      } catch (
        error
      ) {

        console.error(
          "Truvora request error:",
          error
        );


        const errorMessage = {

          role:
            "assistant",

          text:
            "Sorry, I couldn't process your request right now. Please try again.",

          sources:
            [],

        };


        const errorMessages = [

          ...updatedMessages,

          errorMessage,

        ];


        setMessages(
          errorMessages
        );


        await saveCurrentChat(
          errorMessages
        );


        setTypingText("");

      } finally {

        setLoading(
          false
        );

        setTypingText("");

      }

    };


  /* ====================================================
     LOAD A CHAT
     ==================================================== */

  const openChat =
    (
      chat
    ) => {

      if (
        !Array.isArray(
          chat
        )
      ) {
        return;
      }


      stopSpeaking();


      setMessages(
        chat
      );


      /*
       * Clear temporary attachment state
       * when restoring an old conversation.
       */

      setPdfText("");

      setImage(null);


      /*
       * Close sidebar on mobile.
       */

      setSidebarOpen(
        false
      );

    };


  /* ====================================================
     COPY MESSAGE
     ==================================================== */

  const copyMessage =
    (
      text
    ) => {

      if (!text)
        return;

      try {

        navigator.clipboard.writeText(
          text
        );

      } catch (
        error
      ) {

        console.error(
          "Copy error:",
          error
        );

      }

    };


  /* ====================================================
     SOURCE NORMALIZATION
     ==================================================== */

  const getMessageSources =
    (
      message
    ) => {

      if (
        !message ||
        !Array.isArray(
          message.sources
        )
      ) {

        return [];

      }


      return message.sources
        .filter(
          (
            source
          ) =>
            source &&
            (
              source.url ||
              source.link
            )
        )
        .map(
          (
            source,
            index
          ) => {

            const url =
              source.url ||
              source.link;


            return {

              ...source,

              url,

              title:
                source.title ||
                source.name ||
                getSourceDomain(
                  url
                ) ||
                `Source ${index + 1}`,

            };

          }
        );

    };


  /* ====================================================
     SOURCE LIST
     ==================================================== */

  const renderSources =
    (
      message
    ) => {

      const sources =
        getMessageSources(
          message
        );


      if (
        !sources.length
      ) {

        return null;

      }


      return (

        <div
          className="truvora-sources"
        >

          <div
            className="sources-title"
          >

            <FiGlobe />

            <span>
              Sources
            </span>

          </div>


          <div
            className="sources-list"
          >

            {sources.map(
              (
                source,
                index
              ) => (

                <a

                  key={
                    `${source.url}-${index}`
                  }

                  href={
                    source.url
                  }

                  target="_blank"

                  rel="noopener noreferrer"

                  className="source-item"

                >

                  <span
                    className="source-number"
                  >

                    {
                      index + 1
                    }

                  </span>


                  <span
                    className="source-content"
                  >

                    <strong>
                      {
                        source.title
                      }
                    </strong>


                    <small>
                      {
                        getSourceDomain(
                          source.url
                        )
                      }
                    </small>

                  </span>


                  <span
                    className="source-arrow"
                  >
                    ↗
                  </span>

                </a>

              )
            )}

          </div>

        </div>

      );

    };


  /* ====================================================
     MESSAGE ACTIONS
     ==================================================== */

  const renderMessageActions =
    (
      message
    ) => {

      if (
        message.role !==
        "assistant"
      ) {

        return null;

      }


      return (

        <div
          className="message-actions"
        >

          <CopyToClipboard
            text={
              message.text ||
              ""
            }
          >

            <button
              type="button"
              title="Copy"
              className="message-action-btn"
            >

              <FiCopy />

            </button>

          </CopyToClipboard>


          <button

            type="button"

            title={
              speaking
                ? "Stop speaking"
                : "Read aloud"
            }

            className="message-action-btn"

            onClick={() => {

              if (
                speaking
              ) {

                stopSpeaking();

              } else {

                speakText(
                  message.text
                );

              }

            }}

          >

            <FiVolume2 />

          </button>


        </div>

      );

    };


  /* ====================================================
     MOBILE SIDEBAR TOGGLE
     ==================================================== */

  const toggleSidebar =
    () => {

      setSidebarOpen(
        (
          previous
        ) =>
          !previous
      );

    };


  /* ====================================================
     STOP GENERATION
     ==================================================== */

  const handleStopGeneration =
    () => {

      setStopGeneration(
        true
      );

      setLoading(
        false
      );

    };


  /* ====================================================
     PART 2 ENDS HERE
     ==================================================== */
  /* ====================================================
     LOGIN SCREEN
     ==================================================== */

  if (!user) {

    return (

      <div
        className="truvora-login-screen"
      >

        <div
          className="truvora-login-card"
        >

          <div
            className="truvora-logo"
          >

            <div
              className="truvora-logo-symbol"
            >
              T
            </div>


            <div
              className="truvora-logo-text"
            >

              <strong>
                {TRUVORA_NAME}
              </strong>

              <span>
                {TRUVORA_PRODUCT}
              </span>

            </div>

          </div>


          <div
            className="truvora-login-content"
          >

            <h1>
              Welcome to Truvora
            </h1>


            <p>
              Your intelligent global AI workspace.
            </p>


            <button

              type="button"

              className="google-login-button"

              onClick={
                handleGoogleLogin
              }

            >

              Continue with Google

            </button>

          </div>


          <div
            className="truvora-login-footer"
          >

            {TRUVORA_SLOGAN}

          </div>

        </div>

      </div>

    );

  }


  /* ====================================================
     MAIN APPLICATION
     ==================================================== */

  return (

    <div
      className="truvora-app"
    >


      {/* =================================================
          MOBILE BACKDROP
          ================================================= */}

      {sidebarOpen && (

        <div

          className="mobile-sidebar-backdrop"

          onClick={
            () =>
              setSidebarOpen(
                false
              )
          }

        />

      )}


      {/* =================================================
          SIDEBAR
          ================================================= */}

      <aside

        className={`truvora-sidebar ${
          sidebarOpen
            ? "sidebar-visible"
            : "sidebar-hidden"
        }`}

      >

        {/* BRAND */}

        <div
          className="sidebar-brand"
        >

          <div
            className="sidebar-brand-symbol"
          >
            T
          </div>


          <div
            className="sidebar-brand-text"
          >

            <strong>
              TRUVORA
            </strong>

            <span>
              GLOBAL AI
            </span>

          </div>


          <button

            type="button"

            className="sidebar-mobile-close"

            onClick={
              () =>
                setSidebarOpen(
                  false
                )
            }

            aria-label="Close sidebar"

          >

            <FiX />

          </button>

        </div>


        {/* NEW CHAT */}

        <button

          type="button"

          className="new-chat-button"

          onClick={
            handleNewChat
          }

        >

          <FiPlus />

          <span>
            New Chat
          </span>

        </button>


        {/* CHAT SEARCH */}

        <div
          className="sidebar-search"
        >

          <FiSearch />


          <input

            type="text"

            placeholder="Search chats..."

            value={
              chatSearch
            }

            onChange={
              (
                event
              ) =>
                setChatSearch(
                  event.target.value
                )
            }

          />

        </div>


        {/* CHAT SECTION */}

        <div
          className="sidebar-section"
        >

          <div
            className="sidebar-section-title"
          >
            RECENT CHATS
          </div>


          <div
            className="sidebar-chat-list"
          >

            {filteredChats.length >
            0 ? (

              filteredChats.map(
                (
                  chat,
                  index
                ) => {

                  /*
                   * Your existing Firebase
                   * structure can contain the
                   * message array directly.
                   */

                  const chatMessages =
                    Array.isArray(
                      chat
                    )

                      ? chat

                      : Array.isArray(
                          chat?.messages
                        )

                      ? chat.messages

                      : [];


                  const firstUserMessage =
                    chatMessages.find(
                      (
                        message
                      ) =>
                        message?.role ===
                        "user"
                    );


                  const title =
                    firstUserMessage?.text ||
                    "New conversation";


                  return (

                    <button

                      key={
                        chat?.id ||
                        index
                      }

                      type="button"

                      className="sidebar-chat-item"

                      onClick={() =>
                        openChat(
                          chatMessages
                        )
                      }

                    >

                      <span>
                        {
                          title.length >
                          52

                            ? `${title.slice(
                                0,
                                52
                              )}…`

                            : title
                        }
                      </span>

                    </button>

                  );

                }
              )

            ) : (

              <div
                className="sidebar-empty"
              >

                No conversations yet.

              </div>

            )}

          </div>

        </div>


        {/* SIDEBAR BOTTOM */}

        <div
          className="sidebar-bottom"
        >

          <div
            className="sidebar-user"
          >

            <div
              className="sidebar-user-avatar"
            >

              {user?.photoURL ? (

                <img

                  src={
                    user.photoURL
                  }

                  alt="User"

                />

              ) : (

                <FiUser />

              )}

            </div>


            <div
              className="sidebar-user-info"
            >

              <strong>
                {
                  user?.displayName ||
                  "Truvora User"
                }
              </strong>

              <span>
                {
                  user?.email ||
                  ""
                }
              </span>

            </div>

          </div>


          <button

            type="button"

            className="sidebar-logout"

            onClick={
              handleLogout
            }

          >

            Logout

          </button>

        </div>

      </aside>


      {/* =================================================
          MAIN CONTENT
          ================================================= */}

      <main
        className="truvora-main"
      >


        {/* =================================================
            TOP NAVIGATION
            ================================================= */}

        <header
          className="truvora-topbar"
        >

          <div
            className="topbar-left"
          >

            <button

              type="button"

              className="mobile-menu-button"

              onClick={
                toggleSidebar
              }

              aria-label="Open sidebar"

            >

              <FiMenu />

            </button>


            <div
              className="mobile-brand"
            >

              <strong>
                TRUVORA
              </strong>

              <span>
                GLOBAL AI
              </span>

            </div>

          </div>


          <div
            className="topbar-right"
          >

            <div
              className="topbar-slogan"
            >

              {TRUVORA_SLOGAN}

            </div>


            <div
              className="topbar-avatar"
            >

              {user?.photoURL ? (

                <img

                  src={
                    user.photoURL
                  }

                  alt="Profile"

                />

              ) : (

                <FiUser />

              )}

            </div>

          </div>

        </header>


        {/* =================================================
            CHAT AREA
            ================================================= */}

        <section
          className="truvora-chat-area"
        >

          {messages.length ===
          0 ? (

            /* =============================================
               EMPTY STATE
               ============================================= */

            <div
              className="truvora-empty-state"
            >

              <div
                className="empty-logo"
              >

                <div
                  className="empty-logo-symbol"
                >
                  T
                </div>

              </div>


              <h1>
                How can Truvora help?
              </h1>


              <p>
                Ask anything, analyze files,
                search the web, or use Agent mode.
              </p>


              <div
                className="empty-suggestions"
              >

                <button

                  type="button"

                  onClick={() => {

                    setInput(
                      "Explain artificial intelligence in simple terms."
                    );

                  }}

                >

                  Explain something

                </button>


                <button

                  type="button"

                  onClick={() => {

                    setInput(
                      "Research the latest AI developments."
                    );

                  }}

                >

                  Research latest news

                </button>


                <button

                  type="button"

                  onClick={() => {

                    setInput(
                      "Analyze this and give me a detailed summary."
                    );

                  }}

                >

                  Analyze something

                </button>

              </div>

            </div>

          ) : (

            /* =============================================
               MESSAGES
               ============================================= */

            <div
              className="message-list"
            >

              {messages.map(
                (
                  message,
                  index
                ) => (

                  <article

                    key={
                      message.id ||
                      index
                    }

                    className={`truvora-message ${
                      message.role ===
                      "user"

                        ? "truvora-user-message"

                        : "truvora-ai-message"
                    }`}

                  >

                    {/* AVATAR */}

                    <div
                      className="message-avatar"
                    >

                      {message.role ===
                      "user" ? (

                        user?.photoURL ? (

                          <img

                            src={
                              user.photoURL
                            }

                            alt="User"

                          />

                        ) : (

                          <FiUser />

                        )

                      ) : (

                        <span>
                          T
                        </span>

                      )}

                    </div>


                    {/* CONTENT */}

                    <div
                      className="message-body"
                    >

                      {/* USER / AI TEXT */}

                      <div
                        className="message-text"
                      >

                        <ReactMarkdown
                          remarkPlugins={[
                            remarkGfm,
                          ]}
                        >

                          {
                            message.text ||
                            ""
                          }

                        </ReactMarkdown>

                      </div>


                      {/* IMAGE */}

                      {message.image && (

                        <div
                          className="message-image-container"
                        >

                          <img

                            src={
                              message.image.startsWith(
                                "http"
                              )

                                ? message.image

                                : `${API_BASE}${message.image}`
                            }

                            alt="Uploaded content"

                            className="message-image"

                          />

                        </div>

                      )}


                      {/* GENERATED FILE */}

                      {message.document && (

                        <a

                          href={
                            message.document.startsWith(
                              "http"
                            )

                              ? message.document

                              : `${API_BASE}${message.document}`
                          }

                          target="_blank"

                          rel="noopener noreferrer"

                          className="generated-document"

                        >

                          <span>
                            📄
                          </span>

                          <span>
                            Open generated document
                          </span>

                        </a>

                      )}


                      {/* SOURCES */}

                      {renderSources(
                        message
                      )}


                      {/* ACTIONS */}

                      {renderMessageActions(
                        message
                      )}

                    </div>

                  </article>

                )
              )}


              {/* =========================================
                  TYPING
                  ========================================= */}

              {typingText && (

                <article
                  className="truvora-message truvora-ai-message"
                >

                  <div
                    className="message-avatar"
                  >

                    <span>
                      T
                    </span>

                  </div>


                  <div
                    className="message-body"
                  >

                    <div
                      className="message-text"
                    >

                      <ReactMarkdown
                        remarkPlugins={[
                          remarkGfm,
                        ]}
                      >

                        {
                          typingText
                        }

                      </ReactMarkdown>

                    </div>

                  </div>

                </article>

              )}


              {/* =========================================
                  LOADING
                  ========================================= */}

              {loading &&
              !typingText && (

                <div
                  className="truvora-thinking"
                >

                  <div
                    className="message-avatar"
                  >

                    <span>
                      T
                    </span>

                  </div>


                  <div
                    className="thinking-content"
                  >

                    <span>
                      Truvora is thinking
                    </span>


                    <span
                      className="thinking-dots"
                    >

                      <i />
                      <i />
                      <i />

                    </span>

                  </div>

                </div>

              )}


              <div
                ref={
                  messagesEndRef
                }
              />

            </div>

          )}

        </section>


        {/* =================================================
            COMPOSER
            ================================================= */}

        <footer
          className="truvora-composer-area"
        >

          <div
            className="truvora-composer"
          >

            {/* =============================================
                ATTACHMENT / MODE ROW
                ============================================= */}

            <div
              className="composer-toolbar"
            >

              <div
                className="composer-toolbar-left"
              >

                {/* FILE UPLOAD */}

                <div
                  {...getRootProps()}
                  className="composer-upload-wrapper"
                >

                  <input
                    {...getInputProps()}
                  />


                  <button

                    type="button"

                    className="composer-icon-button"

                    title="Upload file"

                  >

                    <FiUpload />

                  </button>

                </div>


                {/* VOICE */}

                <button

                  type="button"

                  className="composer-icon-button"

                  title="Voice input"

                  onClick={() => {

                    try {

                      SpeechRecognition
                        .startListening({
                          continuous:
                            false,

                          interimResults:
                            true,

                          language:
                            "en-IN",

                        });

                    } catch (
                      error
                    ) {

                      console.error(
                        "Speech recognition error:",
                        error
                      );

                    }

                  }}

                >

                  <FiMic />

                </button>


                {/* WEB */}

                <button

                  type="button"

                  className={`composer-mode-button ${
                    webEnabled
                      ? "mode-active"
                      : ""
                  }`}

                  title="Live Web"

                  onClick={() =>
                    setWebEnabled(
                      (
                        previous
                      ) =>
                        !previous
                    )
                  }

                >

                  <FiGlobe />

                  <span>
                    Web
                  </span>

                </button>


                {/* AGENT */}

                <button

                  type="button"

                  className={`composer-mode-button ${
                    agentMode
                      ? "mode-active"
                      : ""
                  }`}

                  title="Agent"

                  onClick={() =>
                    setAgentMode(
                      (
                        previous
                      ) =>
                        !previous
                    )
                  }

                >

                  <FiCpu />

                  <span>
                    Agent
                  </span>

                </button>

              </div>


              {/* ACTIVE MODE INDICATOR */}

              {(webEnabled ||
                agentMode) && (

                <div
                  className="active-mode-indicator"
                >

                  {webEnabled && (
                    <span>
                      🌐 Web
                    </span>
                  )}

                  {agentMode && (
                    <span>
                      🤖 Agent
                    </span>
                  )}

                </div>

              )}

            </div>


            {/* =============================================
                INPUT
                ============================================= */}

            <div
              className="composer-input-container"
            >

              <textarea

                className="truvora-input"

                value={
                  input
                }

                rows={1}

                placeholder="Ask Truvora anything..."

                onChange={
                  (
                    event
                  ) =>
                    setInput(
                      event.target.value
                    )
                }

                onKeyDown={
                  (
                    event
                  ) => {

                    /*
                     * Enter sends.
                     * Shift + Enter creates a new line.
                     */

                    if (
                      event.key ===
                        "Enter" &&
                      !event.shiftKey
                    ) {

                      event.preventDefault();


                      if (
                        !loading
                      ) {

                        handleSend();

                      }

                    }

                  }
                }

              />


              {/* SEND / STOP */}

              {loading ? (

                <button

                  type="button"

                  className="composer-send-button stop-button"

                  title="Stop generation"

                  onClick={
                    handleStopGeneration
                  }

                >

                  <FiSquare />

                </button>

              ) : (

                <button

                  type="button"

                  className="composer-send-button"

                  title="Send"

                  onClick={
                    handleSend
                  }

                  disabled={
                    !input.trim() &&
                    !pdfText &&
                    !image
                  }

                >

                  <FiSend />

                </button>

              )}

            </div>


            {/* =============================================
                ATTACHMENT STATUS
                ============================================= */}

            {(pdfText ||
              image) && (

              <div
                className="composer-attachment-status"
              >

                {pdfText && (

                  <span>

                    📄 PDF attached

                    <button

                      type="button"

                      onClick={() =>
                        setPdfText("")
                      }

                    >

                      <FiX />

                    </button>

                  </span>

                )}


                {image && (

                  <span>

                    🖼️ Image attached

                    <button

                      type="button"

                      onClick={() =>
                        setImage(null)
                      }

                    >

                      <FiX />

                    </button>

                  </span>

                )}

              </div>

            )}

          </div>


          <div
            className="composer-disclaimer"
          >

            Truvora may make mistakes.
            Verify important information.

          </div>

        </footer>

      </main>

    </div>

  );


  /* ====================================================
     PART 3 ENDS HERE
     ==================================================== */
}

export default App;
