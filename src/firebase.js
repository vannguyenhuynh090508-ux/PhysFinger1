import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Điền giá trị trong file .env.local (local) hoặc Environment Variables (Vercel)
const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});
export const db = getDatabase(app);
