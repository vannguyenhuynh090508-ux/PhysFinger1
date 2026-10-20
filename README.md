# PhysFinger – Điểm danh vân tay (React + Vite + Tailwind + Firebase)

Tài khoản demo: `admin / 123456` (Admin), `demo01 / 123456` (Giảng viên).

## 1. Chạy local
```bash
npm install
cp .env.example .env.local   # rồi điền 4 giá trị Firebase
npm run dev                  # mở http://localhost:5173
```
Lấy giá trị Firebase: Console → ⚙ Project settings → *Your apps* → Web app (`</>`) → copy `apiKey`, `projectId`, `appId`.
`VITE_FIREBASE_DATABASE_URL` là link ở đầu trang Realtime Database (bỏ dấu `/` cuối).

## 2. Đẩy lên GitHub và deploy Vercel
```bash
git init && git add . && git commit -m "PhysFinger"
git branch -M main
git remote add origin https://github.com/<ten-ban>/physfinger.git
git push -u origin main
```
1. Vào vercel.com → **Add New → Project** → import repo `physfinger`.
2. Framework tự nhận **Vite**. Mở **Environment Variables**, thêm 4 biến `VITE_FIREBASE_*` như trong `.env.example`.
3. Bấm **Deploy**. Mỗi lần `git push`, Vercel tự deploy lại.

## 3. Rules Firebase Realtime Database (tab Rules → Publish)
Dùng để demo (ESP8266 ghi qua REST không đăng nhập nên cần mở ghi):
```json
{ "rules": { ".read": true, ".write": true } }
```
Chỉ dùng cho đồ án. Đăng nhập demo nằm trong code nên không bảo mật thật.

## 4. Cấu trúc dữ liệu (khớp với code ESP8266 `esp8266_diem_danh.ino`)
```
active_event: "<id sự kiện đang mở>"
events/<id>: { name, code, location, startAt, createdAt }
students/<idVanTay>: "Họ tên"
attendance/<idSuKien>/<idVanTay>: { time }   // time = giây (epoch)
```
