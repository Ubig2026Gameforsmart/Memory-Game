# Daftar Fitur Memory Quiz

Total: **35+ Fitur**

---

## 🎮 Core Game Features (10 fitur)

| # | Fitur | Deskripsi | File Utama |
|---|---|---|---|
| 1 | **Multiplayer Real-time** | Banyak player bisa main bareng dalam satu room | `lib/supabase-room-manager.ts` |
| 2 | **Room System** | Host buat room dengan kode 6 digit | `app/host/[roomCode]/lobby/page.tsx` |
| 3 | **Quiz Game** | Kuis multiple choice dengan timer | `app/quiz/[roomCode]/page.tsx` |
| 4 | **Memory Card Game** | Mini game memory card setiap 3 jawaban benar | `app/game/[roomCode]/memory-challenge/page.tsx` |
| 5 | **Countdown Timer** | Countdown 10 detik sebelum game dimulai | `components/countdown-timer.tsx` |
| 6 | **Synchronized Timer** | Timer game sinkron di semua device | `hooks/use-synchronized-timer.ts` |
| 7 | **Score System** | Sistem poin untuk setiap jawaban benar | `lib/score-update-queue.ts` |
| 8 | **Leaderboard** | Ranking pemain berdasarkan skor | `app/host/leaderboard/page.tsx` |
| 9 | **Result Page** | Halaman hasil untuk player | `app/result/page.tsx` |
| 10 | **Auto Game End** | Game otomatis selesai saat timer habis | `app/quiz/[roomCode]/page.tsx` |

---

## 👥 Player Management (8 fitur)

| # | Fitur | Deskripsi | File Utama |
|---|---|---|---|
| 11 | **Join via Room Code** | Player join dengan kode 6 digit | `app/join/page.tsx` |
| 12 | **Join via QR Code** | Player scan QR untuk join | `components/qr-scanner.tsx` |
| 13 | **Join via Link** | Player klik link langsung join | `app/join/page.tsx` |
| 14 | **Nickname System** | Player bisa set nickname custom | `app/join/page.tsx` |
| 15 | **Avatar Selection** | 16 avatar lokal + Google avatar | `components/avatar-selector.tsx` |
| 16 | **Kick Player** | Host bisa kick player dari lobby | `app/host/[roomCode]/lobby/page.tsx` |
| 17 | **Player Reconnect** | Player bisa rejoin jika koneksi putus | `lib/supabase-session-manager.ts` |
| 18 | **Waiting Room** | Player tunggu di waiting room sebelum game | `app/waiting-room/[roomCode]/page.tsx` |

---

## 🎨 UI/UX Features (7 fitur)

| # | Fitur | Deskripsi | File Utama |
|---|---|---|---|
| 19 | **Retro Pixel Art Theme** | Tema pixel art retro 8-bit | `app/globals.css` |
| 20 | **Responsive Design** | Support mobile, tablet, desktop | Semua halaman |
| 21 | **Animations** | Animasi smooth untuk transisi | `app/globals.css` |
| 22 | **Loading States** | Loading indicator untuk setiap action | Semua halaman |
| 23 | **Toast Notifications** | Notifikasi popup untuk feedback | `hooks/use-toast.ts` |
| 24 | **Fullscreen Mode** | Bisa fullscreen untuk fokus | `app/page.tsx` |
| 25 | **Image Zoom** | Zoom gambar soal untuk lihat detail | `app/quiz/[roomCode]/page.tsx` |

---

## 🔐 Authentication & Session (4 fitur)

| # | Fitur | Deskripsi | File Utama |
|---|---|---|---|
| 26 | **Google OAuth Login** | Login dengan akun Google | `app/login/page.tsx` |
| 27 | **Session Management** | Sesi tersimpan di Supabase + localStorage | `lib/supabase-session-manager.ts` |
| 28 | **Auth Guard** | Proteksi halaman yang butuh login | `components/auth-guard.tsx` |
| 29 | **Auto Logout** | Logout otomatis dengan konfirmasi | `hooks/use-auth.ts` |

---

## 🌍 Internationalization (2 fitur)

| # | Fitur | Deskripsi | File Utama |
|---|---|---|---|
| 30 | **Multi-language** | Support 4 bahasa: EN, ID, AR, ZH | `lib/i18n.ts` |
| 31 | **Language Selector** | Dropdown pilih bahasa | `components/language-selector.tsx` |

---

## 📱 PWA Features (2 fitur)

