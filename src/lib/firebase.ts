import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Important part from skill!
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
} catch (error) {
  console.error("Firebase initialization error", error);
}

export { app, auth, db, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, doc, setDoc, getDoc, updateDoc };
