# Misi AI Bijak

Aplikasi Vue untuk menyampaikan materi etika penggunaan AI secara interaktif. Aplikasi memiliki lima misi pembelajaran, pola JEDA, umpan balik langsung, Mode Guru, dan penyimpanan kemajuan pada perangkat.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Build produksi:

```bash
npm run build
npm run preview
```

## Deploy ke Vercel

1. Masukkan folder ini ke repository Git.
2. Impor repository tersebut di Vercel.
3. Vercel akan mendeteksi framework **Vite** secara otomatis.
4. Gunakan build command `npm run build` dan output directory `dist` jika diminta.
5. Deploy aplikasi.

Konfigurasi SPA sudah tersedia di `vercel.json`.

## Halaman aplikasi

- `/` — pengantar dan prinsip JEDA.
- `/missions` — peta pilihan misi.
- `/missions/:id` — materi dan aktivitas setiap misi.
- `/summary` — ringkasan pembelajaran.
- `/teacher` — dashboard pengelolaan konten untuk guru.

## Mengelola konten

Dashboard Guru dapat mengubah judul, pengantar, warna, soal, studi kasus, pilihan jawaban, serta URL video pada Misi 5. Perubahan tersimpan di browser yang sedang digunakan.

Gunakan **Ekspor JSON** untuk membuat berkas cadangan atau memindahkan konten ke perangkat lain. Gunakan **Impor JSON** untuk memuatnya kembali. Karena deployment Vercel bersifat statis, perubahan dari dashboard tidak menulis langsung ke berkas di server dan tidak otomatis dibagikan ke perangkat lain.

## Menghubungkan Arena Cerdas Cermat

Tambahkan Environment Variable berikut pada pengaturan proyek Vercel:

```text
VITE_EVALUATION_URL=https://alamat-arena-cerdas-cermat.vercel.app
```

Untuk penggunaan lokal, salin `.env.example` menjadi `.env.local`, lalu isi alamat aplikasi evaluasi. Jalankan ulang server pengembangan setelah mengubah environment variable.

## Penyimpanan dan privasi

- Tidak ada akun atau backend.
- Tidak ada nama maupun data pribadi peserta didik yang dikumpulkan.
- Kemajuan disimpan di `localStorage` pada browser yang digunakan.
- Mode Guru dapat menghapus seluruh kemajuan pada perangkat.
- Setelah kunjungan daring pertama, service worker menyimpan aset yang telah dimuat agar aplikasi dapat dibuka kembali saat koneksi tidak tersedia.
