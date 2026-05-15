import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBRALVebpxVjnLxC2NBujlrKD6EYy4AXs8",
  authDomain: "finansmart-web.firebaseapp.com",
  projectId: "finansmart-web",
  storageBucket: "finansmart-web.firebasestorage.app",
  messagingSenderId: "380574630658",
  appId: "1:380574630658:web:e2c980154ba143fcbdf81b",
  measurementId: "G-W9LX3LVZ3J"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// ── Auth helpers ──────────────────────────────────────────────
export const loginGoogle = () => signInWithPopup(auth, googleProvider);
export const loginEmail  = (email, pass) => signInWithEmailAndPassword(auth, email, pass);
export const registerEmail = (email, pass) => createUserWithEmailAndPassword(auth, email, pass);
export const logout      = () => signOut(auth);
export const onAuth      = (cb) => onAuthStateChanged(auth, cb);

// ── Firestore helpers ─────────────────────────────────────────
export const saveUserData = (uid, data) =>
  setDoc(doc(db, "users", uid), data, { merge: true });

export const loadUserData = (uid) =>
  getDoc(doc(db, "users", uid)).then(d => d.exists() ? d.data() : null);

export const subscribeUserData = (uid, cb) =>
  onSnapshot(doc(db, "users", uid), snap => cb(snap.exists() ? snap.data() : null));
