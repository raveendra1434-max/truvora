import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import "./App.css";


// ============================================================
// TRUVORA GLOBAL AI
// COMPLETE FRONTEND
// ============================================================


// ============================================================
// API CONFIG
// ============================================================

const API_BASE =
  (
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000"
  ).replace(/\/$/, "");


// ============================================================
// HELPERS
// ============================================================

function getText(message) {
  return (
    message?.text ??
    message?.content ??
    message?.answer ??
    message?.reply ??
    ""
  );
}


function downloadBlob(
  blob,
  filename
) {
  const url =
    window.URL.createObjectURL(
      blob
    );

  const a =
    document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(
    url
  );
}


function formatTime() {
  return new Date().toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}


// ============================================================
// MAIN APP
// ============================================================

export default function App() {

  // ==========================================================
  // CHAT
  // ==========================================================

  const [
    messages,
    setMessages,
  ] = useState([]);


  const [
    input,
    setInput,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    webEnabled,
    setWebEnabled,
  ] = useState(false);


  const [
    agentMode,
    setAgentMode,
  ] = useState(false);


  // ==========================================================
  // LANGUAGE / VOICE
  // ==========================================================

  const [
    selectedLanguage,
    setSelectedLanguage,
  ] = useState("English");


  const [
    selectedVoice,
    setSelectedVoice,
  ] = useState("alloy");


  // ==========================================================
  // UI
  // ==========================================================

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(true);


  const [
    activeTool,
    setActiveTool,
  ] = useState(null);


  const [
    error,
    setError,
  ] = useState("");


  const [
    speakingId,
    setSpeakingId,
  ] = useState(null);


  // ==========================================================
  // FILES
  // ==========================================================

  const [
    uploadedImage,
    setUploadedImage,
  ] = useState(null);


  const [
    uploadedFile,
    setUploadedFile,
  ] = useState(null);


  const [
    selectedAudio,
    setSelectedAudio,
  ] = useState(null);


  const [
    selectedVideo,
    setSelectedVideo,
  ] = useState(null);


  // ==========================================================
  // WEBSITE / YOUTUBE
  // ==========================================================

  const [
    websiteUrl,
    setWebsiteUrl,
  ] = useState("");


  const [
    youtubeUrl,
    setYoutubeUrl,
  ] = useState("");


  // ==========================================================
  // REFS
  // ==========================================================

  const inputRef =
    useRef(null);

  const imageInputRef =
    useRef(null);

  const documentInputRef =
    useRef(null);

  const audioInputRef =
    useRef(null);

  const videoInputRef =
    useRef(null);

  const messagesEndRef =
    useRef(null);


  // ==========================================================
  // LANGUAGE OPTIONS
  // ==========================================================

  const languages = [

    "English",
    "Hindi",
    "Telugu",
    "Kannada",
    "Tamil",
    "Malayalam",
    "Marathi",
    "Gujarati",
    "Bengali",
    "Punjabi",
    "Urdu",
    "Arabic",
    "Chinese",
    "Japanese",
    "Korean",
    "French",
    "German",
    "Spanish",
    "Italian",
    "Portuguese",
    "Russian",

  ];


  // ==========================================================
  // VOICES
  // ==========================================================

  const voices = [

    {
      value: "alloy",
      label: "Alloy",
    },

    {
      value: "ash",
      label: "Ash",
    },

    {
      value: "ballad",
      label: "Ballad",
    },

    {
      value: "coral",
      label: "Coral",
    },

    {
      value: "echo",
      label: "Echo",
    },

    {
      value: "fable",
      label: "Fable",
    },

    {
      value: "nova",
      label: "Nova",
    },

    {
      value: "onyx",
      label: "Onyx",
    },

    {
      value: "sage",
      label: "Sage",
    },

    {
      value: "shimmer",
      label: "Shimmer",
    },

  ];


  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages, loading]);


  // ==========================================================
  // INITIAL MESSAGE
  // ==========================================================

  useEffect(() => {

    if (
      messages.length === 0
    ) {

      setMessages([

        {
          id:
            crypto.randomUUID(),

          role:
            "assistant",

          text:
            "Hi! I'm Truvora Global AI. How can I help you today?",

          time:
            formatTime(),

        },

      ]);

    }

  }, []);


  // ==========================================================
  // API REQUEST
  // ==========================================================

  async function apiRequest(
    endpoint,
    options = {}
  ) {

    const response =
      await fetch(
        `${API_BASE}${endpoint}`,
        options
      );


    const contentType =
      response.headers.get(
        "content-type"
      ) || "";


    let data;


    if (
      contentType.includes(
        "application/json"
      )
    ) {

      data =
        await response.json();

    } else {

      const text =
        await response.text();

      data = {
        success:
          response.ok,

        error:
          text ||
          `Request failed (${response.status})`,
      };

    }


    if (
      !response.ok
    ) {

      throw new Error(
        data?.error ||
        `Request failed (${response.status})`
      );
    }


    return data;
  }


  // ==========================================================
  // SEND CHAT
  // ==========================================================

  async function sendMessage(
    overrideText = null
  ) {

    const text =
      (
        overrideText ??
        input
      )
        .trim();


    if (
      !text ||
      loading
    ) {

      return;
    }


    setError("");
    setInput("");
    setLoading(true);


    const userMessage = {

      id:
        crypto.randomUUID(),

      role:
        "user",

      text,

      time:
        formatTime(),

    };


    setMessages(
      previous => [
        ...previous,
        userMessage,
      ]
    );


    try {

      const history =
        messages

          .filter(
            m =>
              m.role === "user" ||
              m.role === "assistant"
          )

          .slice(-20)

          .map(
            m => ({
              role:
                m.role,

              content:
                getText(m),
            })
          );


      const data =
        await apiRequest(
          "/ask",
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
                  text,

                history,

                webEnabled,

                web:
                  webEnabled,

                agentMode,

                language:
                  selectedLanguage,

              }),

          }
        );


      const answer =
        data.answer ||
        data.reply ||
        data.response ||
        data.message ||
        "No answer returned.";


      setMessages(
        previous => [

          ...previous,

          {

            id:
              crypto.randomUUID(),

            role:
              "assistant",

            text:
              answer,

            sources:
              data.sources ||
              [],

            time:
              formatTime(),

          },

        ]
      );


    } catch (err) {

      console.error(
        "TRUVORA CHAT ERROR:",
        err
      );


      setError(
        err.message ||
        "Unable to connect to Truvora server."
      );


      setMessages(
        previous => [

          ...previous,

          {

            id:
              crypto.randomUUID(),

            role:
              "assistant",

            text:
              `⚠️ ${err.message || "Something went wrong."}`,

            time:
              formatTime(),

          },

        ]
      );

    } finally {

      setLoading(false);

    }

  }


  // ==========================================================
  // ENTER KEY
  // ==========================================================

  function handleKeyDown(
    event
  ) {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  }


  // ==========================================================
  // NEW CHAT
  // ==========================================================

  function newChat() {

    setMessages([

      {
        id:
          crypto.randomUUID(),

        role:
          "assistant",

        text:
          "New chat started. How can I help you?",

        time:
          formatTime(),

      },

    ]);

    setInput("");
    setError("");

  }


  // ==========================================================
  // TEXT TO SPEECH
  // ==========================================================

  async function speakText(
    text,
    messageId
  ) {

    if (
      !text
    ) {

      return;
    }


    // Stop current browser speech
    if (
      window.speechSynthesis
    ) {

      window.speechSynthesis.cancel();

    }


    try {

      setSpeakingId(
        messageId
      );


      const data =
        await apiRequest(
          "/tts",
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

            },

            body:
              JSON.stringify({

                text:
                  text.slice(
                    0,
                    12000
                  ),

                voice:
                  selectedVoice,

              }),

          }
        );


      if (
        data.audioUrl
      ) {

        const audio =
          new Audio(
            data.audioUrl
          );


        audio.onended =
          () =>
            setSpeakingId(null);


        audio.onerror =
          () =>
            setSpeakingId(null);


        await audio.play();

      } else {

        // Browser fallback
        const speech =
          new SpeechSynthesisUtterance(
            text
          );

        speech.lang =
          selectedLanguage ===
          "Hindi"
            ? "hi-IN"
            : selectedLanguage ===
              "Telugu"
            ? "te-IN"
            : selectedLanguage ===
              "Kannada"
            ? "kn-IN"
            : selectedLanguage ===
              "Tamil"
            ? "ta-IN"
            : selectedLanguage ===
              "Malayalam"
            ? "ml-IN"
            : "en-US";


        speech.onend =
          () =>
            setSpeakingId(null);

        speech.onerror =
          () =>
            setSpeakingId(null);


        window.speechSynthesis.speak(
          speech
        );

      }

    } catch (err) {

      console.error(
        "TTS ERROR:",
        err
      );

      setSpeakingId(null);

      setError(
        err.message ||
        "Voice generation failed."
      );

    }

  }


  // ==========================================================
  // STOP SPEECH
  // ==========================================================

  function stopSpeech() {

    if (
      window.speechSynthesis
    ) {

      window.speechSynthesis.cancel();

    }

    setSpeakingId(null);

  }


  // ==========================================================
  // IMAGE UPLOAD
  // ==========================================================

  async function handleImageUpload(
    event
  ) {

    const file =
      event.target.files?.[0];


    if (
      !file
    ) {

      return;
    }


    setError("");


    const formData =
      new FormData();


    formData.append(
      "image",
      file
    );


    try {

      setLoading(true);


      const data =
        await apiRequest(
          "/upload-image",
          {

            method:
              "POST",

            body:
              formData,

          }
        );


      setUploadedImage(
        data.imageUrl
      );


      // Immediately analyze
      const analysis =
        await apiRequest(
          "/analyze-image",
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

            },

            body:
              JSON.stringify({

                image:
                  data.imageUrl,

                language:
                  selectedLanguage,

              }),

          }
        );


      setMessages(
        previous => [

          ...previous,

          {

            id:
              crypto.randomUUID(),

            role:
              "user",

            text:
              `🖼️ Uploaded image: ${file.name}`,

            time:
              formatTime(),

          },

          {

            id:
              crypto.randomUUID(),

            role:
              "assistant",

            text:
              analysis.analysis ||
              analysis.answer ||
              "Image analysis completed.",

            sources:
              analysis.sources ||
              [],

            image:
              data.imageUrl,

            shoppingResults:
              analysis.shoppingResults ||
              [],

            time:
              formatTime(),

          },

        ]
      );


    } catch (err) {

      console.error(
        "IMAGE ERROR:",
        err
      );

      setError(
        err.message ||
        "Image analysis failed."
      );

    } finally {

      setLoading(false);

      event.target.value = "";

    }

  }


  // ==========================================================
  // DOCUMENT ANALYSIS
  // ==========================================================

  async function handleDocumentUpload(
    event
  ) {

    const file =
      event.target.files?.[0];


    if (
      !file
    ) {

      return;
    }


    setError("");
    setLoading(true);


    const formData =
      new FormData();


    formData.append(
      "file",
      file
    );


    formData.append(
      "language",
      selectedLanguage
    );


    try {

      const data =
        await apiRequest(
          "/analyze-document",
          {

            method:
              "POST",

            body:
              formData,

          }
        );


      setUploadedFile(
        file.name
      );


      setMessages(
        previous => [

          ...previous,

          {

            id:
              crypto.randomUUID(),

            role:
              "user",

            text:
              `📄 Analyze document: ${file.name}`,

            time:
              formatTime(),

          },

          {

            id:
              crypto.randomUUID(),

            role:
              "assistant",

            text:
              data.analysis ||
              data.answer ||
              "Document analysis completed.",

            time:
              formatTime(),

          },

        ]
      );


    } catch (err) {

      console.error(
        "DOCUMENT ERROR:",
        err
      );

      setError(
        err.message ||
        "Document analysis failed."
      );

    } finally {

      setLoading(false);

      event.target.value = "";

    }

  }


  // ==========================================================
  // AUDIO
  // ==========================================================

  async function handleAudioUpload(
    event
  ) {

    const file =
      event.target.files?.[0];


    if (
      !file
    ) {

      return;
    }


    setSelectedAudio(
      file.name
    );


    setLoading(true);
    setError("");


    const formData =
      new FormData();


    formData.append(
      "audio",
      file
    );


    formData.append(
      "language",
      selectedLanguage
    );


    try {

      const data =
        await apiRequest(
          "/upload-audio",
          {

            method:
              "POST",

            body:
              formData,

          }
        );


      setMessages(
        previous => [

          ...previous,

          {

            id:
              crypto.randomUUID(),

            role:
              "user",

            text:
              `🎵 Analyze audio: ${file.name}`,

            time:
              formatTime(),

          },

          {

            id:
              crypto.randomUUID(),

            role:
              "assistant",

            text:
              data.analysis ||
              data.answer ||
              "Audio analysis completed.",

            transcript:
              data.transcript,

            time:
              formatTime(),

          },

        ]
      );


    } catch (err) {

      console.error(
        "AUDIO ERROR:",
        err
      );

      setError(
        err.message ||
        "Audio analysis failed."
      );

    } finally {

      setLoading(false);

      event.target.value = "";

    }

  }


  // ==========================================================
  // VIDEO
  // ==========================================================

  async function handleVideoUpload(
    event
  ) {

    const file =
      event.target.files?.[0];


    if (
      !file
    ) {

      return;
    }


    setSelectedVideo(
      file.name
    );


    setLoading(true);
    setError("");


    const formData =
      new FormData();


    formData.append(
      "video",
      file
    );


    formData.append(
      "language",
      selectedLanguage
    );


    try {

      const data =
        await apiRequest(
          "/upload-video",
          {

            method:
              "POST",

            body:
              formData,

          }
        );


      setMessages(
        previous => [

          ...previous,

          {

            id:
              crypto.randomUUID(),

            role:
              "user",

            text:
              `🎬 Analyze video: ${file.name}`,

            time:
              formatTime(),

          },

          {

            id:
              crypto.randomUUID(),

            role:
              "assistant",

            text:
              data.analysis ||
              data.answer ||
              "Video analysis completed.",

            transcript:
              data.transcript,

            frameUrl:
              data.frameUrl,

            time:
              formatTime(),

          },

        ]
      );


    } catch (err) {

      console.error(
        "VIDEO ERROR:",
        err
      );

      setError(
        err.message ||
        "Video analysis failed."
      );

    } finally {

      setLoading(false);

      event.target.value = "";

    }

  }


  // ==========================================================
  // WEBSITE ANALYSIS
  // ==========================================================

  async function handleWebsiteAnalysis() {

    const url =
      websiteUrl.trim();


    if (
      !url
    ) {

      return;
    }


    setActiveTool(null);
    setLoading(true);
    setError("");


    try {

      const data =
        await apiRequest(
          "/analyze-website",
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

            },

            body:
              JSON.stringify({

                url,

                language:
                  selectedLanguage,

              }),

          }
        );


      setMessages(
        previous => [

          ...previous,

          {

            id:
              crypto.randomUUID(),

            role:
              "user",

            text:
              `🌐 Analyze website: ${url}`,

            time:
              formatTime(),

          },

          {

            id:
              crypto.randomUUID(),

            role:
              "assistant",

            text:
              data.analysis ||
              data.answer ||
              "Website analysis completed.",

            sources:
              data.sources ||
              [],

            time:
              formatTime(),

          },

        ]
      );


      setWebsiteUrl("");


    } catch (err) {

      console.error(
        "WEBSITE ERROR:",
        err
      );

      setError(
        err.message ||
        "Unable to analyze website."
      );

    } finally {

      setLoading(false);

    }

  }


  // ==========================================================
  // YOUTUBE
  // ==========================================================

  async function handleYoutubeAnalysis() {

    const url =
      youtubeUrl.trim();


    if (
      !url
    ) {

      return;
    }


    setActiveTool(null);
    setLoading(true);
    setError("");


    try {

      const data =
        await apiRequest(
          "/analyze-youtube",
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

            },

            body:
              JSON.stringify({

                url,

                language:
                  selectedLanguage,

              }),

          }
        );


      setMessages(
        previous => [

          ...previous,

          {

            id:
              crypto.randomUUID(),

            role:
              "user",

            text:
              `▶️ Analyze YouTube: ${url}`,

            time:
              formatTime(),

          },

          {

            id:
              crypto.randomUUID(),

            role:
              "assistant",

            text:
              data.analysis ||
              data.answer ||
              "YouTube analysis completed.",

            transcript:
              data.transcript,

            time:
              formatTime(),

          },

        ]
      );


      setYoutubeUrl("");


    } catch (err) {

      console.error(
        "YOUTUBE ERROR:",
        err
      );

      setError(
        err.message ||
        "YouTube analysis failed."
      );

    } finally {

      setLoading(false);

    }

  }


  // ==========================================================
  // IMAGE GENERATION
  // ==========================================================

  async function generateImage() {

    const prompt =
      window.prompt(
        "What image should Truvora create?"
      );


    if (
      !prompt?.trim()
    ) {

      return;
    }


    setLoading(true);
    setError("");


    try {

      // Use the normal AI endpoint first.
      // This keeps the feature compatible
      // with existing Truvora routing.

      const data =
        await apiRequest(
          "/ask",
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
                  `Generate an image for this request: ${prompt}`,

                history: [],

                webEnabled:
                  false,

                language:
                  selectedLanguage,

              }),

          }
        );


      const answer =
        data.answer ||
        data.reply ||
        "Image generation request completed.";


      setMessages(
        previous => [

          ...previous,

          {

            id:
              crypto.randomUUID(),

            role:
              "user",

            text:
              `🎨 Create image: ${prompt}`,

            time:
              formatTime(),

          },

          {

            id:
              crypto.randomUUID(),

            role:
              "assistant",

            text:
              answer,

            time:
              formatTime(),

          },

        ]
      );


    } catch (err) {

      setError(
        err.message ||
        "Image generation failed."
      );

    } finally {

      setLoading(false);

    }

  }


  // ==========================================================
  // DOCUMENT GENERATION
  // ==========================================================

  async function generateDocument(
    type,
    message
  ) {

    if (
      !message
    ) {

      setError(
        "There is no content to generate."
      );

      return;
    }


    setError("");


    try {

      const data =
        await apiRequest(
          "/generate-document",
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

            },

            body:
              JSON.stringify({

                type,

                summary:
                  message,

                analysis:
                  message,

                recommendations:
                  "",

                sources:
                  [],

              }),

          }
        );


      if (
        data.url
      ) {

        const response =
          await fetch(
            data.url
          );


        if (
          response.ok
        ) {

          const blob =
            await response.blob();


          downloadBlob(
            blob,
            data.filename ||
              `truvora.${type}`
          );

        } else {

          window.open(
            data.url,
            "_blank"
          );

        }

      } else {

        throw new Error(
          "Server did not return a download URL."
        );

      }

    } catch (err) {

      console.error(
        "DOCUMENT GENERATION ERROR:",
        err
      );

      setError(
        err.message ||
        "Document generation failed."
      );

    }

  }


  // ==========================================================
  // SOURCE CLICK
  // ==========================================================

  function openSource(
    url
  ) {

    if (
      url
    ) {

      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

    }

  }


  // ==========================================================
  // TOOL MODAL
  // ==========================================================

  function renderToolModal() {

    if (
      !activeTool
    ) {

      return null;
    }


    return (

      <div
        className="truvora-modal-backdrop"
        onClick={() =>
          setActiveTool(null)
        }
      >

        <div
          className="truvora-modal"
          onClick={e =>
            e.stopPropagation()
          }
        >

          {activeTool ===
            "website" && (

            <>

              <div className="modal-title">
                🌐 Website Analysis
              </div>

              <div className="modal-description">
                Enter a website URL to analyze it with Truvora.
              </div>

              <input
                className="modal-input"
                value={websiteUrl}
                onChange={e =>
                  setWebsiteUrl(
                    e.target.value
                  )
                }
                placeholder="https://example.com"
                autoFocus
                onKeyDown={e => {

                  if (
                    e.key ===
                    "Enter"
                  ) {

                    handleWebsiteAnalysis();

                  }

                }}
              />

              <button
                className="modal-primary"
                onClick={
                  handleWebsiteAnalysis
                }
                disabled={
                  loading ||
                  !websiteUrl.trim()
                }
              >
                🔎 Analyze Website
              </button>

            </>
          )}


          {activeTool ===
            "youtube" && (

            <>

              <div className="modal-title">
                ▶️ YouTube Analysis
              </div>

              <div className="modal-description">
                Paste a YouTube video URL.
              </div>

              <input
                className="modal-input"
                value={youtubeUrl}
                onChange={e =>
                  setYoutubeUrl(
                    e.target.value
                  )
                }
                placeholder="https://youtube.com/watch?v=..."
                autoFocus
                onKeyDown={e => {

                  if (
                    e.key ===
                    "Enter"
                  ) {

                    handleYoutubeAnalysis();

                  }

                }}
              />

              <button
                className="modal-primary"
                onClick={
                  handleYoutubeAnalysis
                }
                disabled={
                  loading ||
                  !youtubeUrl.trim()
                }
              >
                🔎 Analyze Video
              </button>

            </>
          )}


          <button
            className="modal-cancel"
            onClick={() =>
              setActiveTool(null)
            }
          >
            ❌ Cancel
          </button>

        </div>

      </div>

    );

  }


  // ==========================================================
  // MESSAGE CARD
  // ==========================================================

  function renderMessage(
    message
  ) {

    const isUser =
      message.role ===
      "user";


    return (

      <div
        key={message.id}
        className={
          `message-row ${
            isUser
              ? "user-row"
              : "assistant-row"
          }`
        }
      >

        <div
          className={
            `message-avatar ${
              isUser
                ? "user-avatar"
                : "assistant-avatar"
            }`
          }
        >
          {isUser
            ? "U"
            : "T"}
        </div>


        <div className="message-content">

          <div
            className={
              `message-bubble ${
                isUser
                  ? "user-bubble"
                  : "assistant-bubble"
              }`
            }
          >

            {message.image && (

              <img
                className="chat-image"
                src={
                  message.image
                }
                alt="Uploaded"
              />

            )}


            {message.frameUrl && (

              <img
                className="chat-image"
                src={
                  message.frameUrl
                }
                alt="Video frame"
              />

            )}


            <div className="message-text">
              {getText(
                message
              )}
            </div>


            {!isUser &&
              message.transcript && (

              <details
                className="transcript-box"
              >

                <summary>
                  📝 Transcript
                </summary>

                <div>
                  {
                    message.transcript
                  }
                </div>

              </details>

            )}


            {!isUser &&
              message.sources?.length >
                0 && (

              <div className="sources">

                <div className="sources-title">
                  📚 Sources
                </div>

                {message.sources.map(
                  (
                    source,
                    index
                  ) => (

                    <button
                      key={
                        source.id ||
                        index
                      }
                      className="source-link"
                      onClick={() =>
                        openSource(
                          source.url
                        )
                      }
                    >

                      [{source.id ||
                        index + 1}]

                      {" "}

                      {
                        source.title ||
                        source.source ||
                        source.url
                      }

                    </button>

                  )
                )}

              </div>

            )}


            {!isUser &&
              message.shoppingResults
                ?.length > 0 && (

              <div className="shopping-results">

                <div className="sources-title">
                  🛍️ Product Results
                </div>

                {message.shoppingResults.map(
                  (
                    product,
                    index
                  ) => (

                    <div
                      className="product-result"
                      key={
                        index
                      }
                    >

                      {product.thumbnail && (

                        <img
                          src={
                            product.thumbnail
                          }
                          alt=""
                        />

                      )}

                      <div>

                        <strong>
                          {
                            product.title
                          }
                        </strong>

                        {product.price && (

                          <div>
                            {
                              product.price
                            }
                          </div>

                        )}

                        {product.link && (

                          <button
                            className="source-link"
                            onClick={() =>
                              openSource(
                                product.link
                              )
                            }
                          >
                            View
                          </button>

                        )}

                      </div>

                    </div>

                  )
                )}

              </div>

            )}


            {!isUser && (

              <div className="message-actions">

                {speakingId ===
                  message.id ? (

                  <button
                    title="Stop"
                    onClick={
                      stopSpeech
                    }
                  >
                    ⏹ Stop
                  </button>

                ) : (

                  <button
                    title="Read aloud"
                    onClick={() =>
                      speakText(
                        getText(
                          message
                        ),
                        message.id
                      )
                    }
                  >
                    🔊
                  </button>

                )}


                <button
                  title="Copy"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      getText(
                        message
                      )
                    )
                  }
                >
                  📋
                </button>


                <button
                  onClick={() =>
                    generateDocument(
                      "pdf",
                      getText(
                        message
                      )
                    )
                  }
                >
                  📄 PDF
                </button>


                <button
                  onClick={() =>
                    generateDocument(
                      "docx",
                      getText(
                        message
                      )
                    )
                  }
                >
                  📝 DOCX
                </button>


                <button
                  onClick={() =>
                    generateDocument(
                      "xlsx",
                      getText(
                        message
                      )
                    )
                  }
                >
                  📊 XLSX
                </button>


                <button
                  onClick={() =>
                    generateDocument(
                      "pptx",
                      getText(
                        message
                      )
                    )
                  }
                >
                  📽️ PPTX
                </button>


                <button
                  onClick={() =>
                    generateDocument(
                      "html",
                      getText(
                        message
                      )
                    )
                  }
                >
                  🌐 HTML
                </button>


                <button
                  onClick={() =>
                    generateDocument(
                      "md",
                      getText(
                        message
                      )
                    )
                  }
                >
                  📝 MD
                </button>


                <button
                  onClick={() =>
                    generateDocument(
                      "txt",
                      getText(
                        message
                      )
                    )
                  }
                >
                  TXT
                </button>


                <button
                  onClick={() =>
                    generateDocument(
                      "json",
                      getText(
                        message
                      )
                    )
                  }
                >
                  JSON
                </button>


                <button
                  onClick={() =>
                    generateDocument(
                      "xml",
                      getText(
                        message
                      )
                    )
                  }
                >
                  XML
                </button>


                <button
                  onClick={() =>
                    generateDocument(
                      "rtf",
                      getText(
                        message
                      )
                    )
                  }
                >
                  RTF
                </button>

              </div>

            )}

          </div>


          <div className="message-time">
            {message.time}
          </div>

        </div>

      </div>

    );

  }


  // ==========================================================
  // RETURN
  // ==========================================================

  return (

    <div className="truvora-app">


      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      {sidebarOpen && (

        <aside className="truvora-sidebar">

          <div className="brand">

            <div className="brand-logo">
              T
            </div>

            <div>

              <div className="brand-name">
                TRUVORA
              </div>

              <div className="brand-subtitle">
                GLOBAL AI
              </div>

            </div>

          </div>


          <button
            className="new-chat-button"
            onClick={newChat}
          >
            ＋
            <span>
              New Chat
            </span>
          </button>


          <input
            className="chat-search"
            placeholder="Search chats..."
          />


          <div className="sidebar-label">
            CLOUD CHATS
          </div>


          <div className="chat-history">

            {messages
              .filter(
                m =>
                  m.role === "user"
              )
              .slice(-15)
              .reverse()
              .map(
                message => (

                  <button
                    className="history-item"
                    key={
                      message.id
                    }
                    onClick={() => {

                      setInput(
                        getText(
                          message
                        )
                      );

                      inputRef.current?.focus();

                    }}
                  >

                    {getText(
                      message
                    ).slice(
                      0,
                      38
                    )}

                  </button>

                )
              )}

          </div>


          <div className="sidebar-footer">

            <div>
              Truvora Global AI
            </div>

            <small>
              Intelligence • Innovation • Trust
            </small>

          </div>

        </aside>

      )}


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="truvora-main">


        {/* HEADER */}

        <header className="truvora-header">

          <button
            className="menu-button"
            onClick={() =>
              setSidebarOpen(
                previous =>
                  !previous
              )
            }
          >
            ☰
          </button>


          <div className="header-title">
            TRUVORA GLOBAL AI
          </div>


          <button
            className="logout-button"
            onClick={() => {

              if (
                window.confirm(
                  "Clear this local Truvora session?"
                )
              ) {

                newChat();

              }

            }}
          >
            Logout
          </button>

        </header>


        {/* CHAT AREA */}

        <section className="chat-area">

          {messages.map(
            renderMessage
          )}


          {loading && (

            <div className="message-row assistant-row">

              <div className="message-avatar assistant-avatar">
                T
              </div>

              <div className="message-content">

                <div className="message-bubble assistant-bubble typing-bubble">

                  <span />
                  <span />
                  <span />

                </div>

              </div>

            </div>

          )}


          <div
            ref={
              messagesEndRef
            }
          />

        </section>


        {/* ERROR */}

        {error && (

          <div className="error-banner">

            ⚠️ {error}

            <button
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>

          </div>

        )}


        {/* ====================================================
            COMPOSER
        ==================================================== */}

        <section className="composer-container">


          {/* TOOL BAR */}

          <div className="composer-toolbar">


            {/* WEBSITE */}

            <button
              title="Website Analysis"
              onClick={() =>
                setActiveTool(
                  "website"
                )
              }
            >
              🌐
            </button>


            {/* DOCUMENT */}

            <button
              title="Analyze Document"
              onClick={() =>
                documentInputRef.current?.click()
              }
            >
              📄
            </button>


            {/* IMAGE */}

            <button
              title="Upload Image"
              onClick={() =>
                imageInputRef.current?.click()
              }
            >
              🖼️
            </button>


            {/* AUDIO */}

            <button
              title="Analyze Audio"
              onClick={() =>
                audioInputRef.current?.click()
              }
            >
              🎤
            </button>


            {/* VIDEO */}

            <button
              title="Analyze Video"
              onClick={() =>
                videoInputRef.current?.click()
              }
            >
              🎬
            </button>


            {/* YOUTUBE */}

            <button
              title="YouTube Analysis"
              onClick={() =>
                setActiveTool(
                  "youtube"
                )
              }
            >
              ▶️
            </button>


            {/* IMAGE GENERATION */}

            <button
              title="Create Image"
              onClick={
                generateImage
              }
            >
              🎨
            </button>


            {/* WEB */}

            <button
              className={
                webEnabled
                  ? "toolbar-active"
                  : ""
              }
              title="Web Search"
              onClick={() =>
                setWebEnabled(
                  previous =>
                    !previous
                )
              }
            >
              🔎
            </button>


            {/* AGENT */}

            <button
              className={
                agentMode
                  ? "toolbar-active"
                  : ""
              }
              title="Agent Mode"
              onClick={() =>
                setAgentMode(
                  previous =>
                    !previous
                )
              }
            >
              🤖
            </button>


            {/* LANGUAGE */}

            <select
              value={
                selectedLanguage
              }
              onChange={e =>
                setSelectedLanguage(
                  e.target.value
                )
              }
              className="toolbar-select"
            >

              {languages.map(
                language => (

                  <option
                    key={
                      language
                    }
                    value={
                      language
                    }
                  >
                    {language}
                  </option>

                )
              )}

            </select>


            {/* VOICE */}

            <select
              value={
                selectedVoice
              }
              onChange={e =>
                setSelectedVoice(
                  e.target.value
                )
              }
              className="toolbar-select voice-select"
            >

              {voices.map(
                voice => (

                  <option
                    key={
                      voice.value
                    }
                    value={
                      voice.value
                    }
                  >
                    {voice.label}
                  </option>

                )
              )}

            </select>


          </div>


          {/* INPUT */}

          <div className="composer-input-row">

            <textarea
              ref={
                inputRef
              }
              value={
                input
              }
              onChange={e =>
                setInput(
                  e.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder="Ask Truvora anything..."
              rows={1}
            />


            <button
              className="send-button"
              onClick={() =>
                sendMessage()
              }
              disabled={
                loading ||
                !input.trim()
              }
            >
              ➤
            </button>

          </div>


          {/* STATUS */}

          <div className="composer-status">

            {webEnabled &&
              "🌐 Web search ON"}

            {agentMode &&
              "  🤖 Agent ON"}

            {!webEnabled &&
              !agentMode &&
              "Intelligence • Innovation • Trust"}

          </div>

        </section>


      </main>


      {/* HIDDEN FILE INPUTS */}

      <input
        ref={
          imageInputRef
        }
        type="file"
        accept="image/*"
        hidden
        onChange={
          handleImageUpload
        }
      />


      <input
        ref={
          documentInputRef
        }
        type="file"
        accept="
          .pdf,
          .docx,
          .xlsx,
          .xls,
          .csv,
          .txt,
          .md,
          .json,
          .xml,
          .rtf
        "
        hidden
        onChange={
          handleDocumentUpload
        }
      />


      <input
        ref={
          audioInputRef
        }
        type="file"
        accept="audio/*"
        hidden
        onChange={
          handleAudioUpload
        }
      />


      <input
        ref={
          videoInputRef
        }
        type="file"
        accept="video/*"
        hidden
        onChange={
          handleVideoUpload
        }
      />


      {renderToolModal()}

    </div>

  );
}