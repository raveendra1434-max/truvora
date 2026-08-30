/*
 * TRUVORA GLOBAL AI — CLEAN APP.JS
 * Preserves the existing Truvora frontend/backend contract.
 * Web search and agent capability are enabled automatically;
 * the backend decides when they are actually needed.
 */

import "./App.css";
import { languageGroups } from "./data/languageGroups";
import Select from "react-select";

import {
  useState,
  useRef,
  useEffect,
} from "react";

import {
  FiSend,
  FiPlus,
  FiMenu,
  FiCopy,
  FiUser,
  FiUpload,
  FiMic,
  FiSquare,
  FiVolume2,
} from "react-icons/fi";

import {
  CopyToClipboard,
} from "react-copy-to-clipboard";

import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";

import { useDropzone }
from "react-dropzone";

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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";


function saveChat(chat) {
  localStorage.setItem(
    `truvora-chat-${Date.now()}`,
    JSON.stringify(chat)
  );
}


function App() {

  /* =====================================================
     CITATIONS
  ===================================================== */

  const citationRefs = (sources = []) =>
    sources.map((source, index) => ({
      ...source,
      citationNumber: index + 1,
      sourceUrl:
        source.url ||
        source.videoUrl ||
        source.youtubeUrl ||
        "#",
    }));

  const [activeCitation, setActiveCitation] =
    useState(null);

  const [citationPreviewOpen, setCitationPreviewOpen] =
    useState(false);


  /* =====================================================
     YOUTUBE URL HANDLING
  ===================================================== */

  useEffect(() => {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const youtubeUrl =
      params.get("youtube");

    if (youtubeUrl) {

      const url =
        decodeURIComponent(youtubeUrl);

      handleYouTube(url);

      window.history.replaceState(
        {},
        "",
        "/"
      );
    }

  }, []);


  /* =====================================================
     BASIC STATE
  ===================================================== */

  const [input, setInput] =
    useState("");

  const [selectedVoice,
    setSelectedVoice] =
    useState("alloy");

  const [personalVoice,
    setPersonalVoice] =
    useState(null);

  const [showPersonalVoice,
    setShowPersonalVoice] =
    useState(false);


  /* =====================================================
     VOICE OPTIONS
  ===================================================== */

  const voiceOptions = [

    {
      id: "alloy",
      name: "Alloy"
    },

    {
      id: "ash",
      name: "Ash"
    },

    {
      id: "ballad",
      name: "Ballad"
    },

    {
      id: "coral",
      name: "Coral"
    },

    {
      id: "echo",
      name: "Echo"
    },

    {
      id: "fable",
      name: "Fable"
    },

    {
      id: "nova",
      name: "Nova"
    },

    {
      id: "onyx",
      name: "Onyx"
    },

    {
      id: "sage",
      name: "Sage"
    },

    {
      id: "shimmer",
      name: "Shimmer"
    },

    {
      id: "verse",
      name: "Verse"
    },

    {
      id: "marin",
      name: "Marin"
    },

    {
      id: "cedar",
      name: "Cedar"
    },

    {
      id: "personal",
      name: "?? Add Personal Voice"
    },

  ];


  /* =====================================================
     LOGIN
  ===================================================== */

  const [username,
    setUsername] =
    useState("");

  const [password,
    setPassword] =
    useState("");

  const [loginError,
    setLoginError] =
    useState("");

  const [loggedIn,
    setLoggedIn] =
    useState(false);


  /* =====================================================
     CHAT
  ===================================================== */

  const [messages,
    setMessages] =
    useState([]);

  const [sidebarOpen,
    setSidebarOpen] =
    useState(true);

  const [chats,
    setChats] =
    useState([]);


  /* =====================================================
     LOAD LOCAL CHATS
  ===================================================== */

  useEffect(() => {

    const saved = [];

    for (
      let i = 0;
      i < localStorage.length;
      i++
    ) {

      const key =
        localStorage.key(i);

      if (
        key &&
        key.startsWith(
          "truvora-chat-"
        )
      ) {

        try {

          saved.push(
            JSON.parse(
              localStorage.getItem(
                key
              )
            )
          );

        } catch (error) {

          console.error(
            "Invalid saved chat:",
            error
          );

        }
      }
    }

    setChats(saved);

  }, []);


  const [currentChatId,
    setCurrentChatId] =
    useState(null);

  const [loading,
    setLoading] =
    useState(false);

  const [user,
    setUser] =
    useState(null);

  const [chatHistory,
    setChatHistory] =
    useState([]);

  const [searchTerm,
    setSearchTerm] =
    useState("");


  /* =====================================================
     DOCUMENT / IMAGE STATE
  ===================================================== */

  const [pdfText,
    setPdfText] =
    useState("");

  const [image,
    setImage] =
    useState(null);


  /* =====================================================
     GENERATION STATE
  ===================================================== */

  const [typingText,
    setTypingText] =
    useState("");

  const [stopGeneration,
    setStopGeneration] =
    useState(false);


  /* =====================================================
     VOICE / ANALYSIS STATE
  ===================================================== */

  const [voiceEnabled,
    setVoiceEnabled] =
    useState(true);

  const [showAnalyzeMenu,
    setShowAnalyzeMenu] =
    useState(false);


  /* =====================================================
     YOUTUBE
  ===================================================== */

  const [showYouTubeSearch,
    setShowYouTubeSearch] =
    useState(false);

  const [youtubeQuery,
    setYoutubeQuery] =
    useState("");


  /* =====================================================
     WEBSITE
  ===================================================== */

  const [showWebsiteSearch,
    setShowWebsiteSearch] =
    useState(false);

  const [websiteUrl,
    setWebsiteUrl] =
    useState("");


  /* =====================================================
     CAMERA
  ===================================================== */

  const [showCamera,
    setShowCamera] =
    useState(false);


  /* =====================================================
     LANGUAGE
  ===================================================== */

  const [selectedLanguage,
    setSelectedLanguage] =
    useState("English");

  const languageOptions =
    languageGroups;


  const getLanguageCode = () => {

    for (
      const group
      of languageOptions
    ) {

      const found =
        group.options.find(
          (lang) =>
            lang.label ===
            selectedLanguage
        );

      if (found) {
        return found.value;
      }
    }

    return "en";
  };


  /* =====================================================
     REFS
  ===================================================== */

  const videoRef =
    useRef(null);

  const canvasRef =
    useRef(null);

  const documentUploadRef =
    useRef(null);

  const imageUploadRef =
    useRef(null);

  const messagesEndRef =
    useRef(null);

  const audioRef =
    useRef(null);


  /* =====================================================
     VOICE RECOGNITION
  ===================================================== */

  const {
    transcript,
    resetTranscript,
    listening,
  } =
    useSpeechRecognition();


  useEffect(() => {

    setInput(
      transcript
    );

  }, [transcript]);


  useEffect(() => {

    if (
      transcript.trim()
    ) {

      console.log(
        "Voice detected:",
        transcript
      );

    }

  }, [transcript]);


  useEffect(() => {

    if (
      !listening &&
      transcript.trim()
    ) {

      handleSend(
        transcript
      );

      resetTranscript();

    }

  }, [listening]);


  /* =====================================================
     AUTO SCROLL
  ===================================================== */

  useEffect(() => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth",
      });

  }, [
    messages,
    loading
  ]);


  /* =====================================================
     FIREBASE AUTH
  ===================================================== */

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (
          currentUser
        ) => {

          if (currentUser) {

            setUser(
              currentUser
            );

            setLoggedIn(
              true
            );

            const userChats =
              await loadUserChats(
                currentUser.uid
              );

            setChats(
              userChats
            );

            setChatHistory(
              userChats.map(
                (chat) =>
                  chat.messages
              )
            );

          } else {

            setUser(null);

            setLoggedIn(
              false
            );

            setChats([]);

            setChatHistory([]);

          }

        }
      );

    return () =>
      unsubscribe();

  }, []);


  /* =====================================================
     CAMERA STREAM
  ===================================================== */

  useEffect(() => {

    if (!showCamera)
      return;

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      console.error(
        "Camera API not available"
      );

      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: true
      })
      .then(
        (stream) => {

          if (
            videoRef.current
          ) {

            videoRef.current.srcObject =
              stream;

          }

        }
      )
      .catch(
        (error) => {

          console.error(
            "Camera error:",
            error
          );

        }
      );

  }, [
    showCamera
  ]);


  /* =====================================================
     GOOGLE LOGIN
  ===================================================== */

  const handleGoogleLogin =
    async () => {

      try {

        await signInWithPopup(
          auth,
          googleProvider
        );

        setLoggedIn(
          true
        );

        localStorage.setItem(
          "truvoraLoggedIn",
          "true"
        );

      } catch (error) {

        console.error(
          "GOOGLE LOGIN ERROR:",
          error
        );

        alert(
          "Google login failed: " +
          error.message
        );

      }

    };


  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout =
    async () => {

      try {

        await signOut(
          auth
        );

        localStorage.removeItem(
          "truvoraLoggedIn"
        );

        setLoggedIn(
          false
        );

        setUsername("");

        setPassword("");

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

      }

    };


  /* =====================================================
     SAVE CHAT TO CLOUD
  ===================================================== */

  const saveCurrentChat =
    async (
      updatedMessages
    ) => {

      if (!user)
        return;

      try {

        const savedChatId =
          await saveChatToCloud(
            user.uid,
            currentChatId,
            updatedMessages
          );

        if (
          savedChatId
        ) {

          setCurrentChatId(
            savedChatId
          );

        }

        const updatedChats =
          await loadUserChats(
            user.uid
          );

        setChats(
          updatedChats
        );

        setChatHistory(
          updatedChats.map(
            (chat) =>
              chat.messages
          )
        );

      } catch (error) {

        console.error(
          "Cloud chat save error:",
          error
        );

      }

    };


  /* =====================================================
     TEXT TO SPEECH
  ===================================================== */

  const speakText =
    async (text) => {

      try {

        if (
          !text ||
          !text.trim()
        ) {

          return;

        }


        /* Stop previous audio */

        if (
          audioRef.current
        ) {

          audioRef.current.pause();

          audioRef.current.currentTime =
            0;

          if (
            audioRef.current.src
          ) {

            URL.revokeObjectURL(
              audioRef.current.src
            );

          }

          audioRef.current =
            null;

        }


        /* Request TTS */

        const response =
  await fetch(
    "https://truvora-api-new.onrender.com/generate-speech",
    {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  text:
                    text.trim(),

                  voice:
                    selectedVoice,
                }),
            }
          );


        if (
          !response.ok
        ) {

          throw new Error(
            `TTS request failed: ${response.status}`
          );

        }


        const data =
          await response.json();


        if (
          !data.audioUrl
        ) {

          throw new Error(
            "No audio URL returned"
          );

        }


        /* Download complete audio */

        const audioResponse =
          await fetch(
            data.audioUrl
          );


        if (
          !audioResponse.ok
        ) {

          throw new Error(
            "Audio file download failed"
          );

        }


        const audioBlob =
          await audioResponse.blob();


        const audioUrl =
          URL.createObjectURL(
            audioBlob
          );


        const audio =
          new Audio(
            audioUrl
          );


        audioRef.current =
          audio;


        audio.onended =
          () => {

            URL.revokeObjectURL(
              audioUrl
            );

            if (
              audioRef.current ===
              audio
            ) {

              audioRef.current =
                null;

            }

          };


        audio.onerror =
          () => {

            console.error(
              "AUDIO PLAYBACK ERROR"
            );

            URL.revokeObjectURL(
              audioUrl
            );

            if (
              audioRef.current ===
              audio
            ) {

              audioRef.current =
                null;

            }

          };


        await audio.play();


      } catch (error) {

        console.error(
          "TTS Error:",
          error
        );

        alert(
          "Voice generation failed."
        );

      }

    };


  /* =====================================================
     CAMERA CAPTURE + ANALYSIS
  ===================================================== */

  const capturePhoto =
    async () => {

      const video =
        videoRef.current;

      const canvas =
        canvasRef.current;

      if (
        !video ||
        !canvas
      ) {

        return;

      }


      try {

        canvas.width =
          video.videoWidth;

        canvas.height =
          video.videoHeight;


        const ctx =
          canvas.getContext(
            "2d"
          );


        ctx.drawImage(
          video,
          0,
          0
        );


        const imageData =
          canvas.toDataURL(
            "image/jpeg",
            0.95
          );


        setImage(
          imageData
        );


        const userImageMessage = {
          role: "user",
          text:
            "?? Captured Image",
          content:
            imageData,
        };


        const response =
          await fetch(
            "https://truvora-api-new.onrender.com/analyze-image",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  image:
                    imageData,
                }),
            }
          );


        if (
          !response.ok
        ) {

          throw new Error(
            `Camera analysis failed: ${response.status}`
          );

        }


        const data =
          await response.json();


        let answer =
          data.answer ||
          "";


        /* PRODUCT PRICE RESULTS */

        if (
          data.type ===
            "product" &&
          Array.isArray(
            data.shoppingResults
          ) &&
          data.shoppingResults
            .length > 0
        ) {

          const results =
            data.shoppingResults;


          const numericPrices =
            results
              .map(
                (item) => {

                  if (
                    !item.price
                  )
                    return null;


                  const match =
                    String(
                      item.price
                    ).match(
                      /[\d,]+/
                    );


                  if (!match)
                    return null;


                  return Number(
                    match[0]
                      .replace(
                        /,/g,
                        ""
                      )
                  );

                }
              )
              .filter(
                (price) =>
                  Number.isFinite(
                    price
                  ) &&
                  price > 0
              );


          let priceRange =
            "";


          if (
            numericPrices.length >
            0
          ) {

            const minPrice =
              Math.min(
                ...numericPrices
              );

            const maxPrice =
              Math.max(
                ...numericPrices
              );


            priceRange =
              minPrice ===
              maxPrice

                ? `?${minPrice.toLocaleString(
                    "en-IN"
                  )}`

                : `?${minPrice.toLocaleString(
                    "en-IN"
                  )} – ?${maxPrice.toLocaleString(
                    "en-IN"
                  )}`;

          }


          const productName =
            data.product?.name ||
            data.productName ||
            "Product";


          const confidence =
            data.product?.confidence ||
            data.confidence ||
            "MEDIUM";


          const identification =
            data.product?.identification ||
            data.identification ||
            "";


          answer = `
?? What I found

${productName}

?? Identification

${identification}

?? Confidence

${confidence}

?? Current Market Price

${priceRange || "Price unavailable"}

?? Price Note

The exact model was not necessarily identified. The range below is based on matching products found in live shopping results.

?? Matching Products

${results
  .map(
    (
      item,
      index
    ) =>
      `${index + 1}. ${
        item.title ||
        "Product"
      }
?? ${
        item.price ||
        "Price unavailable"
      }
?? ${
        item.source ||
        "Seller unavailable"
      }`
  )
  .join(
    "\n\n"
  )}
          `.trim();

        }


        /* QUESTION RESULT */

        if (
          data.type ===
          "question"
        ) {

          answer =
            data.answer ||
            "Unable to determine the answer.";

        }


        /* GENERAL IMAGE */

        if (
          data.type !==
            "product" &&
          data.type !==
            "question" &&
          !answer
        ) {

          answer =
            data.identification ||
            data.answer ||
            "Image analyzed successfully.";

        }


        setMessages(
          (prev) => [
            ...prev,

            userImageMessage,

            {
              role:
                "assistant",

              text:
                answer,
            },

          ]
        );


        setShowCamera(
          false
        );


      } catch (error) {

        console.error(
          "CAMERA ERROR:",
          error
        );

        alert(
          "Camera analysis failed. Please try again."
        );

      }

    };


  /* =====================================================
     PDF / DOCUMENT ANALYSIS
  ===================================================== */

  const handlePdfUpload =
    async (file) => {

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );


      try {

        const response =
          await fetch(
            "https://truvora-api-new.onrender.com/analyze-document",
            {
              method: "POST",
              body: formData,
            }
          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {

          throw new Error(
            data.error ||
            "Document analysis failed"
          );

        }


        setPdfText(
          data.documentText ||
          data.analysis ||
          ""
        );


        setMessages(
          (prev) => [

            ...prev,

            {
              role: "user",
              text:
                `?? Uploaded: ${file.name}`,
            },

            {
              role:
                "assistant",

              text:
                data.analysis ||
                "Document analyzed successfully.",
            },

          ]
        );


        setShowAnalyzeMenu(
          false
        );


      } catch (error) {

        console.error(
          "DOCUMENT UPLOAD ERROR:",
          error
        );

        alert(
          "Document upload failed."
        );

      }

    };


  /* =====================================================
     VIDEO UPLOAD
  ===================================================== */

  const handleVideoUpload =
    async (file) => {

      const formData =
        new FormData();

      formData.append(
        "video",
        file
      );


      const lowerMessage =
        input.toLowerCase();


      if (
        lowerMessage.includes(
          "pdf"
        )
      ) {

        formData.append(
          "type",
          "pdf"
        );

      } else if (
        lowerMessage.includes(
          "word"
        ) ||
        lowerMessage.includes(
          "doc"
        )
      ) {

        formData.append(
          "type",
          "docx"
        );

      } else if (
        lowerMessage.includes(
          "excel"
        ) ||
        lowerMessage.includes(
          "xlsx"
        )
      ) {

        formData.append(
          "type",
          "xlsx"
        );

      } else if (
        lowerMessage.includes(
          "powerpoint"
        ) ||
        lowerMessage.includes(
          "ppt"
        )
      ) {

        formData.append(
          "type",
          "pptx"
        );

      }


      try {

        const response =
          await fetch(
            "https://truvora-api-new.onrender.com/upload-video",
            {
              method: "POST",
              body: formData,
            }
          );


        const text =
          await response.text();


        const data =
          JSON.parse(
            text
          );


        setMessages(
          (prev) => [

            ...prev,

            {
              role:
                "assistant",

              text:
                data.summary,

              image:
                data.frameUrl ||
                null,

              document:
                data.document ||
                null,
            },

          ]
        );


        setShowAnalyzeMenu(
          false
        );


      } catch (error) {

        console.error(
          "VIDEO UPLOAD ERROR:",
          error
        );

        alert(
          "Video processing failed."
        );

      }

    };


  /* =====================================================
     YOUTUBE ANALYSIS
  ===================================================== */

  const handleYouTube =
    async (query) => {

      if (
        !query?.trim()
      )
        return;


      const trimmedQuery =
        query.trim();


      const urlMatch =
        trimmedQuery.match(
          /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{10,11})/
        );


      try {

        if (urlMatch) {

          const videoId =
            urlMatch[1];


          const youtubeUrl =
            `https://www.youtube.com/watch?v=${videoId}`;


          const response =
            await fetch(
              "https://truvora-api-new.onrender.com/analyze-youtube",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    url:
                      youtubeUrl,
                  }),
              }
            );


          const data =
            await response.json();


          if (
            !data.success
          ) {

            alert(
              data.error ||
              "YouTube analysis failed."
            );

            return;

          }


          setMessages(
            (prev) => [

              ...prev,

              {
                role:
                  "assistant",

                text:
                  data.analysis ||
                  "No analysis returned.",
              },

            ]
          );


          setShowYouTubeSearch(
            false
          );

          setYoutubeQuery(
            ""
          );


          return;

        }

      } catch (error) {

        console.error(
          "YOUTUBE ERROR:",
          error
        );

        alert(
          "Unable to process YouTube."
        );

      }

    };


  /* =====================================================
     WEBSITE ANALYSIS
  ===================================================== */

  const handleWebsite =
    async (url) => {

      if (
        !url?.trim()
      )
        return;


      const websiteUrlValue =
        url.trim();


      try {

        const response =
          await fetch(
            "https://truvora-api-new.onrender.com/analyze-website",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  url:
                    websiteUrlValue,
                }),
            }
          );


        const data =
          await response.json();


        if (
          !data.success
        ) {

          alert(
            data.error ||
            "Website analysis failed."
          );

          return;

        }


        setMessages(
          (prev) => [

            ...prev,

            {
              role:
                "user",

              text:
                `?? Website: ${websiteUrlValue}`,
            },

            {
              role:
                "assistant",

              text:
                data.analysis ||
                "No analysis returned.",
            },

          ]
        );


        setShowWebsiteSearch(
          false
        );

        setWebsiteUrl(
          ""
        );


      } catch (error) {

        console.error(
          "WEBSITE ERROR:",
          error
        );

        alert(
          "Unable to process website."
        );

      }

    };


  /* =====================================================
     AUDIO UPLOAD
  ===================================================== */

  const handleAudioUpload =
    async (file) => {

      try {

        const formData =
          new FormData();

        formData.append(
          "audio",
          file
        );


        const response =
          await fetch(
            "https://truvora-api-new.onrender.com/upload-audio",
            {
              method: "POST",
              body: formData,
            }
          );


        const text =
          await response.text();


        const data =
          JSON.parse(
            text
          );


        setMessages(
          (prev) => [

            ...prev,

            {
              role:
                "assistant",

              text:
                data.summary,

              document:
                data.document ||
                null,
            },

          ]
        );


        setShowAnalyzeMenu(
          false
        );


      } catch (error) {

        console.error(
          "AUDIO UPLOAD ERROR:",
          error
        );

        alert(
          "Audio processing failed."
        );

      }

    };


  /* =====================================================
     FILE DROPZONE
  ===================================================== */

  const {
    getRootProps,
    getInputProps,
  } =
    useDropzone({

      accept: {

        "application/pdf":
          [".pdf"],

        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [".docx"],

        "application/msword":
          [".doc"],

        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
          [".xlsx"],

        "application/vnd.ms-excel":
          [".xls"],

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


          try {

            if (

              file.type ===
                "application/pdf" ||

              file.name.endsWith(
                ".docx"
              ) ||

              file.name.endsWith(
                ".xlsx"
              ) ||

              file.name.endsWith(
                ".doc"
              ) ||

              file.name.endsWith(
                ".xls"
              )

            ) {

              const formData =
                new FormData();


              formData.append(
                "file",
                file
              );


              const response =
                await fetch(
                  "https://truvora-api-new.onrender.com/analyze-document",
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
                data.analysis
              ) {

                setPdfText(
                  data.documentText
                );


                setMessages(
                  (prev) => [

                    ...prev,

                    {
                      role:
                        "user",

                      text:
                        `?? Uploaded: ${file.name}`,
                    },

                    {
                      role:
                        "assistant",

                      text:
                        data.analysis,
                    },

                  ]
                );

              }


              return;

            }


            /* IMAGE UPLOAD */

            const imageFormData =
              new FormData();


            imageFormData.append(
              "image",
              file
            );


            const imageResponse =
              await fetch(
                "https://truvora-api-new.onrender.com/upload-image",
                {
                  method:
                    "POST",

                  body:
                    imageFormData,
                }
              );


            const imageData =
              await imageResponse.json();


            const uploadedImageUrl =
              imageData.imageUrl;


            if (
              !uploadedImageUrl
            ) {

              throw new Error(
                "Image URL was not returned by server"
              );

            }


            setImage(
              uploadedImageUrl
            );


            await handleSend(
              input?.trim() ||
              "Analyze this image in detail.",
              uploadedImageUrl
            );


          } catch (error) {

            console.error(
              "UPLOAD ERROR:",
              error
            );

            alert(
              "Upload failed"
            );

          }

        },

    });


  /* =====================================================
     LOGIN
  ===================================================== */

  const handleLogin =
    async () => {

      try {

        const response =
          await fetch(
            "https://truvora-api-new.onrender.com/api/login",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  username,
                  password,
                }),
            }
          );


        const data =
          await response.json();


        if (
          response.ok
        ) {

          setLoggedIn(
            true
          );

          localStorage.setItem(
            "truvoraLoggedIn",
            "true"
          );

          setLoginError(
            ""
          );

        } else {

          setLoginError(
            data.message
          );

        }

      } catch (error) {

        setLoginError(
          "Network error"
        );

      }

    };


  /* =====================================================
     MAIN SEND FUNCTION
  ===================================================== */

  const handleSend =
    async (
      voiceText = null,
      imageUrlOverride = null
    ) => {

      const finalPrompt =
        typeof voiceText ===
        "string"

          ? voiceText

          : input;


      const conversationImageUrl =
        imageUrlOverride ||
        image ||
        [...messages]
          .reverse()
          .find(
            (msg) =>
              msg.image
          )?.image ||
        null;


      if (

        !finalPrompt?.trim() &&

        !pdfText &&

        !image &&

        !imageUrlOverride

      ) {

        return;

      }


      setStopGeneration(
        false
      );


      const userMessage = {

        role:
          "user",

        text:
          conversationImageUrl

            ? `??? Image Uploaded\n\n${finalPrompt}`

            : pdfText

              ? `?? PDF Uploaded\n\n${finalPrompt}`

              : finalPrompt,

        image:
          conversationImageUrl ||
          null,

      };


      const updatedMessages = [

        ...messages,

        userMessage,

      ];


      setMessages(
        updatedMessages
      );

      setInput("");

      setLoading(
        true
      );


      /* =================================================
         DOCUMENT REQUEST DETECTION
      ================================================= */

      const promptLower =
        finalPrompt.toLowerCase();


      let requestedDocumentType =
        null;


      if (

        /\b(xlsx|excel|xl\s*sheet|spreadsheet)\b/
          .test(promptLower) &&

        /\b(create|make|generate|prepare|export|download|build)\b/
          .test(promptLower)

      ) {

        requestedDocumentType =
          "xlsx";

      }


      console.log(
        "REQUESTED DOCUMENT TYPE:",
        requestedDocumentType
      );


      try {

        const response =
          await fetch(
            "https://truvora-api-new.onrender.com/ask",
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

                  history:
                    updatedMessages,

                  language:
                    getLanguageCode(),

                  /*
                   * IMPORTANT:
                   *
                   * Web and Agent are now
                   * automatically available.
                   *
                   * The backend decides
                   * whether they are actually
                   * required.
                   */

                  web:
                    true,

                  agentMode:
                    true,

                  imageUrl:
                    conversationImageUrl,

                  imageUrls: [

                    imageUrlOverride ||
                      image,

                    ...updatedMessages
                      .filter(
                        (msg) =>
                          msg.image
                      )
                      .map(
                        (msg) =>
                          msg.image
                      )
                      .filter(
                        Boolean
                      ),

                  ],

                }),

            }
          );


        const data =
          await response.json();


        console.log(
          "SERVER RESPONSE:",
          data
        );


        console.log(
          "SOURCES:",
          data.sources
        );


        let currentText =
          "";


        /* =================================================
           STREAM / TYPE EFFECT
        ================================================= */

        for (
          const char
          of data.reply || ""
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


        const finalMessages = [

          ...updatedMessages,

          {

            role:
              "assistant",

            text:
              currentText,

            image:
              data.image ||
              (
                data.type ===
                "image"

                  ? data.document

                  : null
              ),

            document:
              data.document ||
              null,

            sources:
              data.sources ||
              [],

          },

        ];


        setMessages(
          finalMessages
        );


        await saveCurrentChat(
          finalMessages
        );


        setTypingText("");


      } catch (error) {

        console.error(
          "SEND ERROR:",
          error
        );

        alert(
          "Server error"
        );

      }


      setLoading(
        false
      );

    };


  /* =====================================================
   DOCUMENT GENERATION
===================================================== */

