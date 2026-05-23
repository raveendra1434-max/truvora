import { initializeApp } from "firebase/app";

import {
  getFirestore,
} from "firebase/firestore";

const firebaseConfig = {

  apiKey: "PASTE_YOUR_REAL_API_KEY",

  authDomain:
    "PASTE_YOUR_REAL_AUTH_DOMAIN",

  projectId:
    "PASTE_YOUR_REAL_PROJECT_ID",

  storageBucket:
    "PASTE_YOUR_REAL_STORAGE_BUCKET",

  messagingSenderId:
    "PASTE_YOUR_REAL_MESSAGING_SENDER_ID",

  appId:
    "PASTE_YOUR_REAL_APP_ID",

};

const app =
  initializeApp(firebaseConfig);

export const db =
  getFirestore(app);