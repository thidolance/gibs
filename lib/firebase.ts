import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBagIEFc7I1fTAk8pja9qgJCzDxseigR_Q",
  authDomain: "gibs-51f02.firebaseapp.com",
  databaseURL: "https://gibs-51f02-default-rtdb.firebaseio.com",
  projectId: "gibs-51f02",
  storageBucket: "gibs-51f02.firebasestorage.app",
  messagingSenderId: "800712147824",
  appId: "1:800712147824:web:a8c75152f575c7bbc905b5",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getDatabase(app);
