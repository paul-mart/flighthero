import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

function getContactErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code: string }).code)
    : '';

  switch (code) {
    case 'permission-denied':
      return 'Could not send your message. Deploy the latest Firestore rules for this project.';
    case 'unavailable':
      return 'Could not reach Firebase. Check your connection and try again.';
    default:
      return error instanceof Error ? error.message : 'Could not send your message. Please try again.';
  }
}

export async function submitContactForm(email: string, message: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase is not configured. Add your Firebase keys to .env.local.');
  }

  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();
  const subject = `FlightHero contact from ${trimmedEmail}`;

  try {
    await addDoc(collection(db, 'contactMessages'), {
      email: trimmedEmail,
      message: trimmedMessage,
      createdAt: serverTimestamp(),
      source: 'contact-form',
    });

    const toEmail = (import.meta.env.VITE_CONTACT_TO_EMAIL || '').trim();
    if (toEmail) {
      await addDoc(collection(db, 'mail'), {
        to: [toEmail],
        replyTo: trimmedEmail,
        message: { subject, text: trimmedMessage },
      });
    }
  } catch (error) {
    throw new Error(getContactErrorMessage(error));
  }
}
