import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Điền giá trị trong file .env.local (local) hoặc Environment Variables (Vercel)
const clean = (v) => (v || "").trim().replace(/^["']|["']$/g, "");

// Dọn link database: bỏ ngoặc kép, khoảng trắng, dấu "/" cuối; thêm https:// nếu thiếu
let url = clean(import.meta.env.VITE_FIREBASE_DATABASE_URL).replace(/\/+$/, "");
if (url && !/^https?:\/\//.test(url)) url = "https://" + url;

const app = initializeApp({
  apiKey: clean(import.meta.env.VITE_FIREBASE_API_KEY),
  databaseURL: url,
  projectId: clean(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  appId: clean(import.meta.env.VITE_FIREBASE_APP_ID),
});
export const db = getDatabase(app);
