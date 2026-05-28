import { initializeApp } from "firebase/app";

import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
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
  initializeApp(
    firebaseConfig
  );



/* AUTH */

export const auth =
  getAuth(app);

export const googleProvider =
  new GoogleAuthProvider();



/* FIRESTORE */

const db =
  getFirestore(app);



/* SAVE CHAT */

export const saveChatToCloud =
  async (
    userId,
    chat
  ) => {

    try {

      await setDoc(
        doc(
          db,
          "users",
          userId,
          "chats",
          String(chat.id)
        ),
        chat
      );

    } catch (error) {

      console.log(error);
    }
  };



/* LOAD CHATS */

export const loadUserChats =
  async (
    userId
  ) => {

    try {

      const chatDoc =
        await getDoc(
          doc(
            db,
            "users",
            userId
          )
        );

      if (
        chatDoc.exists()
      ) {

        return (
          chatDoc.data()
            .chats || []
        );
      }

      return [];

    } catch (error) {

      console.log(error);

      return [];
    }
  };