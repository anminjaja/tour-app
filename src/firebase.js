import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCxMuz_dLoXTkPFIhIWFjMpakE8w6G1eGU",
  authDomain: "myproject-894cb.firebaseapp.com",
  projectId: "myproject-894cb",
  storageBucket: "myproject-894cb.firebasestorage.app",
  messagingSenderId: "931629057270",
  appId: "1:931629057270:web:a921999be0988a905818d7",
  databaseURL: "https://myproject-894cb-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);