// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDM8ZK5YJHe4vtj7kkSRhu-pGeMx9IjdaU",
  authDomain: "shattak-prod.firebaseapp.com",
  projectId: "shattak-prod",
  storageBucket: "shattak-prod.firebasestorage.app",
  messagingSenderId: "130414227088",
  appId: "1:130414227088:web:fab8f1ed8b461d8fb13215",
  measurementId: "G-H4N0ML8Q4K"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
