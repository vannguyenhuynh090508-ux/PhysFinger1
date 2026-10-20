import { useEffect, useRef, useState } from "react";
import { ref, onValue, set, push, remove, get } from "firebase/database";
import { db } from "./firebase";

const USERS = {
  admin: { pass: "123456", role: "admin", name: "Quản trị viên" },
  demo01: { pass: "123456", role: "teacher", name: "Giảng viên demo" },
};
const now = () => Math.floor(Date.now() / 1000);
const fmt = (s) => new Date(s * 1000).toLocaleString("vi-VN", { hour12: false });
const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500";
const btn = "rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400";
const ghost = "rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800";
const card = "rounded-xl border border-slate-800 bg-slate-900/60 p-4";

// Lắng nghe realtime một đường dẫn trong Firebase (undefined = đang tải)
function useDb(path) {
  const [v, setV] = useState(undefined);
  useEffect(() => {
    setV(undefined);
    if (!path) { setV(null); return; }
    return onValue(ref(db, path), (s) => setV(s.val()));
  }, [path]);
  return v;
}

const Logo = ({ big }) => (
  <span className={`${big ? "text-3xl" : "text-xl"} font-bold tracking-tight`}>
    <span className="text-emerald-400">Phys</span><span className="text-white">Finger</span>
  </span>
);

function Login({ onLogin }) {
  const [u, setU] = useState(""), [p, setP] = useState(""), [err, setErr] = useState("");
  const go = (user, pass) => {
    const a = USERS[user];
    if (!a || a.pass !== pass) return setErr("Sai tên đăng nhập hoặc mật khẩu.");
    onLogin({ username: user, ...a });
  };
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className={`${card} w-full max-w-sm space-y-4`}>
        <div className="text-center"><Logo big /><p className="mt-1 text-sm text-slate-400">Hệ thống điểm danh vân tay</p></div>
        <form onSubmit={(e) => { e.preventDefault(); go(u.trim(), p); }} className="space-y-3">
          <input className={inp} placeholder="Tên đăng nhập" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" />
          <input className={inp} type="password" placeholder="Mật khẩu" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" />
          {err && <p className="text-sm text-red-400" role="alert">{err}</p>}
          <button className={`${btn} w-full`}>Đăng nhập</button>
        </form>
        <div className="grid gap-2 border-t border-slate-800 pt-4">
          <button className={ghost} onClick={() => go("admin", "123456")}>Đăng nhập với Admin</button>
          <button className={ghost} onClick={() => go("demo01", "123456")}>Đăng nhập với Giảng viên</button>
        </div>
      </div>
    </div>
  );
}

