// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  // apiKey: "AIzaSyDM8ZK5YJHe4vtj7kkSRhu-pGeMx9IjdaU",
  // authDomain: "shattak-prod.firebaseapp.com",
  // projectId: "shattak-prod",
  // storageBucket: "shattak-prod.firebasestorage.app",
  // messagingSenderId: "130414227088",
  // appId: "1:130414227088:web:fab8f1ed8b461d8fb13215",
  // measurementId: " G-H4N0ML8Q4K",
};

console.log(firebaseConfig);
export const app = initializeApp(firebaseConfig);
