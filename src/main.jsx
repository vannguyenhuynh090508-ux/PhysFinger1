import { createRoot } from "react-dom/client";
import "./index.css";

const need = ["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_DATABASE_URL", "VITE_FIREBASE_PROJECT_ID", "VITE_FIREBASE_APP_ID"];
const missing = need.filter((k) => !import.meta.env[k]);
const root = createRoot(document.getElementById("root"));

if (missing.length) {
  // Hiện lỗi cấu hình rõ ràng thay vì màn hình đen
  root.render(
    <div className="mx-auto max-w-lg p-6 text-sm">
      <h1 className="mb-2 text-lg font-semibold text-amber-300">Thiếu cấu hình Firebase</h1>
      <p className="mb-2 text-slate-300">Thêm các biến sau trong Vercel (Settings → Environment Variables) rồi Redeploy:</p>
      <ul className="list-disc pl-5 text-slate-200">{missing.map((k) => <li key={k}>{k}</li>)}</ul>
    </div>
  );
} else {
  import("./App.jsx")
    .then(({ default: App }) => root.render(<App />))
    .catch((e) => root.render(<pre className="p-6 text-sm text-red-300">{String(e)}</pre>));
}