| # | Fitur | Deskripsi | File Utama |
|---|---|---|---|
| 32 | **Install as App** | Bisa di-install di HP/desktop | `next.config.mjs` |
| 33 | **Install Prompt** | Banner prompt install app | `hooks/use-pwa-install.ts` |

---

## 🎯 Host Features (5 fitur)

| # | Fitur | Deskripsi | File Utama |
|---|---|---|---|
| 34 | **Quiz Selection** | Host pilih quiz dari database | `app/select-quiz/page.tsx` |
| 35 | **Quiz Settings** | Host atur jumlah soal & waktu | `app/quiz-settings/page.tsx` |
| 36 | **QR Code Generator** | Generate QR code untuk player join | `app/host/[roomCode]/lobby/page.tsx` |
| 37 | **Share Link** | Copy link untuk share ke player | `app/host/[roomCode]/lobby/page.tsx` |
| 38 | **Monitor Dashboard** | Host pantau progress semua player | `app/host/[roomCode]/monitor/page.tsx` |

---

## 🔧 Technical Features (7 fitur)

| # | Fitur | Deskripsi | File Utama |
|---|---|---|---|
| 39 | **Real-time Sync** | Supabase Realtime untuk sync state | `hooks/use-room.ts` |
| 40 | **BroadcastChannel** | Sync antar tab di browser yang sama | Multiple files |
| 41 | **Score Update Queue** | Antrian update skor (anti race condition) | `lib/score-update-queue.ts` |
| 42 | **Optimistic Updates** | Update UI dulu, sync ke server belakangan | Multiple files |
| 43 | **Pagination** | Pagination untuk list player & quiz | Multiple files |
| 44 | **Search Quiz** | Search quiz by keyword | `app/select-quiz/SelectQuizContent.tsx` |
| 45 | **Filter by Category** | Filter quiz berdasarkan kategori | `app/select-quiz/SelectQuizContent.tsx` |

---

## 🎵 Audio & Media (2 fitur)

| # | Fitur | Deskripsi | File Utama |
|---|---|---|---|
| 46 | **Background Music** | Musik background lofi | `components/global-audio-player.tsx` |
| 47 | **Image Support** | Soal & jawaban bisa pakai gambar | `app/quiz/[roomCode]/page.tsx` |

---

## 🛡️ Safety & Error Handling (5 fitur)

| # | Fitur | Deskripsi | File Utama |
|---|---|---|---|
| 48 | **Kick Detection** | Deteksi player di-kick (cross-device) | `app/waiting-room/[roomCode]/page.tsx` |
| 49 | **Host Left Detection** | Deteksi host keluar (cross-device) | `app/waiting-room/[roomCode]/page.tsx` |
| 50 | **Connection Lost Banner** | Banner saat koneksi internet putus | `components/reconnection-banner.tsx` |
| 51 | **Leave Confirmation** | Konfirmasi sebelum keluar room | Multiple files |
| 52 | **Room Not Found Handling** | Handle room yang sudah dihapus | Multiple files |

---

## 📊 Summary

| Kategori | Jumlah Fitur |
|---|---|
| Core Game | 10 |
| Player Management | 8 |
| UI/UX | 7 |
| Authentication & Session | 4 |
| Internationalization | 2 |
| PWA | 2 |
| Host Features | 5 |
| Technical | 7 |
| Audio & Media | 2 |
| Safety & Error Handling | 5 |
| **TOTAL** | **52 Fitur** |

---

## 🎯 Fitur Unggulan (Top 10)

1. **Multiplayer Real-time** — Main bareng teman secara real-time
2. **Memory Card Mini Game** — Selingan game memory card
3. **QR Code Join** — Scan QR langsung join
4. **Synchronized Timer** — Timer sinkron di semua device
5. **Google OAuth** — Login dengan Google
6. **Multi-language** — Support 4 bahasa
7. **PWA** — Install sebagai app
8. **Kick Player** — Host bisa kick player
9. **Reconnect** — Player bisa rejoin
10. **Real-time Leaderboard** — Ranking update real-time

---

## 🚀 Fitur yang Bisa Ditambahkan (Ideas)

1. **Voice Chat** — Voice chat antar player
2. **Custom Quiz** — Player bisa buat quiz sendiri
3. **Team Mode** — Main dalam tim
4. **Power-ups** — Item power-up dalam game
5. **Achievement System** — Badge & achievement
6. **History** — Riwayat game yang pernah dimainkan
7. **Friend System** — Add friend & invite
8. **Private Room** — Room dengan password
9. **Spectator Mode** — Nonton game tanpa ikut main
10. **Replay** — Replay game yang sudah selesai
