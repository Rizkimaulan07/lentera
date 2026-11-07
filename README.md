# LENTERA

**Len Internship Realtime Attendance** — aplikasi manajemen Praktik Kerja Lapangan (PKL) untuk PT Len Industri (Persero). Presensi QR terpusat, geofence, izin, jurnal harian, penilaian berbobot, laporan, dan administrasi dalam satu PWA yang responsif.

> Versi saat ini adalah **MVP frontend** dengan backend simulasi berbasis `localStorage`. Seluruh alur dapat dicoba tanpa server tambahan.

## Fitur utama

- **Presensi QR terpusat** — hanya Koordinator PKL yang memindai QR; peserta cukup menunjukkan QR pribadinya. Validasi geofence, pencegahan presensi ganda, dan pencatatan masuk/pulang.
- **QR pribadi peserta** — setiap akun peserta PKL memiliki QR identitas sendiri yang dipindai Koordinator PKL lewat menu **Scan Peserta**.
- **Kegiatan rutin** — presensi Olahraga setiap Jumat, dua sesi Dhuha pada pagi hari, dan ambil makan pukul 12.00–13.00. Koordinator memilih jenis presensi sebelum memindai QR peserta, dengan validasi hari dan jam sesi.
- **Pengingat otomatis** — banner dan notifikasi muncul saat sesi kegiatan dimulai, termasuk pengingat istirahat dan ambil makan pukul 12.00–13.00, presensi masuk, dan presensi pulang.
- **Perizinan** — pengajuan izin/sakit, lampiran, pengesahan oleh Koordinator PKL, dan pembaruan presensi otomatis.
- **Jurnal harian** — pengiriman, pengesahan oleh Koordinator PKL, catatan revisi, dan riwayat jurnal.
- **Pengesahan terpusat** — keputusan izin, pengesahan jurnal, dan presensi manual hanya dapat dilakukan oleh Koordinator PKL. Pembimbing industri dan guru pembimbing tetap dapat memantau.
- **Penilaian** — komponen berbobot, nilai disiplin otomatis dari kehadiran, finalisasi terkunci, serta lembar nilai siap cetak.
- **Dashboard per peran** — admin, pembimbing industri, guru pembimbing, dan peserta.
- **Laporan** — rekap kehadiran, jurnal, nilai, peringkat, ekspor CSV, dan cetak.
- **Administrasi** — pengguna, sekolah, divisi, periode, komponen nilai, kegiatan, pengaturan presensi, dan log aktivitas.
- **Pengalaman mobile-first** — PWA installable, dark mode, navigasi bawah untuk peserta, dan aksesibilitas dasar.

## Akun demo

Semua akun menggunakan kata sandi **`lentera123`**.

| Peran | Nama | Username | Fokus demo |
| --- | --- | --- | --- |
| Peserta PKL | Nabila Putri | `nabila` | QR pribadi, jurnal, izin, nilai |
| Pembimbing Industri | Rina Kartika | `rina` | Monitoring, penilaian, tampilkan QR |
| Guru Pembimbing | Ahmad Fauzi | `ahmad` | Monitoring siswa bimbingan |
| Admin PKL | Koordinator PKL | `admin` | Pengesahan izin/jurnal, scan QR peserta, pengguna, master data, pengaturan |

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

## Deploy ke GitHub Pages

Situs produksi: <https://rizkimaulan07.github.io/lentera/>

Aplikasi diterbitkan ke branch `gh-pages`, yang menjadi sumber GitHub Pages. Untuk memperbarui situs:

```bash
npm run deploy
```

Perintah tersebut membangun aplikasi dengan base `/lentera/`, menyiapkan `404.html` untuk rute SPA, lalu mendorong folder `dist` ke branch `gh-pages`.

## Alur demo yang disarankan

1. Masuk sebagai **admin** (**Koordinator PKL**), lalu buka menu **Scan Peserta**.
2. Pilih **Jenis presensi** yang ingin dicatat: presensi harian, olahraga, dhuha, atau ambil makan.
3. Aktifkan **simulasi lokasi PT Len** (default) atau gunakan GPS asli.
4. Masuk sebagai **Nabila** (`nabila`), buka menu **QR Saya**, lalu tunjukkan QR pribadinya kepada Koordinator PKL.
5. Koordinator memindai QR Nabila (atau menekan tombol **Scan** pada daftar peserta untuk simulasi). Presensi masuk akan tercatat; pindai sekali lagi untuk presensi pulang.
6. Untuk kegiatan rutin, pilih jenis presensi yang sesuai pada jam sesinya. Contoh: **Ambil makan** pukul 12.00–13.00 atau **Olahraga** pada hari Jumat.
7. Masuk sebagai **Rina** atau **Ahmad** untuk memantau izin/jurnal, melihat rekap, dan mengisi penilaian. Pengesahan izin dan jurnal hanya dapat dilakukan oleh **admin** (**Koordinator PKL**).

### Presensi dengan QR pribadi peserta

1. Masuk sebagai **Nabila**, buka menu **QR Saya** dan biarkan QR pribadi tampil.
2. Masuk sebagai **admin** (**Koordinator PKL**), buka menu **Scan Peserta**, pilih jenis presensi, lalu pindai QR Nabila (atau tekan tombol **Scan** pada daftar peserta untuk simulasi).
3. Presensi masuk Nabila tercatat. Pindai QR yang sama sekali lagi untuk mencatat presensi pulang.
4. Peserta lain juga memiliki QR pribadi masing-masing pada menu **QR Saya**.

Catatan: peserta tidak memiliki menu pemindaian QR. Pemindaian QR peserta hanya dapat dilakukan oleh Koordinator PKL; pembimbing dan guru pembimbing tetap dapat melihat rekap presensi. Nabila sengaja belum memiliki presensi hari ini agar alur scan dapat diuji dari awal. Peserta lain sudah memiliki data contoh.

## Penyimpanan data

Data demo disimpan di browser:

- `lentera.data.v1` — seluruh data aplikasi
- `lentera.auth.v1` — sesi pengguna aktif
- `lentera.reminders.v1` — catatan pengingat yang sudah ditampilkan hari ini
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
