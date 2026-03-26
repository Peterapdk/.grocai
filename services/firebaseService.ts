
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, Auth } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  writeBatch, 
  Firestore,
  enableMultiTabIndexedDbPersistence,
  getDocs
} from "firebase/firestore";

const apiKey = process.env.API_KEY;
const projectId = process.env.FIREBASE_PROJECT_ID;

// Vi skal sikre os at vi har en valid konfiguration
const isConfigValid = !!projectId && !!apiKey && apiKey !== 'undefined' && projectId !== 'undefined';
let firebaseEnabled = isConfigValid;

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: `${projectId}.appspot.com`,
  messagingSenderId: "123456789", 
  appId: `1:123456789:web:${projectId}` 
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseEnabled) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);

    if (typeof window !== "undefined" && db) {
      enableMultiTabIndexedDbPersistence(db).catch((err) => {
        console.warn("Firestore persistence disabled:", err.code);
      });
    }
  } catch (e) {
    console.error("Firebase failed to initialize:", e);
    firebaseEnabled = false;
  }
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async () => {
  if (!auth) throw new Error("Cloud-synkronisering er ikke aktiveret. Tjek FIREBASE_PROJECT_ID i dine indstillinger.");
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.error("Login fejl:", error);
    if (error.code === 'auth/api-key-not-valid') {
      throw new Error("API-nøglen er ikke gyldig til dette projekt. Sørg for at den er aktiveret i Google Cloud Console.");
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Login-vinduet blev lukket før du blev logget ind.");
    }
    throw new Error(error.message || "Der skete en uventet fejl under login.");
  }
};

export const logOut = () => {
  if (!auth) return Promise.resolve();
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export { 
  firebaseEnabled,
  auth,
  db,
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  writeBatch,
  getDocs
};
