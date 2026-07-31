import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Replace these with your actual Firebase web config values from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAHUd2ak8rlmVQNTCQ8K0s2bw0hl7DMvpk",
  authDomain: "smart-waste-app-c4308.firebaseapp.com",
  projectId: "smart-waste-app-c4308",
  storageBucket: "smart-waste-app-c4308.firebasestorage.app",
  messagingSenderId: "647424898453",
  appId: "1:647424898453:web:f8b978db936c664d3a729c",
  measurementId: "G-N70G8TGXNK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);