import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAxxXc3jnloPeoXhcmzYJLnsLG35hILcM0",
  authDomain: "lesson-planner-c9f34.firebaseapp.com",
  projectId: "lesson-planner-c9f34",
  storageBucket: "lesson-planner-c9f34.firebasestorage.app",
  messagingSenderId: "623536016854",
  appId: "1:623536016854:web:a9135382b960818dece877"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  return signInWithPopup(auth, provider);
};

export const logout = () => auth.signOut();
