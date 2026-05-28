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
} from "react-icons/fi";

import {
  CopyToClipboard,
} from "react-copy-to-clipboard";

import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";

import { useDropzone }
from "react-dropzone";

import * as pdfjsLib
from "pdfjs-dist";

import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";



/* FIREBASE */

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



function App() {

  const [input, setInput] =
    useState("");

  const [messages,
    setMessages] =
    useState([]);

  const [loading,
    setLoading] =
    useState(false);

  const [webEnabled,
    setWebEnabled] =
    useState(false);

  const [agentMode,
    setAgentMode] =
    useState(false);

  const [user,
    setUser] =
    useState(null);

  const [chatHistory,
    setChatHistory] =
    useState([]);

  const [pdfText,
    setPdfText] =
    useState("");

  const [image,
    setImage] =
    useState(null);

  const [typingText,
    setTypingText] =
    useState("");

  const [stopGeneration,
    setStopGeneration] =
    useState(false);

  const messagesEndRef =
    useRef(null);



  /* VOICE */

  const {
    transcript,
    resetTranscript,
  } =
    useSpeechRecognition();



  useEffect(() => {

    setInput(
      transcript
    );

  }, [transcript]);



  /* AUTO SCROLL */

  useEffect(() => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior:
          "smooth",
      });

  }, [messages, loading]);



  /* FIREBASE AUTH */

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {

          if (currentUser) {

            setUser(
              currentUser
            );

            const chats =
              await loadUserChats(
                currentUser.uid
              );

            setChatHistory(
              chats
            );

          } else {

            setUser(null);
          }
        }
      );

    return () =>
      unsubscribe();

  }, []);



  /* LOGIN */

  const handleGoogleLogin =
    async () => {

      try {

        await signInWithPopup(
          auth,
          googleProvider
        );

      } catch (error) {

        console.log(error);
      }
    };



  /* LOGOUT */

  const handleLogout =
    async () => {

      await signOut(auth);
    };



  /* SAVE CHAT */

  const saveCurrentChat =
    async (
      updatedMessages
    ) => {

      if (!user) return;

      await saveChatToCloud(
        user.uid,
        updatedMessages
      );

      const chats =
        await loadUserChats(
          user.uid
        );

      setChatHistory(
        chats
      );
    };



  /* SPEAK */

  const speakText =
    (text) => {

      const speech =
        new SpeechSynthesisUtterance(
          text
        );

      speech.lang =
        "en-US";

      window.speechSynthesis
        .speak(speech);
    };



  /* PDF */

  const handlePdfUpload =
    async (file) => {

      const fileReader =
        new FileReader();

      fileReader.onload =
        async function () {

          const typedArray =
            new Uint8Array(
              this.result
            );

          const pdf =
            await pdfjsLib
              .getDocument(
                typedArray
              ).promise;

          let extractedText =
            "";

          for (
            let i = 1;
            i <= pdf.numPages;
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
                (item) =>
                  item.str
              );

            extractedText +=
              strings.join(
                " "
              ) + "\n";
          }

          setPdfText(
            extractedText
          );

          alert(
            "PDF uploaded successfully"
          );
        };

      fileReader.readAsArrayBuffer(
        file
      );
    };



  /* UPLOAD */

  const {
    getRootProps,
    getInputProps,
  } = useDropzone({

    accept: {
      "application/pdf":
        [".pdf"],
      "image/*":
        [],
    },

    onDrop:
      async (
        acceptedFiles
      ) => {

        const file =
          acceptedFiles[0];

        if (!file)
          return;

        if (
          file.type ===
          "application/pdf"
        ) {

          handlePdfUpload(
            file
          );

        } else {

          try {

            const formData =
              new FormData();

            formData.append(
              "image",
              file
            );

            const response =
              await fetch(
                "http://localhost:5000/upload-image",
                {
                  method:
                    "POST",

                  body:
                    formData,
                }
              );

            const data =
              await response.json();

            console.log(
              data
            );

            if (
              data.imageUrl
            ) {

              setImage(
                data.imageUrl
              );

              alert(
                "Image uploaded successfully"
              );

            } else {

              alert(
                "Image upload failed"
              );
            }

          } catch (error) {

            console.log(
              error
            );

            alert(
              "Upload failed"
            );
          }
        }
      },
  });



  /* SEND */

  const handleSend =
    async () => {

      if (
        !input.trim() &&
        !pdfText &&
        !image
      )
        return;

      setStopGeneration(
        false
      );

      const finalPrompt =
        pdfText
          ? `
PDF CONTENT:

${pdfText}

USER QUESTION:

${input}
          `
          : input;

      const userMessage = {

        role: "user",

        text:
          image
            ? `🖼️ Image Uploaded\n\n${input}`
            : pdfText
            ? `📄 PDF Uploaded\n\n${input}`
            : input,
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

      setInput("");

      setLoading(true);

      try {

        const response =
          await fetch(
            "http://localhost:5000/ask",
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

                  web:
                    webEnabled,

                  agentMode:
                    agentMode,

                  imageUrl:
                    image,
                }),
            }
          );

        const data =
          await response.json();

        let currentText =
          "";

        for (
          let char of data.reply
        ) {

          if (
            stopGeneration
          )
            break;

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

        const finalMessages =
          [
            ...updatedMessages,

            {
              role:
                "assistant",

              text:
                currentText,
            },
          ];

        setMessages(
          finalMessages
        );

        await saveCurrentChat(
          finalMessages
        );

        speakText(
          currentText
        );

        setTypingText("");

        setPdfText("");

        setImage(null);

      } catch (error) {

        console.log(error);

        alert(
          "Server error"
        );
      }

      setLoading(false);
    };



  return (

    <div className="app">

      <div className="sidebar">

        <div className="logo">

          <div className="logo-icon">
            T
          </div>

          <div className="logo-text">

            <h2>TRUVORA</h2>

            <p>GLOBAL AI</p>

          </div>
        </div>



        <button className="new-chat">

          <FiPlus />

          New Chat

        </button>



        <p className="chat-title">

          CLOUD CHATS

        </p>



        <div className="chat-list">

          {chatHistory.map(
            (
              chat,
              index
            ) => (

              <div
                key={index}
                className="chat-item"
              >

                {chat[0]?.text?.slice(
                  0,
                  25
                )}

              </div>
            )
          )}
        </div>
      </div>



      <div className="main">

        <div className="topbar">

          <div className="menu-btn">

            <FiMenu />

          </div>

          <div className="top-title">

            TRUVORA GLOBAL AI

          </div>



          {user ? (

            <div
              className="logout"

              onClick={
                handleLogout
              }
            >

              Logout

            </div>

          ) : (

            <div
              className="logout"

              onClick={
                handleGoogleLogin
              }
            >

              Login

            </div>
          )}
        </div>



        <div className="messages">

          {messages.map(
            (
              msg,
              index
            ) => (

              <div
                key={index}

                className={`message ${
                  msg.role === "user"
                    ? "user-message"
                    : ""
                }`}
              >

                <div className="avatar">

                  {msg.role ===
                  "user"
                    ? <FiUser />
                    : "T"}

                </div>



                <div className="bubble">

                  <ReactMarkdown
                    remarkPlugins={[
                      remarkGfm,
                    ]}
                  >

                    {msg.text}

                  </ReactMarkdown>



                  <CopyToClipboard
                    text={msg.text}
                  >

                    <button
                      className="copy-btn"
                    >

                      <FiCopy />

                    </button>
                  </CopyToClipboard>
                </div>
              </div>
            )
          )}



          {typingText && (

            <div className="message">

              <div className="avatar">
                T
              </div>

              <div className="bubble">

                {typingText}

              </div>
            </div>
          )}



          <div
            ref={
              messagesEndRef
            }
          />
        </div>



        <div className="input-area">

          <div className="input-box">

            <div className="left-buttons">

              <button
                className={`icon-btn ${
                  webEnabled
                    ? "active-btn"
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
                    ? "active-btn"
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



              <div
                {...getRootProps()}
              >

                <input
                  {...getInputProps()}
                />

                <button
                  className="icon-btn"
                >

                  <FiUpload />

                </button>
              </div>



              <button
                className="icon-btn"

                onClick={() => {

                  SpeechRecognition.startListening({
                    continuous: true,
                    language: "en-US",
                  });
                }}
              >

                <FiMic />

              </button>



              <button
                className="icon-btn"

                onClick={() => {

                  SpeechRecognition.stopListening();

                  resetTranscript();
                }}
              >

                <FiSquare />

              </button>
            </div>



            <input
              type="text"

              className="main-input"

              placeholder="Ask Truvora anything..."

              value={input}

              onChange={(e) =>
                setInput(
                  e.target.value
                )
              }

              onKeyDown={(e) => {

                if (
                  e.key ===
                  "Enter"
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
    </div>
  );
}

export default App;