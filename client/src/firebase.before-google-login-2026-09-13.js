import { initializeApp } from "firebase/app";

import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";

import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";


/* FIREBASE CONFIG */

const firebaseConfig = {
  apiKey: "AIzaSyDuqAZRS86CP-upVTglCUj8VSvXo9tm7tY",

  authDomain:
    "truvora-7d3c7.firebaseapp.com",

  projectId:
    "truvora-7d3c7",

  storageBucket:
    "truvora-7d3c7.firebasestorage.app",

  messagingSenderId:
    "241553183722",

  appId:
    "1:241553183722:web:8bf7e810d7778be2e61893",
};


/* INITIALIZE FIREBASE */

const app =
  initializeApp(firebaseConfig);


/* AUTH */

export const auth =
  getAuth(app);

export const googleProvider =
  new GoogleAuthProvider();


/* FIRESTORE */

const db =
  getFirestore(app);


/* SAVE / UPDATE CHAT */

export const saveChatToCloud = async (
  userId,
  chatId,
  chat
) => {

  try {

    if (!userId) {
      console.log("❌ No user ID");
      return null;
    }

    /*
      If this is a NEW conversation,
      create a permanent ID.

      If this is an existing conversation,
      reuse the same ID.
    */

    const finalChatId =
      chatId ||
      `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)}`;


    /*
      Make sure the user document exists.
    */

    await setDoc(
      doc(
        db,
        "users",
        userId
      ),
      {
        updatedAt:
          serverTimestamp(),
      },
      {
        merge: true,
      }
    );


    /*
      Save the conversation to ONE
      permanent Firestore document.
    */

    await setDoc(
      doc(
        db,
        "users",
        userId,
        "chats",
        finalChatId
      ),
      {
        messages: chat,

        /*
          First user message becomes
          the chat title.
        */

        title:
          chat?.find(
            (message) =>
              message.role === "user" &&
              message.text
          )?.text?.slice(0, 60) ||
          "New Chat",

        /*
          Only set createdAt when the
          document is first created.
        */

        ...(chatId
          ? {}
          : {
              createdAt:
                serverTimestamp(),
            }),

        /*
          Always update this when
          conversation changes.
        */

        updatedAt:
          serverTimestamp(),
      },
      {
        merge: true,
      }
    );


    console.log(
      "✅ CHAT SAVED:",
      finalChatId
    );


    return finalChatId;

  } catch (error) {

    console.error(
      "❌ FIREBASE SAVE ERROR:",
      error
    );

    return null;
  }
};


/* LOAD ALL USER CHATS */

export const loadUserChats = async (
  userId
) => {

  try {

    if (!userId) {
      return [];
    }

    const snapshot =
      await getDocs(
        collection(
          db,
          "users",
          userId,
          "chats"
        )
      );


    const chats =
      snapshot.docs.map(
        (chatDoc) => ({
          id: chatDoc.id,
          ...chatDoc.data(),
        })
      );


    /*
      Sort newest conversations first.

      We use updatedAt when available.
      Older documents may only have
      createdAt, so we safely fall back.
    */

    chats.sort(
      (a, b) => {

        const aTime =
          a.updatedAt?.toMillis?.() ||
          a.createdAt?.toMillis?.() ||
          0;

        const bTime =
          b.updatedAt?.toMillis?.() ||
          b.createdAt?.toMillis?.() ||
          0;

        return bTime - aTime;
      }
    );


    console.log(
      "✅ FIREBASE CHATS:",
      chats
    );


    return chats;

  } catch (error) {

    console.error(
      "❌ FIREBASE LOAD ERROR:",
      error
    );

    return [];
  }
};