const handleGenerateDocument =
  async (
    type,
    text
  ) => {

    const lastMessage =
      [...messages]
        .reverse()
        .find(
          (msg) =>
            msg.role ===
            "assistant"
        );


    const summary = (

      text ||

      lastMessage?.text ||

      lastMessage?.summary ||

      lastMessage?.content ||

      ""

    )

      .replace(
        /^?\s*Quick Answer\s*/i,
        ""
      )

      .replace(
        /^?\s*Quick Answer\s*/i,
        ""
      )

      .trim();


    try {

      const recommendations = `
• Verify important information using official sources.

• Review AI-generated content before making important decisions.

• Cross-check facts from multiple trusted sources.

• Continue monitoring this topic because information may change.
      `;


      const sources = [

        "https://news.google.com",

        "https://www.reuters.com",

        "https://apnews.com",

      ];


      const response =
        await fetch(
          "https://truvora-api-new.onrender.com/generate-document",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                type,
                summary,
                analysis: summary,
                recommendations,
                sources,
              }),
          }
        );


      const data =
        await response.json();


      if (
        !data.success
      ) {

        alert(
          "Document generation failed."
        );

        return;

      }


      /* =================================================
         DIRECT FILE DOWNLOAD
      ================================================= */

      const url =
  data.document;

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        data.document
          .split("/")
          .pop();

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );


    } catch (error) {

      console.error(
        "DOCUMENT GENERATION ERROR:",
        error
      );

      alert(
        "Server error"
      );

    }

  };


  /* =====================================================
     LOGIN SCREEN
  ===================================================== */

  if (!loggedIn) {

    return (

      <div
        style={{

          minHeight:
            "100vh",

          display:
            "flex",

          justifyContent:
            "center",

          alignItems:
            "center",

          flexDirection:
            "column",

          background:
            "#050b1f",

          color:
            "#fff",

        }}
      >

        <h1>
          TRUVORA GLOBAL AI
        </h1>


        <p
          style={{
            marginBottom:
              "25px",
          }}
        >
          Sign in to continue
        </p>


        <button
          onClick={
            handleGoogleLogin
          }
          style={{

            padding:
              "12px 25px",

            fontSize:
              "16px",

            cursor:
              "pointer",

            borderRadius:
              "8px",

            border:
              "none",

          }}
        >

          ?? Continue with Google

        </button>

      </div>

    );

  }


  /* =====================================================
     MAIN APPLICATION UI
  ===================================================== */

  return (

    <>

      {/* ================================================
          ANALYZE MENU
      ================================================= */}

      {showAnalyzeMenu && (

        <div
          className="analyze-overlay"
        >

          <div
            className="analyze-menu"
          >

            <h2>
              ?? Analyze Anything
            </h2>


            <button
              type="button"
              onClick={() =>
                documentUploadRef.current?.click()
              }
            >
              ?? Document
            </button>


            <button
              type="button"
              onClick={() =>
                imageUploadRef.current?.click()
              }
            >
              ?? Image
            </button>


            <button
              onClick={() => {

                setShowAnalyzeMenu(
                  false
                );

                setShowCamera(
                  true
                );

              }}
            >
              ?? Live Camera
            </button>


            <button
              onClick={() =>
                document
                  .getElementById(
                    "videoUpload"
                  )
                  ?.click()
              }
            >
              ?? Video
            </button>


            <button
              onClick={() =>
                document
                  .getElementById(
                    "audioUpload"
                  )
                  ?.click()
              }
            >
              ?? Audio
            </button>


            <button
              onClick={() => {

                setShowAnalyzeMenu(
                  false
                );

                setShowYouTubeSearch(
                  true
                );

              }}
            >
              ?? YouTube
            </button>


            <button
              onClick={() => {

                setShowAnalyzeMenu(
                  false
                );

                setShowWebsiteSearch(
                  true
                );

              }}
            >
              ?? Website
            </button>


            <button
              onClick={() =>
                setShowAnalyzeMenu(
                  false
                )
              }
            >
              ? Cancel
            </button>


            {/* DOCUMENT INPUT */}

            <input
              ref={
                documentUploadRef
              }

              id="documentUpload"

              type="file"

              accept=".pdf,.doc,.docx,.xls,.xlsx"

              style={{
                display:
                  "none",
              }}

              onChange={
                async (e) => {

                  const file =
                    e.target.files?.[0];

                  if (!file)
                    return;


                  try {

                    await handlePdfUpload(
                      file
                    );

                    setShowAnalyzeMenu(
                      false
                    );

                  } catch (error) {

                    console.error(
                      "DOCUMENT UPLOAD ERROR:",
                      error
                    );

                    alert(
                      "Document upload failed."
                    );

                  }


                  e.target.value =
                    "";

                }
              }

            />


            {/* VIDEO INPUT */}

            <input
              id="videoUpload"

              type="file"

              accept="video/*"

              style={{
                display:
                  "none",
              }}

              onChange={
                (e) => {

                  if (
                    e.target.files?.[0]
                  ) {

                    handleVideoUpload(
                      e.target.files[0]
                    );

                  }

                }
              }

            />


            {/* IMAGE INPUT */}

            <input
              ref={
                imageUploadRef
              }

              id="imageUpload"

              type="file"

              accept="image/*"

              style={{
                display:
                  "none",
              }}

              onChange={
                async (e) => {

                  const file =
                    e.target.files?.[0];

                  if (!file)
                    return;


                  try {

                    const formData =
                      new FormData();

                    formData.append(
                      "image",
                      file
                    );


                    const response =
                      await fetch(
                        "https://truvora-api-new.onrender.com/upload-image",
                        {
                          method:
                            "POST",

                          body:
                            formData,
                        }
                      );


                    if (
                      !response.ok
                    ) {

                      throw new Error(
                        `Image upload failed: ${response.status}`
                      );

                    }


                    const data =
                      await response.json();


                    setImage(
                      data.imageUrl
                    );


                    setMessages(
                      (prev) => [

                        ...prev,

                        {

                          role:
                            "user",

                          text:
                            `??? Image Uploaded: ${file.name}`,

                          image:
                            data.imageUrl,

                        },

                      ]
                    );


                    setShowAnalyzeMenu(
                      false
                    );


                    await handleSend(

                      "Analyze this image in detail. Describe what you see, identify important objects, read visible text, and give me a clear summary.",

                      data.imageUrl

                    );


                  } catch (error) {

                    console.error(
                      "IMAGE UPLOAD ERROR:",
                      error
                    );

                    alert(
                      "Image upload failed."
                    );

                  }


                  e.target.value =
                    "";

                }
              }

            />


            {/* AUDIO INPUT */}

            <input
              id="audioUpload"

              type="file"

              accept="audio/*"

              style={{
                display:
                  "none",
              }}

              onChange={
                (e) => {

                  if (
                    e.target.files?.[0]
                  ) {

                    handleAudioUpload(
                      e.target.files[0]
                    );

                  }

                }
              }

            />

          </div>

        </div>

      )}


      {/* ================================================
          YOUTUBE SEARCH
      ================================================= */}

      {showYouTubeSearch && (

        <div
          className="analyze-overlay"
        >

          <div
            className="analyze-menu"
          >

            <h2>
              ?? YouTube
            </h2>


            <p
              style={{
                color:
                  "#ccc",

                textAlign:
                  "center",

                marginBottom:
                  "15px",

                fontSize:
                  "14px",
              }}
            >
              Search YouTube or paste a YouTube video URL
            </p>


            <input
              type="text"

              placeholder="?? Search YouTube videos..."

              value={
                youtubeQuery
              }

              onChange={
                (e) => {

                  const value =
                    e.target.value;

                  setYoutubeQuery(
                    value
                  );

                }
              }

            />


            <button
              onClick={
                async () => {

                  const value =
                    youtubeQuery.trim();


                  if (!value)
                    return;


                  if (

                    value.includes(
                      "youtube.com/watch"
                    ) ||

                    value.includes(
                      "youtu.be/"
                    )

                  ) {

                    await handleYouTube(
                      value
                    );

                    return;

                  }


                  window.open(

                    `https://www.youtube.com/results?search_query=${encodeURIComponent(
                      value
                    )}`,

                    "_blank"

                  );

                }
              }
            >
              ?? Search YouTube
            </button>


            {youtubeQuery.trim() && (

              <div
                style={{

                  marginTop:
                    "20px",

                  padding:
                    "15px",

                  background:
                    "#1a1a1a",

                  borderRadius:
                    "10px",

                  color:
                    "#fff",

                }}
              >

                <h3>
                  ?? Search Preview
                </h3>


                <p>

                  Search YouTube for:

                  <br />

                  <strong>
                    {youtubeQuery}
                  </strong>

                </p>


                <button
                  onClick={() =>
                    window.open(

                      `https://www.youtube.com/results?search_query=${encodeURIComponent(
                        youtubeQuery
                      )}`,

                      "_blank"

                    )
                  }
                >
                  ? Open YouTube
                </button>

              </div>

            )}


            <button
              onClick={() =>
                setShowYouTubeSearch(
                  false
                )
              }
            >
              ? Cancel
            </button>

          </div>

        </div>

      )}


      {/* ================================================
          WEBSITE SEARCH
      ================================================= */}

      {showWebsiteSearch && (

        <div
          className="analyze-overlay"
        >

          <div
            className="analyze-menu"
          >

            <h2>
              ?? Website
            </h2>


            <p
              style={{
                color:
                  "#ccc",

                textAlign:
                  "center",

                marginBottom:
                  "15px",

                fontSize:
                  "14px",
              }}
            >
              Enter a website URL to analyze
            </p>


            <input
              type="text"

              value={
                websiteUrl
              }

              onChange={
                (e) =>
                  setWebsiteUrl(
                    e.target.value
                  )
              }

              placeholder="https://example.com"

              style={{

                width:
                  "100%",

                padding:
                  "12px",

                marginBottom:
                  "12px",

                borderRadius:
                  "8px",

                border:
                  "1px solid #555",

                background:
                  "#111827",

                color:
                  "#fff",

                boxSizing:
                  "border-box",

              }}

            />


            <button
              onClick={() =>
                handleWebsite(
                  websiteUrl
                )
              }
            >
              ?? Analyze Website
            </button>


            <button
              onClick={() => {

                setShowWebsiteSearch(
                  false
                );

                setWebsiteUrl(
                  ""
                );

              }}
            >
              ? Cancel
            </button>

          </div>

        </div>

      )}


      {/* ================================================
          MAIN APP
      ================================================= */}

      <div
        className="app"
      >


        {/* ==============================================
            SIDEBAR
        =============================================== */}

        <div
          className={`sidebar ${
            sidebarOpen
              ? "sidebar-open"
              : "sidebar-closed"
          }`}
        >

          <div
            className="logo"
          >

            <div
              className="logo-icon"
            >
            </div>


            <div
              className="logo-text"
            >

              <h2>
                TRUVORA
              </h2>

              <p>
                GLOBAL AI
              </p>

            </div>

          </div>


          {/* NEW CHAT */}

          <button
            className="new-chat"

            onClick={() => {

              setSidebarOpen(
                false
              );


              if (
                audioRef.current
              ) {

                audioRef.current.pause();

                audioRef.current.currentTime =
                  0;

                audioRef.current =
                  null;

              }


              setMessages([]);

              setInput("");

              setPdfText("");

              setImage(null);

              setCurrentChatId(
                null
              );

            }}
          >

            <FiPlus />

            New Chat

          </button>


          {/* SEARCH */}

          <input
            type="text"

            placeholder="Search chats..."

            value={
              searchTerm
            }

            onChange={
              (e) =>
                setSearchTerm(
                  e.target.value
                )
            }

          />


          <p
            className="chat-title"
          >
            CLOUD CHATS
          </p>


          <div
            className="chat-list"
          >

            {chats &&

              chats

                .filter(
                  (chat) =>

                    Array.isArray(
                      chat.messages
                    ) &&

                    chat.messages.some(
                      (msg) =>

                        msg.text
                          ?.toLowerCase()
                          .includes(
                            searchTerm.toLowerCase()
                          )

                    )

                )

                .map(
                  (
                    chat,
                    index
                  ) => (

                    <div

                      key={
                        index
                      }

                      className="chat-item"

                      onClick={() => {

                        const restoredMessages =
                          Array.isArray(
                            chat.messages
                          )

                            ? chat.messages

                            : [];


                        setMessages(
                          restoredMessages
                        );


                        const restoredImage =
                          [
                            ...restoredMessages,
                          ]

                            .reverse()

                            .find(
                              (msg) =>
                                msg.image
                            )
                            ?.image ||
                          null;


                        setImage(
                          restoredImage
                        );


                        localStorage.setItem(
                          "current-chat",
                          JSON.stringify(
                            chat
                          )
                        );


                        setSidebarOpen(
                          false
                        );

                      }}

                    >

                      {
                        chat
                          .messages?.[0]
                          ?.text
                          ?.slice(
                            0,
                            25
                          )
                      }

                    </div>

                  )
                )

            }

          </div>

        </div>


        {/* ==============================================
            MAIN CONTENT
        =============================================== */}

        <div
          className="main"
        >


          {/* CAMERA */}

          {showCamera && (

            <div
              className="camera-box"
            >

              <video

                ref={
                  videoRef
                }

                autoPlay

                playsInline

                width="100%"

                style={{

                  borderRadius:
                    "15px",

                  maxHeight:
                    "400px",

                }}

              />


              <canvas

                ref={
                  canvasRef
                }

                style={{
                  display:
                    "none",
                }}

              />


              <button

                onClick={
                  capturePhoto
                }

                style={{

                  marginTop:
                    "15px",

                  padding:
                    "10px 20px",

                  borderRadius:
                    "10px",

                  cursor:
                    "pointer",

                }}

              >

                ?? Capture

              </button>

            </div>

          )}


          {/* ============================================
              TOP BAR
          ============================================= */}

          <div
            className="topbar"
          >

            <div

              className="menu-btn"

              onClick={() =>
                setSidebarOpen(
                  !sidebarOpen
                )
              }

            >

              <FiMenu />

            </div>


            <div
              className="top-title"
            >
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
                  handleLogout
                }

              >
                Logout
              </div>

            )}

          </div>


          {/* ============================================
              MESSAGES
          ============================================= */}

          <div
            className="messages"
          >

            {messages.map(
              (
                msg,
                index
              ) => (

                <div

                  key={
                    index
                  }

                  className={`message ${
                    msg.role ===
                    "user"
                      ? "user-message"
                      : ""
                  }`}

                >

                  <div
                    className="avatar"
                  >

                    {
                      msg.role ===
                      "user"

                        ? <FiUser />

                        : "T"
                    }

                  </div>


                  <div
                    className="bubble"
                  >

                    <ReactMarkdown
                      remarkPlugins={[
                        remarkGfm
                      ]}

                      components={{

                        a: ({
                          href,
                          children
                        }) => (

                          <a

                            href={
                              href
                            }

                            target="_blank"

                            rel="noopener noreferrer"

                            style={{
                              color:
                                "#4da6ff",

                              textDecoration:
                                "underline",
                            }}

                          >

                            {
                              children
                            }

                          </a>

                        ),

                      }}

                    >

                      {
                        msg.text ??
                        ""
                      }

                    </ReactMarkdown>


                    {/* IMAGE / GENERATED CONTENT */}

                    {(msg.image ||
                      msg.content) && (

                      <div
                        style={{
                          marginTop:
                            "15px",
                        }}
                      >

                        <img

                          src={

                            msg.content

                              ? (

                                msg.content.startsWith(
                                  "data:"
                                )

                                  ? msg.content

                                  : msg.content.startsWith(
                                      "http"
                                    )

                                    ? msg.content

                                    : `https://truvora-api-new.onrender.com${msg.content}`

                              )

                              : (

                                msg.image.startsWith(
                                  "http"
                                )

                                  ? msg.image

                                  : `https://truvora-api-new.onrender.com${msg.image}`

                              )

                          }

                          alt="Generated"

                          style={{

                            width:
                              "100%",

                            maxWidth:
                              "420px",

                            borderRadius:
                              "16px",

                            display:
                              "block",

                            marginTop:
                              "10px",

                            objectFit:
                              "cover",

                          }}

                        />


                        {msg.image && (

                          <div
                            style={{
                              marginTop:
                                "10px",

                              textAlign:
                                "center",
                            }}
                          >

                            <button

                              className="copy-btn"

                              onClick={
                                async () => {

                                  try {

                                    const imageUrl =
                                      msg.image.startsWith(
                                        "http"
                                      )

                                        ? msg.image

                                        : `https://truvora-api-new.onrender.com${msg.image}`;


                                    const response =
                                      await fetch(
                                        imageUrl
                                      );


                                    const blob =
                                      await response.blob();


                                    const url =
                                      window.URL.createObjectURL(
                                        blob
                                      );


                                    const a =
                                      document.createElement(
                                        "a"
                                      );


                                    a.href =
                                      url;

                                    a.download =
                                      "truvora-image.png";


                                    document.body.appendChild(
                                      a
                                    );


                                    a.click();


                                    a.remove();


                                    window.URL.revokeObjectURL(
                                      url
                                    );

                                  } catch (
                                    error
                                  ) {

                                    console.error(
                                      "Image download error:",
                                      error
                                    );

                                  }

                                }
                              }

                            >

                              ? Download Image

                            </button>

                          </div>

                        )}


                        {/* DOCUMENT BUTTONS */}

                        <div
                          style={{

                            marginTop:
                              "15px",

                            display:
                              "flex",

                            gap:
                              "10px",

                            flexWrap:
                              "wrap",

                          }}
                        >

                          <button

                            className="copy-btn"

                            onClick={() =>
                              handleGenerateDocument(
                                "pdf",
                                msg.text ||
                                msg.content ||
                                ""
                              )
                            }

                          >
                            ?? PDF
                          </button>


                          <button

                            className="copy-btn"

                            onClick={() =>
                              handleGenerateDocument(
                                "docx",
                                msg.text ||
                                msg.content ||
                                ""
                              )
                            }

                          >
                            ?? DOCX
                          </button>


                          <button

                            className="copy-btn"

                            onClick={() =>
                              handleGenerateDocument(
                                "xlsx",
                                msg.text ||
                                msg.content ||
                                ""
                              )
                            }

                          >
                            ?? XLSX
                          </button>


                          <button

                            className="copy-btn"

                            onClick={() =>
                              handleGenerateDocument(
                                "pptx",
                                msg.text ||
                                msg.content ||
                                ""
                              )
                            }

                          >
                            ?? PPTX
                          </button>


                          <button

                            className="copy-btn"

                            onClick={() =>
                              handleGenerateDocument(
                                "md",
                                msg.text ||
                                msg.content ||
                                ""
                              )
                            }

                          >
                            ?? MD
                          </button>

                        </div>


                        {/* GENERATED DOCUMENT LINK */}

                        {msg.document && (

                          <div
                            style={{
                              marginTop:
                                "10px",
                            }}
                          >

                            <a

                              href={`https://truvora-api-new.onrender.com${msg.document}`}

                              target="_blank"

                              rel="noopener noreferrer"

                              download

                              className="source-link"

                            >

                              ? Download Generated File

                            </a>

                          </div>

                        )}

                      </div>

                    )}


                    {/* ====================================
                        SOURCES / CITATIONS
                    ===================================== */}

                    {msg.sources &&
                      msg.sources.length >
                        0 && (

                      <div
                        style={{

                          marginTop:
                            "18px",

                          paddingTop:
                            "14px",

                          borderTop:
                            "1px solid rgba(148,163,184,0.10)",

                        }}
                      >

                        <div
                          style={{

                            display:
                              "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "space-between",

                            marginBottom:
                              "10px",

                          }}
                        >

                          <div
                            style={{

                              display:
                                "flex",

                              alignItems:
                                "center",

                              gap:
                                "8px",

                            }}
                          >

                            <div
                              style={{

                                width:
                                  "30px",

                                height:
                                  "30px",

                                borderRadius:
                                  "9px",

                                display:
                                  "flex",

                                alignItems:
                                  "center",

                                justifyContent:
                                  "center",

                                background:
                                  "linear-gradient(135deg,#0ea5e9,#2563eb)",

                                color:
                                  "#fff",

                                fontSize:
                                  "14px",

                                flexShrink:
                                  0,

                              }}
                            >
                              ??
                            </div>


                            <span
                              style={{

                                color:
                                  "#e2e8f0",

                                fontSize:
                                  "14px",

                                fontWeight:
                                  "650",

                              }}
                            >
                              Sources
                            </span>


                            <span
                              style={{

                                color:
                                  "#64748b",

                                fontSize:
                                  "12px",

                              }}
                            >
                              {
                                msg.sources
                                  .length
                              }
                            </span>

                          </div>


                          <span
                            style={{

                              color:
                                "#64748b",

                              fontSize:
                                "11px",

                            }}
                          >
                            Click a source
                          </span>

                        </div>


                        <div

                          className="truvora-source-feed"

                          style={{

                            display:
                              "flex",

                            flexDirection:
                              "column",

                            gap:
                              "7px",

                            maxHeight:
                              "330px",

                            overflowY:
                              "auto",

                            overflowX:
                              "hidden",

                            paddingRight:
                              "4px",

                            scrollBehavior:
                              "smooth",

                            WebkitOverflowScrolling:
                              "touch",

                            scrollbarWidth:
                              "thin",

                          }}

                        >

                          {msg.sources.map(
                            (
                              source,
                              sourceIndex
                            ) => {

                              const sourceUrl =
                                source.url ||
                                source.videoUrl ||
                                source.youtubeUrl;


                              if (
                                !sourceUrl
                              )
                                return null;


                              let domain =
                                source.source ||
                                "";


                              try {

                                if (
                                  !domain
                                ) {

                                  domain =
                                    new URL(
                                      sourceUrl
                                    )
                                      .hostname
                                      .replace(
                                        /^www\./,
                                        ""
                                      );

                                }

                              } catch {

                                domain =
                                  "web source";

                              }


                              const title =
                                source.title ||
                                source.name ||
                                domain ||
                                "Web Source";


                              return (

                                <a

                                  key={
                                    sourceIndex
                                  }

                                  href={
                                    sourceUrl
                                  }

                                  target="_blank"

                                  rel="noopener noreferrer"

                                  title={`Open ${title}`}

                                  style={{

                                    display:
                                      "flex",

                                    alignItems:
                                      "center",

                                    minHeight:
                                      "58px",

                                    width:
                                      "100%",

                                    boxSizing:
                                      "border-box",

                                    padding:
                                      "8px 10px",

                                    borderRadius:
                                      "12px",

                                    textDecoration:
                                      "none",

                                    background:
                                      "linear-gradient(90deg,rgba(15,23,42,0.94),rgba(18,35,58,0.76))",

                                    border:
                                      "1px solid rgba(56,189,248,0.16)",

                                    cursor:
                                      "pointer",

                                  }}

                                >

                                  <div

                                    style={{

                                      flex:
                                        "0 0 auto",

                                      width:
                                        "34px",

                                      height:
                                        "34px",

                                      borderRadius:
                                        "10px",

                                      display:
                                        "flex",

                                      alignItems:
                                        "center",

                                      justifyContent:
                                        "center",

                                      background:
                                        "linear-gradient(135deg,#0ea5e9,#2563eb)",

                                      color:
                                        "#fff",

                                      fontSize:
                                        "13px",

                                      fontWeight:
                                        "700",

                                    }}

                                  >

                                    {
                                      sourceIndex +
                                      1
                                    }

                                  </div>


                                  <div
                                    style={{

                                      flex:
                                        "1",

                                      minWidth:
                                        0,

                                      marginLeft:
                                        "11px",

                                      display:
                                        "flex",

                                      flexDirection:
                                        "column",

                                      justifyContent:
                                        "center",

                                      gap:
                                        "4px",

                                    }}
                                  >

                                    <div
                                      style={{

                                        color:
                                          "#e2e8f0",

                                        fontSize:
                                          "14px",

                                        fontWeight:
                                          "600",

                                        lineHeight:
                                          "1.3",

                                        overflow:
                                          "hidden",

                                        textOverflow:
                                          "ellipsis",

                                        whiteSpace:
                                          "nowrap",

                                      }}
                                    >

                                      {
                                        title
                                      }

                                    </div>


                                    <div
                                      style={{

                                        color:
                                          "#38bdf8",

                                        fontSize:
                                          "11px",

                                        overflow:
                                          "hidden",

                                        textOverflow:
                                          "ellipsis",

                                        whiteSpace:
                                          "nowrap",

                                      }}
                                    >

                                      {domain}

                                    </div>

                                  </div>


                                  <div
                                    style={{

                                      flex:
                                        "0 0 auto",

                                      width:
                                        "32px",

                                      height:
                                        "32px",

                                      borderRadius:
                                        "9px",

                                      display:
                                        "flex",

                                      alignItems:
                                        "center",

                                      justifyContent:
                                        "center",

                                      background:
                                        "rgba(14,165,233,0.08)",

                                      color:
                                        "#38bdf8",

                                      fontSize:
                                        "15px",

                                    }}
                                  >

                                    ?

                                  </div>

                                </a>

                              );

                            }
                          )}

                        </div>


                        {msg.sources.length >
                          5 && (

                          <div
                            style={{

                              marginTop:
                                "8px",

                              textAlign:
                                "center",

                              color:
                                "#64748b",

                              fontSize:
                                "10px",

                            }}
                          >

                            ? Scroll for more sources

                          </div>

                        )}

                      </div>

                    )}


                    {/* COPY */}

                    <CopyToClipboard
                      text={
                        msg.text
                      }
                    >

                      <button
                        className="copy-btn"
                      >

                        <FiCopy />

                      </button>

                    </CopyToClipboard>


                    {/* PDF */}

                    <button
                      className="copy-btn"

                      onClick={() =>
                        handleGenerateDocument(
                          "pdf",
                          msg.text ||
                          msg.content ||
                          ""
                        )
                      }
                    >
                      ?? PDF
                    </button>


                    {/* DOCX */}

                    <button
                      className="copy-btn"

                      onClick={() =>
                        handleGenerateDocument(
                          "docx",
                          msg.text ||
                          msg.content ||
                          ""
                        )
                      }
                    >
                      ?? DOCX
                    </button>


                    {/* XLSX */}

                    <button
                      className="copy-btn"

                      onClick={() =>
                        handleGenerateDocument(
                          "xlsx",
                          msg.text ||
                          msg.content ||
                          ""
                        )
                      }
                    >
                      ?? XLSX
                    </button>


                    {/* PPTX */}

                    <button
                      className="copy-btn"

                      onClick={() =>
                        handleGenerateDocument(
                          "pptx",
                          msg.text ||
                          msg.content ||
                          ""
                        )
                      }
                    >
                      ?? PPTX
                    </button>


                    {/* HTML */}

                    <button
                      className="copy-btn"

                      onClick={() =>
                        handleGenerateDocument(
                          "html",
                          msg.text ||
                          msg.content ||
                          ""
                        )
                      }
                    >
                      ?? HTML
                    </button>


                    {/* MARKDOWN */}

                    <button
                      className="copy-btn"

                      onClick={() =>
                        handleGenerateDocument(
                          "md",
                          msg.text ||
                          msg.content ||
                          ""
                        )
                      }
                    >
                      ?? MD
                    </button>


                    {/* TXT */}

                    <button
                      className="copy-btn"

                      onClick={() =>
                        handleGenerateDocument(
                          "txt",
                          msg.text ||
                          msg.content ||
                          ""
                        )
                      }
                    >
                      ?? TXT
                    </button>


                    {/* JSON */}

                    <button
                      className="copy-btn"

                      onClick={() =>
                        handleGenerateDocument(
                          "json",
                          msg.text ||
                          msg.content ||
                          ""
                        )
                      }
                    >
                      ?? JSON
                    </button>


                    {/* XML */}

                    <button
                      className="copy-btn"

                      onClick={() =>
                        handleGenerateDocument(
                          "xml",
                          msg.text ||
                          msg.content ||
                          ""
                        )
                      }
                    >
                      ?? XML
                    </button>


                    {/* RTF */}

                    <button
                      className="copy-btn"

                      onClick={() =>
                        handleGenerateDocument(
                          "rtf",
                          msg.text ||
                          msg.content ||
                          ""
                        )
                      }
                    >
                      ?? RTF
                    </button>


                    {/* READ ALOUD */}

                    <button
                      className="copy-btn"

                      onClick={() =>
                        speakText(
                          msg.text
                        )
                      }
                    >

                      <FiVolume2 />

                    </button>


                    {/* SHARE */}

                    <button
                      className="copy-btn"

                      onClick={async () => {

                        try {

                          if (
                            navigator.share
                          ) {

                            await navigator.share({
                              title:
                                "Truvora AI",

                              text:
                                msg.text ||
                                "",
                            });

                          } else {

                            await navigator.clipboard.writeText(
                              msg.text ||
                              ""
                            );

                          }

                        } catch (
                          error
                        ) {

                          console.error(
                            "Share error:",
                            error
                          );

                        }

                      }}

                    >
                      ??
                    </button>


                    {/* SAVE */}

                    <button

                      className="copy-btn"

                      onClick={() =>
                        saveChat(
                          messages
                        )
                      }

                    >
                      ??
                    </button>


                  </div>

                </div>

              )
            )}


            {/* TYPING */}

            {typingText && (

              <div
                className="message"
              >

                <div
                  className="avatar"
                >
                  T
                </div>


                <div
                  className="bubble"
                >
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


          {/* ============================================
              INPUT AREA
          ============================================= */}

          <div
            className="input-area"
          >

            <div
              className="input-box"
            >

              <div
                className="left-buttons"
              >

                {/* ANALYZE */}

                <div
                  {...getRootProps()}
                >

                  <input
                    {...getInputProps()}
                  />


                  <button

                    type="button"

                    className="icon-btn"

                    onClick={(e) => {

                      e.stopPropagation();

                      setShowAnalyzeMenu(
                        true
                      );

                    }}

                  >

                    ??

                  </button>

                </div>


                {/* MICROPHONE */}

                <button

                  className="icon-btn"

                  onClick={() => {

                    SpeechRecognition.startListening(
                      {
                        continuous:
                          false,

                        interimResults:
                          true,

                        language:
                          "en-IN",

                      }
                    );

                  }}

                >

                  <FiMic />

                </button>


                {/* VOICE ENABLE/DISABLE */}

                <button

                  className="icon-btn"

                  onClick={() =>
                    setVoiceEnabled(
                      !voiceEnabled
                    )
                  }

                >

                  {
                    voiceEnabled
                      ? "??"
                      : "??"
                  }

                </button>

              </div>


              {/* LANGUAGE */}

              <Select

                className="language-select"

                classNamePrefix="language"

                options={
                  languageOptions
                }

                value={

                  languageOptions
                    .flatMap(
                      (
                        group
                      ) =>
                        group.options
                    )
                    .find(
                      (
                        option
                      ) =>
                        option.label ===
                        selectedLanguage
                    ) ||
                    null

                }

                onChange={(
                  selectedOption
                ) => {

                  if (
                    selectedOption
                  ) {

                    setSelectedLanguage(
                      selectedOption.label
                    );

                  }

                }}

                placeholder="?? Select Language"

                isSearchable

                menuPlacement="auto"

              />


              {/* VOICE */}

              <Select

                className="voice-select"

                classNamePrefix="voice"

                options={
                  voiceOptions
                }

                value={

                  voiceOptions.find(
                    (
                      option
                    ) =>
                      option.id ===
                      selectedVoice
                  ) ||
                  null

                }

                getOptionLabel={
                  (option) =>
                    option.name
                }

                getOptionValue={
                  (option) =>
                    option.id
                }

                onChange={(
                  selectedOption
                ) => {

                  if (
                    !selectedOption
                  )
                    return;


                  if (
                    selectedOption.id ===
                    "personal"
                  ) {

                    setShowPersonalVoice(
                      true
                    );

                    return;

                  }


                  setSelectedVoice(
                    selectedOption.id
                  );

                }}

                placeholder="??? Select Voice"

                isSearchable={
                  false
                }

                menuPlacement="top"

              />


              {/* PERSONAL VOICE */}

              {showPersonalVoice && (

                <div
                  className="personal-voice-overlay"
                >

                  <div
                    className="personal-voice-modal"
                  >

                    <h2>
                      ??? Personal Voice
                    </h2>


                    <p>
                      Create your personal voice for Truvora.
                    </p>


                    <input

                      type="text"

                      placeholder="Enter voice name"

                      className="personal-voice-name"

                    />


                    <div
                      className="personal-voice-buttons"
                    >

                      <button

                        type="button"

                        onClick={async () => {

                          try {

                            const stream =
                              await navigator.mediaDevices.getUserMedia({
                                audio:
                                  true,
                              });


                            const recorder =
                              new MediaRecorder(
                                stream
                              );


                            const audioChunks =
                              [];


                            recorder.ondataavailable =
                              (
                                event
                              ) => {

                                if (
                                  event
                                    .data
                                    .size >
                                  0
                                ) {

                                  audioChunks.push(
                                    event.data
                                  );

                                }

                              };


                            recorder.onstop =
                              async () => {

                                const audioBlob =
                                  new Blob(
                                    audioChunks,
                                    {
                                      type:
                                        "audio/webm",
                                    }
                                  );


                                const formData =
                                  new FormData();


                                formData.append(
                                  "voice",
                                  audioBlob,
                                  "personal-voice.webm"
                                );


                                const response =
                                  await fetch(
                                    "https://truvora-api-new.onrender.com/upload-personal-voice",
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
                                  data.success
                                ) {

                                  setPersonalVoice(
                                    data.audioUrl
                                  );

                                  setSelectedVoice(
                                    "personal"
                                  );

                                  setShowPersonalVoice(
                                    false
                                  );

                                }

                              };


                            recorder.start();


                            setTimeout(
                              () => {

                                recorder.stop();

                                stream
                                  .getTracks()
                                  .forEach(
                                    (
                                      track
                                    ) =>
                                      track.stop()
                                  );

                              },

                              5000

                            );


                          } catch (
                            error
                          ) {

                            console.error(
                              "Microphone error:",
                              error
                            );

                            alert(
                              "Microphone permission is required."
                            );

                          }

                        }}

                      >

                        ??? Record Voice

                      </button>


                      <button

                        type="button"

                        onClick={() =>
                          setShowPersonalVoice(
                            false
                          )
                        }

                      >
                        Cancel
                      </button>

                    </div>

                  </div>

                </div>

              )}


              {/* MAIN INPUT */}

              <input

                type="text"

                className="main-input"

                placeholder="Ask Truvora anything..."

                value={
                  input
                }

                onChange={
                  (e) =>
                    setInput(
                      e.target.value
                    )
                }

                onKeyDown={
                  (e) => {

                    if (
                      e.key ===
                      "Enter"
                    ) {

                      e.preventDefault();

                      handleSend();

                    }

                  }
                }

              />


              {/* SEND */}

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

    </>

  );

}


export default App;
