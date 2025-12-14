// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBrBBrmv9fIR7lZZ87hirdUAenPn9V_0eU",
  authDomain: "hr-alqadi.firebaseapp.com",
  databaseURL: "https://hr-alqadi-default-rtdb.firebaseio.com",
  projectId: "hr-alqadi",
  storageBucket: "hr-alqadi.firebasestorage.app",
  messagingSenderId: "851429750714",
  appId: "1:851429750714:web:3811d070dab24dca9dcf83",
  measurementId: "G-MGYSSDQ2QV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 👇 هذا هو المهم
export const db = getFirestore(app);
export const auth = getAuth(app);