function Live({ toast }) {
  const active = useDb("active_event");
  const ev = useDb(active ? `events/${active}` : null);
  const att = useDb(active ? `attendance/${active}` : null);
  const students = useDb("students") || {};
  const [sim, setSim] = useState(false), [sid, setSid] = useState("");
  const prev = useRef(null);
  useEffect(() => { prev.current = null; }, [active]);
  useEffect(() => {
    if (att === undefined) return;
    const keys = Object.keys(att || {});
    if (prev.current) keys.filter((k) => !prev.current.has(k)).forEach((k) => toast(`${students[k] || "ID " + k} đã điểm danh thành công`));
    prev.current = new Set(keys);
  }, [att]);

  const rows = Object.entries(att || {}).map(([id, v]) => ({ id, time: v.time })).sort((a, b) => b.time - a.time);
  const simulate = async () => {
    if (!active) return toast("Chưa có sự kiện đang mở", "warn");
    if (!sid) return;
    const r = ref(db, `attendance/${active}/${sid}`);
    if ((await get(r)).exists()) return toast(`ID ${sid} đã điểm danh rồi`, "warn");
    await set(r, { time: now() }); // giống hệt dữ liệu ESP8266 gửi lên
  };

  return (
    <div className="space-y-4">
      <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <h2 className="text-lg font-semibold">{active && ev ? ev.name : "Chưa có sự kiện đang mở"}</h2>
          <p className="text-sm text-slate-400">{active && ev ? [ev.code, ev.location, ev.startAt && fmt(ev.startAt)].filter(Boolean).join(" · ") : "Admin cần kích hoạt một sự kiện."}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs ${active ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>{active ? "Đang mở" : "Đang đóng"}</span>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={sim} onChange={(e) => setSim(e.target.checked)} className="accent-emerald-500" /> Simulation Mode
          </label>
        </div>
      </div>

      {sim && (
        <div className={`${card} flex flex-wrap items-end gap-3 border-cyan-500/40`}>
          <div className="w-32"><label className="text-xs text-slate-400">ID vân tay</label><input className={inp} type="number" min="1" max="127" value={sid} onChange={(e) => setSid(e.target.value)} /></div>
          <button className={btn} onClick={simulate}>Giả lập quét vân tay</button>
          <p className="text-xs text-slate-400">Ghi dữ liệu như ESP8266 thật, dùng khi chưa cắm phần cứng.</p>
        </div>
      )}

      <div className={card}>
        <h3 className="mb-3 font-medium">Đã điểm danh ({rows.length})</h3>
        {rows.length === 0 ? <p className="text-sm text-slate-400">Chưa có lượt quét nào.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="text-slate-400"><tr><th className="py-2">Họ tên</th><th>ID</th><th>Thời gian quét</th><th>Sự kiện</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-800"><td className="py-2">{students[r.id] || "Chưa đặt tên"}</td><td>{r.id}</td><td>{fmt(r.time)}</td><td>{ev?.name}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}

function Admin({ toast }) {
  const events = useDb("events") || {}, active = useDb("active_event"), students = useDb("students") || {};
  const empty = { name: "", code: "", when: "", place: "" };
  const [f, setF] = useState(empty), [sid, setSid] = useState(""), [sname, setSname] = useState("");
  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const create = async (e) => {
    e.preventDefault();
    await push(ref(db, "events"), { name: f.name, code: f.code, location: f.place, startAt: Math.floor(new Date(f.when || Date.now()).getTime() / 1000), createdAt: now() });
    setF(empty); toast("Đã tạo sự kiện");
  };
  const list = Object.entries(events).sort((a, b) => (b[1].startAt || 0) - (a[1].startAt || 0));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={create} className={`${card} space-y-3`}>
        <h3 className="font-medium">Tạo sự kiện điểm danh</h3>
        <input className={inp} required placeholder="Tên sự kiện / cuộc họp" value={f.name} onChange={upd("name")} />
        <input className={inp} placeholder="Mã sự kiện / lớp" value={f.code} onChange={upd("code")} />
        <input className={inp} type="datetime-local" value={f.when} onChange={upd("when")} />
        <input className={inp} placeholder="Địa điểm" value={f.place} onChange={upd("place")} />
        <button className={btn}>Tạo sự kiện</button>
      </form>

      <div className={card}>
        <h3 className="mb-3 font-medium">Danh sách sự kiện</h3>
        {list.length === 0 && <p className="text-sm text-slate-400">Chưa có sự kiện.</p>}
        <ul className="max-h-80 space-y-2 overflow-y-auto">{list.map(([id, e]) => (
          <li key={id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-900 p-3">
            <div className="min-w-0"><p className="truncate text-sm font-medium">{e.name}</p><p className="text-xs text-slate-400">{e.startAt && fmt(e.startAt)}</p></div>
            {active === id
              ? <button className={ghost} onClick={() => remove(ref(db, "active_event"))}>Dừng</button>
              : <button className={btn} onClick={() => { set(ref(db, "active_event"), id); toast(`Đã kích hoạt: ${e.name}`); }}>Kích hoạt</button>}
          </li>))}
        </ul>
      </div>

      <div className={`${card} lg:col-span-2`}>
        <h3 className="mb-3 font-medium">Danh sách người tham gia (gán tên cho ID vân tay)</h3>
        <form className="mb-3 flex flex-wrap gap-2" onSubmit={async (e) => { e.preventDefault(); await set(ref(db, `students/${sid}`), sname); setSid(""); setSname(""); }}>
          <input className={`${inp} !w-28`} required type="number" min="1" max="127" placeholder="ID" value={sid} onChange={(e) => setSid(e.target.value)} />
          <input className={`${inp} !w-64`} required placeholder="Họ và tên" value={sname} onChange={(e) => setSname(e.target.value)} />
          <button className={btn}>Lưu</button>
        </form>
        <div className="flex flex-wrap gap-2">{Object.entries(students).map(([id, n]) => (
          <span key={id} className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-sm">{id} · {n}
            <button aria-label={`Xóa ${n}`} className="text-slate-400 hover:text-red-400" onClick={() => remove(ref(db, `students/${id}`))}>×</button></span>))}
        </div>
      </div>
    </div>
  );
}

function History() {
  const events = useDb("events") || {}, attAll = useDb("attendance") || {}, students = useDb("students") || {};
  const [evId, setEvId] = useState("all"), [date, setDate] = useState(""), [q, setQ] = useState("");
  const rows = Object.entries(attAll).flatMap(([eid, m]) => Object.entries(m).map(([id, v]) => ({ eid, id, time: v.time, name: students[id] || "Chưa đặt tên", ev: events[eid]?.name || "(đã xóa)" })))
    .filter((r) => (evId === "all" || r.eid === evId)
      && (!date || new Date(r.time * 1000).toLocaleDateString("sv-SE") === date)
      && (!q || r.name.toLowerCase().includes(q.toLowerCase()) || r.id === q.trim()))
    .sort((a, b) => b.time - a.time);
  return (
    <div className={`${card} space-y-4`}>
      <div className="grid gap-3 sm:grid-cols-3">
        <select className={inp} value={evId} onChange={(e) => setEvId(e.target.value)} aria-label="Lọc theo sự kiện">
          <option value="all">Tất cả sự kiện</option>
          {Object.entries(events).map(([id, e]) => <option key={id} value={id}>{e.name} ({Object.keys(attAll[id] || {}).length})</option>)}
        </select>
        <input className={inp} type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Lọc theo ngày" />
        <input className={inp} placeholder="Tìm theo tên hoặc ID" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="text-slate-400"><tr><th className="py-2">Họ và tên</th><th>ID</th><th>Thời gian điểm danh</th><th>Sự kiện</th><th>Trạng thái</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.eid + r.id} className="border-t border-slate-800"><td className="py-2">{r.name}</td><td>{r.id}</td><td>{fmt(r.time)}</td><td>{r.ev}</td>
            <td><span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">Có mặt</span></td></tr>))}
        </tbody>
      </table>{rows.length === 0 && <p className="py-4 text-sm text-slate-400">Không có dữ liệu phù hợp.</p>}</div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => { const k = sessionStorage.getItem("pf_user"); return USERS[k] ? { username: k, ...USERS[k] } : null; });
  const [tab, setTab] = useState("live"), [toasts, setToasts] = useState([]);
  const toast = (msg, kind = "ok") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };
  if (!user) return <Login onLogin={(u) => { sessionStorage.setItem("pf_user", u.username); setUser(u); }} />;
  const tabs = [["live", "Điểm danh"], ["history", "Lịch sử"], ...(user.role === "admin" ? [["admin", "Quản trị"]] : [])];
  return (
    <div className="mx-auto max-w-5xl p-4">
      <header className="mb-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-slate-400 sm:inline">{user.name} · {user.role === "admin" ? "Admin" : "Giảng viên"}</span>
          <button className={ghost} onClick={() => { sessionStorage.removeItem("pf_user"); setUser(null); }}>Đăng xuất</button>
        </div>
      </header>
      <nav className="mb-4 flex gap-2 overflow-x-auto">{tabs.map(([k, l]) => (
        <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-4 py-2 text-sm ${tab === k ? "bg-emerald-500 font-medium text-slate-950" : "border border-slate-800 text-slate-300 hover:bg-slate-800"}`}>{l}</button>))}
      </nav>
      {tab === "live" && <Live toast={toast} />}
      {tab === "history" && <History />}
      {tab === "admin" && user.role === "admin" && <Admin toast={toast} />}
      <div className="fixed right-4 top-4 z-50 space-y-2" aria-live="polite">{toasts.map((t) => (
        <div key={t.id} className={`rounded-lg border px-4 py-3 text-sm shadow-lg ${t.kind === "warn" ? "border-amber-500/50 bg-amber-950 text-amber-200" : "border-emerald-500/50 bg-emerald-950 text-emerald-200"}`}>{t.msg}</div>))}
      </div>
    </div>
  );
}
