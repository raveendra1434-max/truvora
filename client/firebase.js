import { initializeApp } from "firebase/app";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDuqAZRS86CP-upVTglCUj8VSvXo9tm7tY",
  authDomain: "truvora-7d3c7.firebaseapp.com",
  projectId: "truvora-7d3c7",
  storageBucket: "truvora-7d3c7.firebasestorage.app",
  messagingSenderId: "241553183722",
  appId: "1:241553183722:web:8bf7e810d7778be2e61893"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

export const googleProvider =
  new GoogleAuthProvider();

export const saveChatToCloud =
  async (uid, messages) => {
    try {

      await addDoc(
        collection(
          db,
          "users",
          uid,
          "chats"
        ),
        {
          title: "New Chat",
          messages,
          createdAt:
            serverTimestamp(),
          updatedAt:
            serverTimestamp(),
        }
      );

    } catch (error) {
      console.log(error);
    }
  };

export const loadUserChats =
  async (uid) => {

    try {

      const q = query(
        collection(
          db,
          "users",
          uid,
          "chats"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );

      const snapshot =
        await getDocs(q);

      return snapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
      );

    } catch (error) {

      console.log(error);

      return [];
    }
  };