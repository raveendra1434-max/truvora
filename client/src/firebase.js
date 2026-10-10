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
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
where,
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
/* SEND DIRECT USER MESSAGE */

export const sendDirectMessage = async (
  senderId,
  receiverId,
  text
) => {
  try {
    if (!senderId || !receiverId || !text?.trim()) {
      return null;
    }

    const conversationId = [
      senderId,
      receiverId,
    ]
      .sort()
      .join("_");

    await setDoc(
      doc(
        db,
        "directChats",
        conversationId
      ),
      {
        participants: [
          senderId,
          receiverId,
        ],
        updatedAt:
          serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    const messageRef =
      await addDoc(
        collection(
          db,
          "directChats",
          conversationId,
          "messages"
        ),
        {
          senderId,
          text: text.trim(),
          createdAt:
            serverTimestamp(),
        }
      );

    console.log(
      "✅ DIRECT MESSAGE SENT:",
      messageRef.id
    );

    return {
      conversationId,
      messageId:
        messageRef.id,
    };

  } catch (error) {

    console.error(
      "❌ DIRECT MESSAGE ERROR:",
      error
    );

    return null;
  }
};
/* LISTEN FOR DIRECT MESSAGES */

export const listenToDirectMessages = (
  senderId,
  receiverId,
  callback
) => {
  if (
    !senderId ||
    !receiverId ||
    !callback
  ) {
    return () => {};
  }

  const conversationId = [
    senderId,
    receiverId,
  ]
    .sort()
    .join("_");

  const messagesRef =
    collection(
      db,
      "directChats",
      conversationId,
      "messages"
    );

  return onSnapshot(
    messagesRef,
    (snapshot) => {
      const messages =
        snapshot.docs.map(
          (messageDoc) => ({
            id: messageDoc.id,
            ...messageDoc.data(),
          })
        );

      messages.sort(
        (a, b) => {
          const aTime =
            a.createdAt?.toMillis?.() || 0;

          const bTime =
            b.createdAt?.toMillis?.() || 0;

          return aTime - bTime;
        }
      );

      callback(messages);
    },
    (error) => {
      console.error(
        "❌ DIRECT MESSAGE LISTENER ERROR:",
        error
      );
    }
  );
};

/* =====================================================
   RANDOM CHAT - FIND A WAITING USER
===================================================== */

export const findRandomChatUser = async (
  currentUserId
) => {

  try {

    if (!currentUserId) {
      return null;
    }

    const queueRef =
      collection(
        db,
        "randomChatQueue"
      );

    const snapshot =
      await getDocs(queueRef);

    for (
      const queueDoc of snapshot.docs
    ) {

      const data =
        queueDoc.data();

      if (
        data.userId &&
        data.userId !== currentUserId &&
        data.status === "waiting"
      ) {

        return {
          queueId:
            queueDoc.id,

          userId:
            data.userId,
        };

      }

    }

    return null;

  } catch (error) {

    console.error(
      "❌ RANDOM CHAT SEARCH ERROR:",
      error
    );

    return null;
  }
};
/* =====================================================
   RANDOM CHAT - JOIN QUEUE
===================================================== */

export const joinRandomChatQueue = async (
  userId
) => {

  try {

    if (!userId) {
      return false;
    }

    await setDoc(
      doc(
        db,
        "randomChatQueue",
        userId
      ),
      {
        userId,
        status: "waiting",
        joinedAt:
          serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    console.log(
      "✅ RANDOM CHAT QUEUE JOINED:",
      userId
    );

    return true;

  } catch (error) {

    console.error(
      "❌ RANDOM CHAT QUEUE ERROR:",
      error
    );

    return false;
  }
};
/* =====================================================
   RANDOM CHAT - LEAVE QUEUE
===================================================== */

export const leaveRandomChatQueue = async (
  userId
) => {

  try {

    if (!userId) {
      return false;
    }

    await setDoc(
      doc(
        db,
        "randomChatQueue",
        userId
      ),
      {
        status: "left",
      },
      {
        merge: true,
      }
    );

    console.log(
      "✅ RANDOM CHAT QUEUE LEFT:",
      userId
    );

    return true;

  } catch (error) {

    console.error(
      "❌ RANDOM CHAT LEAVE ERROR:",
      error
    );

    return false;
  }
};
/* =====================================================
   RANDOM CHAT - CREATE MATCH
===================================================== */

export const createRandomChatMatch = async (
  userId,
  partnerId
) => {

  try {

    if (
      !userId ||
      !partnerId ||
      userId === partnerId
    ) {
      return false;
    }

    const participants = [
      userId,
      partnerId,
    ].sort();

    const matchId =
      participants.join("_");

    await setDoc(
      doc(
        db,
        "randomChatMatches",
        matchId
      ),
      {
        participants,
        userA: participants[0],
        userB: participants[1],
        status: "active",
        createdAt:
          serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    console.log(
      "✅ RANDOM CHAT MATCH CREATED:",
      matchId
    );

    return true;

  } catch (error) {

    console.error(
      "❌ RANDOM CHAT MATCH ERROR:",
      error
    );

    return false;
  }
};
/* =====================================================
   USER PROFILE - CREATE / UPDATE
===================================================== */

export const saveUserProfile = async (
  user
) => {
  try {
    if (!user?.uid) {
      return false;
    }

    const displayName =
      user.displayName?.trim() ||
      user.email?.split("@")[0] ||
      "Trulexity User";

    const username =
      displayName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20) ||
      `user${user.uid.slice(0, 8)}`;

    await setDoc(
      doc(
        db,
        "users",
        user.uid
      ),
      {
        uid: user.uid,
        username,
        displayName,
        email: user.email || "",
        photoURL: user.photoURL || "",
        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    console.log(
      "✅ USER PROFILE SAVED:",
      username
    );

    return true;

  } catch (error) {

    console.error(
      "❌ USER PROFILE ERROR:",
      error
    );

    return false;
  }
};
/* =====================================================
   SEARCH USERS BY USERNAME / DISPLAY NAME
===================================================== */

export const searchUsers = async (
  searchTerm,
  currentUserId
) => {
  try {
    const term = searchTerm
      ?.trim()
      .toLowerCase();

    if (!term) {
      return [];
    }

    const usersRef = collection(
      db,
      "users"
    );

    const snapshot = await getDocs(
      usersRef
    );

    const users = snapshot.docs
      .map((userDoc) => ({
        id: userDoc.id,
        ...userDoc.data(),
      }))
      .filter((profile) => {
        if (
          !profile.uid ||
          profile.uid === currentUserId
        ) {
          return false;
        }

        const username =
          String(
            profile.username || ""
          ).toLowerCase();

        const displayName =
          String(
            profile.displayName || ""
          ).toLowerCase();

        return (
          username.includes(term) ||
          displayName.includes(term)
        );
      })
      .slice(0, 20);

    return users;

  } catch (error) {
    console.error(
      "❌ USER SEARCH ERROR:",
      error
    );

    return [];
  }
};