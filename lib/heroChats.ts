import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

export type HeroChatRole = 'user' | 'assistant' | 'system';

export interface HeroChatMessage {
  role: HeroChatRole;
  content: string;
  timestamp: number;
}

export interface HeroChat {
  id: string;
  title: string;
  messages: HeroChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const TITLE_MAX = 60;

export function truncateChatTitle(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= TITLE_MAX) return trimmed;
  return `${trimmed.slice(0, TITLE_MAX - 1)}…`;
}

function heroChatsCollection(userId: string) {
  if (!db) throw new Error('Firestore is not configured.');
  return collection(db, 'users', userId, 'heroChats');
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return Date.now();
}

function normalizeMessage(raw: unknown): HeroChatMessage | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const role = item.role;
  if (role !== 'user' && role !== 'assistant' && role !== 'system') return null;
  if (typeof item.content !== 'string') return null;
  return {
    role,
    content: item.content,
    timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now(),
  };
}

function normalizeChat(id: string, raw: Record<string, unknown>): HeroChat | null {
  const messages = Array.isArray(raw.messages)
    ? raw.messages.map(normalizeMessage).filter((m): m is HeroChatMessage => m !== null)
    : [];
  const title = typeof raw.title === 'string' ? raw.title : 'New chat';
  const createdAt = toMillis(raw.createdAt);
  const updatedAt = toMillis(raw.updatedAt);
  return { id, title, messages, createdAt, updatedAt };
}

export function subscribeHeroChats(
  userId: string,
  onChange: (chats: HeroChat[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  if (!isFirebaseConfigured() || !db) {
    onChange([]);
    return () => undefined;
  }

  const q = query(heroChatsCollection(userId), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const chats = snapshot.docs
        .map((docSnap) => normalizeChat(docSnap.id, docSnap.data() as Record<string, unknown>))
        .filter((chat): chat is HeroChat => chat !== null);
      onChange(chats);
    },
    (error) => {
      onError?.(error);
      onChange([]);
    },
  );
}

export async function createHeroChat(userId: string): Promise<string> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Sign in to start a conversation.');
  }
  const now = Date.now();
  const ref = await addDoc(heroChatsCollection(userId), {
    title: 'New chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function saveHeroChatMessages(
  userId: string,
  chatId: string,
  messages: HeroChatMessage[],
  title?: string,
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  const ref = doc(db, 'users', userId, 'heroChats', chatId);
  const payload: Record<string, unknown> = {
    messages,
    updatedAt: Date.now(),
  };
  if (title) payload.title = title;
  await setDoc(ref, payload, { merge: true });
}

export async function deleteHeroChat(userId: string, chatId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Sign in to manage conversations.');
  }
  await deleteDoc(doc(db, 'users', userId, 'heroChats', chatId));
}

export async function renameHeroChat(
  userId: string,
  chatId: string,
  title: string,
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Sign in to manage conversations.');
  }
  const trimmed = truncateChatTitle(title);
  if (!trimmed) {
    throw new Error('Title cannot be empty.');
  }
  const ref = doc(db, 'users', userId, 'heroChats', chatId);
  await setDoc(ref, { title: trimmed, updatedAt: Date.now() }, { merge: true });
}

export type ChatDateGroup = 'today' | 'yesterday' | 'last7' | 'older';

export function getChatDateGroup(updatedAt: number, now = Date.now()): ChatDateGroup {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfLast7 = new Date(startOfToday);
  startOfLast7.setDate(startOfLast7.getDate() - 7);

  if (updatedAt >= startOfToday.getTime()) return 'today';
  if (updatedAt >= startOfYesterday.getTime()) return 'yesterday';
  if (updatedAt >= startOfLast7.getTime()) return 'last7';
  return 'older';
}

export const CHAT_GROUP_LABELS: Record<ChatDateGroup, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7: 'Last 7 days',
  older: 'Older',
};
