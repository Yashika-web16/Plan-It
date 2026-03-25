import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer
} from 'firebase/firestore';

// Import Firebase config (JSON)
import firebaseConfig from '../firebase-applet-config.json';

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Firestore
export const db = getFirestore(app);

// ✅ Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ✅ Auth helpers
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// ==============================
// 🔥 ERROR HANDLING (FIXES YOUR ERROR)
// ==============================

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
  };

  console.error('🔥 Firestore Error:', errInfo);
  throw new Error(JSON.stringify(errInfo));
}

// ==============================
// 🔌 CONNECTION TEST (OPTIONAL)
// ==============================

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('✅ Firebase connected successfully');
  } catch (error) {
    console.error('❌ Firebase connection issue:', error);
  }
}

testConnection();