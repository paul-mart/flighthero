import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserPreferences {
  militaryZuluTime?: boolean;
}

export interface UserProfile {
  email: string;
  displayName: string;
  preferences?: UserPreferences;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastLoginAt?: Timestamp;
}

function requireAuth() {
  if (!auth || !db) {
    throw new Error('Firebase is not configured. Add your Firebase env variables to .env.local.');
  }
  return { auth, db };
}

export async function createUserProfile(user: User, displayName: string): Promise<void> {
  const { db: firestore } = requireAuth();
  await setDoc(doc(firestore, 'users', user.uid), {
    email: user.email ?? '',
    displayName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });
}

export async function updateUserLogin(user: User): Promise<void> {
  const { db: firestore } = requireAuth();
  const userRef = doc(firestore, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    await setDoc(userRef, {
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    }, { merge: true });
    return;
  }

  await setDoc(userRef, {
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { db: firestore } = requireAuth();
  const snapshot = await getDoc(doc(firestore, 'users', uid));
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserProfile;
}

export async function updateUserPreferences(
  uid: string,
  preferences: UserPreferences,
): Promise<void> {
  const { db: firestore } = requireAuth();
  await setDoc(doc(firestore, 'users', uid), {
    preferences,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const { auth: firebaseAuth } = requireAuth();
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  await updateProfile(credential.user, { displayName: displayName.trim() });
  await createUserProfile(credential.user, displayName.trim());
  return credential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const { auth: firebaseAuth } = requireAuth();
  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  await updateUserLogin(credential.user);
  return credential.user;
}

export async function signOut(): Promise<void> {
  const { auth: firebaseAuth } = requireAuth();
  await firebaseSignOut(firebaseAuth);
}

export function getAuthErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code: string }).code)
    : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  }
}
