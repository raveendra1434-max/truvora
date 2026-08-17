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

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

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