# Scan KTP (NIK) - ADM

Aplikasi web untuk memindai NIK KTP via kamera secara otomatis dan memverifikasi ke DB dummy. Siap deploy di Vercel (frontend+API) dan kompatibel jika API dipisah ke Railway.

## Fitur

- Pemindaian kamera tanpa tombol ambil gambar (otomatis)
- OCR berbasis Tesseract.js, preprocessing untuk akurasi
- Validasi regex NIK dan verifikasi ke API dummy
- Redirect otomatis ke halaman sukses saat cocok

## Dummy Data

- NIK diizinkan: `320428220130007`

## Jalankan Lokal

```bash
pnpm i # atau npm i / yarn
pnpm dev
```

Buka `http://localhost:3000` dan beri izin kamera.

## Deploy Vercel

- Hubungkan repo ke Vercel
- Framework: Next.js
- Build: `next build`
- Output: Next.js default
- Node 18+

## Pisah Backend (opsional)

Jika ingin API di Railway:

- Pindahkan handler `app/api/verify/route.ts` ke server Node/Express minimal
- Ubah pemanggilan fetch di `app/scan/page.tsx` ke URL publik Railway

## Catatan Akurasi OCR

- Pastikan KTP berada di area kotak overlay
- Pencahayaan cukup, hindari glare
- Jarak kamera 15–25 cm, fokus ke area NIK
- Gunakan kamera belakang (facingMode: environment)
# scan-ktp2
