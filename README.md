# LENTERA

**Len Internship Realtime Attendance** — aplikasi manajemen Praktik Kerja Lapangan (PKL) untuk PT Len Industri (Persero). Presensi QR dinamis, geofence, izin, jurnal harian, penilaian berbobot, laporan, dan administrasi dalam satu PWA yang responsif.

> Versi saat ini adalah **MVP frontend** dengan backend simulasi berbasis `localStorage`. Seluruh alur dapat dicoba tanpa server tambahan.

## Fitur utama

- **Presensi QR dinamis** — token berganti otomatis setiap 30–60 detik, validasi geofence, pencegahan presensi ganda, dan pencatatan masuk/pulang.
- **QR pribadi peserta** — setiap akun peserta PKL memiliki QR identitas sendiri; pembimbing, guru pembimbing, atau admin memindai QR tersebut lewat menu **Scan Peserta** untuk mencatat kehadiran.
- **Kegiatan rutin** — presensi Olahraga dan Dhuha dengan jadwal mingguan.
- **Perizinan** — pengajuan izin/sakit, lampiran, persetujuan pembimbing, dan pembaruan presensi otomatis.
- **Jurnal harian** — pengiriman, validasi, catatan revisi, dan riwayat jurnal.
- **Penilaian** — komponen berbobot, nilai disiplin otomatis dari kehadiran, finalisasi terkunci, serta lembar nilai siap cetak.
- **Dashboard per peran** — admin, pembimbing industri, guru pembimbing, dan peserta.
- **Laporan** — rekap kehadiran, jurnal, nilai, peringkat, ekspor CSV, dan cetak.
- **Administrasi** — pengguna, sekolah, divisi, periode, komponen nilai, kegiatan, pengaturan presensi, dan log aktivitas.
- **Pengalaman mobile-first** — PWA installable, dark mode, navigasi bawah untuk peserta, dan aksesibilitas dasar.

## Akun demo

Semua akun menggunakan kata sandi **`lentera123`**.

| Peran | Nama | Username | Fokus demo |
| --- | --- | --- | --- |
| Peserta PKL | Nabila Putri | `nabila` | Scan QR, jurnal, izin, nilai |
| Pembimbing Industri | Rina Kartika | `rina` | Tampilkan QR, validasi, penilaian |
| Guru Pembimbing | Ahmad Fauzi | `ahmad` | Monitoring siswa bimbingan |
| Admin PKL | Koordinator PKL | `admin` | Pengguna, master data, pengaturan |

Peserta juga dapat masuk menggunakan **NIS** (contoh: `221001` untuk Nabila).

## Menjalankan aplikasi

Prasyarat: **Node.js 20+** dan npm.

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

Perintah lain:

```bash
npm run build     # typecheck + build produksi
npm run preview   # pratinjau hasil build
npm run lint      # oxlint
```

## Alur demo yang disarankan

1. Masuk sebagai **Rina** (`rina`) lalu buka menu **Tampilkan QR**.
2. Pilih jenis QR **Presensi harian**, lalu salin token atau biarkan QR tampil.
3. Keluar dan masuk sebagai **Nabila** (`nabila`). Buka menu **Scan QR**.
4. Gunakan **simulasi lokasi PT Len** (default) atau aktifkan GPS asli, lalu tempel token atau pindai QR.
5. Presensi masuk akan tercatat. Scan token yang masih berlaku sekali lagi untuk mencatat presensi pulang.
6. Masuk kembali sebagai **Rina** untuk melihat feed scan, memvalidasi izin/jurnal, dan mengisi penilaian.
7. Masuk sebagai **admin** untuk mencoba pengelolaan pengguna, master data, pengaturan geofence, dan log aktivitas.

### Presensi dengan QR pribadi peserta

1. Masuk sebagai **Nabila**, buka menu **QR Saya** dan biarkan QR pribadi tampil.
2. Masuk sebagai **Rina**, buka menu **Scan Peserta**, lalu pindai QR Nabila (atau tekan tombol **Scan** pada daftar peserta untuk simulasi).
3. Presensi masuk Nabila tercatat. Pindai QR yang sama sekali lagi untuk mencatat presensi pulang.
4. Peserta lain juga memiliki QR pribadi masing-masing pada menu **QR Saya**.

Catatan: Nabila sengaja belum memiliki presensi hari ini agar alur scan dapat diuji dari awal. Peserta lain sudah memiliki data contoh.

## Penyimpanan data

Data demo disimpan di browser:

- `lentera.data.v1` — seluruh data aplikasi
- `lentera.auth.v1` — sesi pengguna aktif
- `lentera.qr.sessions.v1` — sesi token QR
- `lentera.theme` — preferensi tema

Untuk mengembalikan data awal, masuk sebagai admin lalu buka **Pengaturan → Reset data demo**. Menghapus data situs melalui pengaturan browser juga akan memulai ulang data seed.

## PWA

Aplikasi sudah dikonfigurasi dengan `vite-plugin-pwa` (manifest, service worker, ikon 192/512). Setelah build atau saat dev, buka di Chrome/Safari lalu pilih **Tambahkan ke layar utama**. Mode standalone akan aktif tanpa address bar.

Untuk membungkus menjadi APK, proyek dapat dilanjutkan dengan Capacitor:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init LENTERA id.lentera.app --web-dir=dist
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

## Struktur proyek

```text
src/
  components/        UI primitives, layout, chart, dan shared components
  features/          Halaman per domain (auth, dashboard, attendance, dll.)
  lib/               Seed data, analytics, QR, konstanta, dan utilitas
  providers/         Data store, autentikasi, tema, dan persistensi
  types/             Tipe domain TypeScript
public/              Ikon PWA dan favicon
```

## Roadmap backend produksi

MVP ini dirancang agar mudah dipindahkan ke backend nyata. Rekomendasi: **Laravel 11 + Sanctum + MySQL/PostgreSQL**.

Prioritas berikutnya:

1. Autentikasi token, hash kata sandi, dan manajemen sesi.
2. Endpoint presensi server-side dengan token QR bertanda tangan (HMAC), validasi waktu, dan geofence.
3. Penyimpanan lampiran izin/jurnal di object storage.
4. RBAC dan scoping data per pembimbing/guru/sekolah.
5. Audit log append-only, notifikasi push, dan ekspor laporan di server.
6. Integrasi WhatsApp/email untuk notifikasi penting.
7. Pengujian end-to-end dan hardening keamanan.

## Batasan MVP

- Validasi QR dan geofence berjalan di klien, sehingga belum aman untuk produksi.
- Data hanya tersimpan di browser dan tidak tersinkron antar perangkat.
- Lampiran hanya berupa nama berkas, belum diunggah.
- Lupa kata sandi masih berupa simulasi.
- Waktu menggunakan zona waktu perangkat; produksi sebaiknya memakai WIB di server.

---

Dibuat untuk kebutuhan demo program PKL **PT Len Industri (Persero)**.
