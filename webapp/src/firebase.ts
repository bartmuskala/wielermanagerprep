// webapp/src/firebase.ts
import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "mock-api-key",
    authDomain: "wielermanager-ai.firebaseapp.com",
    projectId: "wielermanager-ai",
    storageBucket: "wielermanager-ai.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let googleProvider: GoogleAuthProvider | undefined;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
} catch (e) {
    console.warn("Firebase not properly configured yet. Using mock services.", e);
}

export const loginWithGoogle = async () => {
    if (firebaseConfig.apiKey === "mock-api-key" || !auth || !googleProvider) {
        return { user: { uid: "mock-user-123", displayName: "Simulated User", email: "test@example.com" } };
    }
    return signInWithPopup(auth, googleProvider);
};

export const logout = async () => {
    if (firebaseConfig.apiKey === "mock-api-key" || !auth) return;
    return signOut(auth);
};

export { auth, db };
