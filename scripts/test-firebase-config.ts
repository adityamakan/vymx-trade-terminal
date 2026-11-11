import assert from 'node:assert/strict';
import { resolveFirebaseClientConfig } from '../src/utils/firebaseConfig';

assert.equal(resolveFirebaseClientConfig({}), null, 'missing Firebase config must disable persistent services');
assert.equal(resolveFirebaseClientConfig({
  VITE_FIREBASE_API_KEY: 'public-api-key',
  VITE_FIREBASE_PROJECT_ID: 'example-project'
}), null, 'partial Firebase config must not initialize an incomplete app');

assert.deepEqual(resolveFirebaseClientConfig({
  VITE_FIREBASE_API_KEY: ' public-api-key ',
  VITE_FIREBASE_AUTH_DOMAIN: ' example-project.firebaseapp.com ',
  VITE_FIREBASE_PROJECT_ID: ' example-project ',
  VITE_FIREBASE_APP_ID: ' 1:123:web:abc ',
  VITE_FIREBASE_STORAGE_BUCKET: ' example-project.firebasestorage.app ',
  VITE_FIREBASE_MESSAGING_SENDER_ID: ' 123 ',
  VITE_FIREBASE_MEASUREMENT_ID: ' G-ABC123 '
}), {
  apiKey: 'public-api-key',
  authDomain: 'example-project.firebaseapp.com',
  projectId: 'example-project',
  appId: '1:123:web:abc',
  storageBucket: 'example-project.firebasestorage.app',
  messagingSenderId: '123',
  measurementId: 'G-ABC123'
}, 'complete Firebase config must be normalized and returned');

assert.deepEqual(resolveFirebaseClientConfig({
  VITE_FIREBASE_API_KEY: 'key',
  VITE_FIREBASE_AUTH_DOMAIN: 'example.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'example',
  VITE_FIREBASE_APP_ID: 'app'
}), {
  apiKey: 'key',
  authDomain: 'example.firebaseapp.com',
  projectId: 'example',
  appId: 'app'
}, 'optional fields must remain omitted when not configured');

console.log('Firebase client configuration tests passed.');
