# Child Development Support Platform — Frontend (MVP-1: Auth)

โปรเจกต์นี้มีเฉพาะส่วน **สมัครสมาชิก / เข้าสู่ระบบ** ที่เชื่อมกับ Supabase จริงแล้ว
ขั้นตอน Parent Profile / Child Profile / Journey / Community จะเพิ่มในรอบถัดไป

## ขั้นตอนที่ 1 — เอา URL และ Key จาก Supabase มาใส่

1. เข้า Supabase Dashboard ของโปรเจกต์ `child-dev-platform`
2. ไปที่เมนู **Project Settings → API**
3. คัดลอกค่า 2 ตัวนี้:
   - **Project URL**
   - **anon public key**
4. เปิดไฟล์ `.env.example` ในโปรเจกต์นี้ เปลี่ยนชื่อเป็น `.env` แล้ววางค่าที่คัดลอกมาแทนที่

```
VITE_SUPABASE_URL=วาง Project URL ตรงนี้
VITE_SUPABASE_ANON_KEY=วาง anon public key ตรงนี้
```

## ขั้นตอนที่ 2 — อัปโหลดโค้ดขึ้น GitHub

1. สร้าง repository ใหม่บน GitHub (เช่นชื่อ `child-dev-platform`)
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้นไป (ยกเว้น `node_modules` และ `.env` ซึ่งถูกกันไว้ใน `.gitignore` แล้ว)

## ขั้นตอนที่ 3 — Deploy ด้วย Cloudflare Pages

1. เข้า dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. เลือก repository ที่เพิ่งอัปโหลด
3. ตั้งค่า Build:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. ก่อนกด Deploy ให้เพิ่ม **Environment variables** 2 ตัวเดียวกับใน `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. กด **Save and Deploy**

รอ 1-2 นาที จะได้ URL จริงที่เปิดใช้งานได้ทันที (เช่น `child-dev-platform.pages.dev`)

## ทดสอบว่าใช้งานได้จริง

1. เปิด URL ที่ได้ → ควรเจอหน้า Login
2. กด "สร้างบัญชีใหม่" → สมัครด้วยอีเมลจริง
3. เข้า Supabase Dashboard → **Authentication → Users** ควรเห็นบัญชีใหม่ขึ้นมา
4. เข้า **Table Editor → users** ควรเห็นแถวใหม่ถูกสร้างอัตโนมัติ (role = PARENT)

## รันดูบนเครื่องตัวเองก่อน deploy (ไม่บังคับ ข้ามได้)

ถ้ามี Node.js ติดตั้งอยู่แล้ว:

```
npm install
npm run dev
```

เปิด http://localhost:5173
