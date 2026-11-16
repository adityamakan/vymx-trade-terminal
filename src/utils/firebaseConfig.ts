export interface FirebaseClientEnvironment {
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_STORAGE_BUCKET?: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
  VITE_FIREBASE_MEASUREMENT_ID?: string;
}
export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
}
/** Firebase web configuration is public client configuration, not a secret.
 * Persistent auth/Firestore are disabled unless all required identifiers are
 * supplied by the deployment environment. Never fall back to a fake project.
 */
export function resolveFirebaseClientConfig(env: FirebaseClientEnvironment): FirebaseClientConfig | null {
  const apiKey = env.VITE_FIREBASE_API_KEY?.trim();
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = env.VITE_FIREBASE_PROJECT_ID?.trim();
  const appId = env.VITE_FIREBASE_APP_ID?.trim();
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  const requiredValues = [apiKey, authDomain, projectId, appId].map((value) => value.toLowerCase());
  const placeholders = new Set(['mock', 'placeholder', 'changeme', 'your-api-key', 'your_project_id']);
  if (requiredValues.some((value) => placeholders.has(value))) return null;
  const config: FirebaseClientConfig = { apiKey, authDomain, projectId, appId };
  const storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const measurementId = env.VITE_FIREBASE_MEASUREMENT_ID?.trim();
  if (storageBucket) config.storageBucket = storageBucket;
  if (messagingSenderId) config.messagingSenderId = messagingSenderId;
  if (measurementId) config.measurementId = measurementId;
  return config;
}
