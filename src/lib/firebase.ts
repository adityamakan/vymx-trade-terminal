import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut, onAuthStateChanged, type Auth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, Timestamp, type Firestore } from 'firebase/firestore';
import { resolveFirebaseClientConfig } from '../utils/firebaseConfig';

const firebaseConfig = resolveFirebaseClientConfig(import.meta.env);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (firebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error('Firebase initialization failed. Persistent authentication and cloud storage are unavailable.', error);
  }
} else {
  console.info(
    '[VYMX] Firebase client configuration is missing. Persistent authentication and cloud sync are disabled; Demo Access remains local-only.'
  );
}

export {
  app, auth, db, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, doc, setDoc, getDoc, updateDoc, collection, getDocs, Timestamp
};
