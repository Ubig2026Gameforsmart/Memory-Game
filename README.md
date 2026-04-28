    # Memory Quiz

Platform kuis multiplayer berbasis web dengan tema retro pixel art. Host bisa membuat room, player bergabung lewat kode atau QR, lalu bermain kuis bersama secara real-time — diselingi mini game memory card.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database & Auth | Supabase (PostgreSQL + Realtime) |
| UI | Tailwind CSS + Radix UI (shadcn/ui) |
| State Sync | Supabase Realtime + BroadcastChannel API |
| i18n | i18next (EN, ID, AR, ZH) |
| PWA | next-pwa |
| Deployment | Vercel |

---

## Alur Game

```
Host pilih quiz → Buat room → Lobby (share kode/QR)
                                    ↓
                          Player join via kode/QR/link
                                    ↓
                          Countdown 10 detik
                                    ↓
                          Quiz dimulai (timer berjalan)
                                    ↓
                    Setiap 3 jawaban benar → Memory Card Game
                                    ↓
                          Quiz selesai / timer habis
                                    ↓
                    Host → Leaderboard | Player → Result
```

---

## Struktur Folder

```
app/                    # Halaman Next.js (App Router)
  page.tsx              # Home — pilih Host atau Join
  login/                # Login dengan Google OAuth
  select-quiz/          # Host memilih quiz dari Supabase
  quiz-settings/        # Host mengatur jumlah soal & waktu
  host/[roomCode]/
    lobby/              # Host menunggu player, share kode/QR
    monitor/            # Host memantau progress player
    leaderboard/        # Hasil akhir untuk host
  join/                 # Player memasukkan kode room & nickname
  waiting-room/[roomCode]/  # Player menunggu game dimulai
  quiz/[roomCode]/      # Halaman kuis utama (player)
  game/[roomCode]/
    countdown/          # Countdown sebelum game
    memory-challenge/   # Mini game memory card
  result/               # Hasil akhir untuk player
  api/                  # API Routes (webhook, heartbeat, dll)

components/             # Komponen reusable
  ui/                   # Komponen shadcn/ui (button, card, dll)
  countdown-timer.tsx   # Timer countdown sinkron
  memory-game.tsx       # Mini game memory card
  avatar-selector.tsx   # Pilih avatar
  qr-scanner.tsx        # Scan QR code
  auth-guard.tsx        # Proteksi halaman yang butuh login

hooks/                  # Custom React hooks
  use-room.ts           # Subscribe real-time data room
  use-auth.ts           # State autentikasi user
  use-synchronized-timer.ts  # Timer sinkron antar device

lib/                    # Logic & utilitas
  supabase.ts           # Supabase client + Quiz API
  supabase-room-manager.ts   # CRUD room, player, skor
  supabase-session-manager.ts # Manajemen sesi host/player
  room-manager.ts       # Wrapper backward-compatible
  quiz-data.ts          # Tipe data quiz lokal (fallback)
  score-update-queue.ts # Queue update skor (anti race condition)

locale/                 # File terjemahan (en, id, ar, zh)
public/                 # Aset statis (avatar, audio, gambar)
```

---

## Setup Lokal

### 1. Clone & Install

```bash
git clone <repo-url>
cd <nama-folder>
npm install
```

### 2. Konfigurasi Environment

Salin file contoh dan isi dengan kredensial Supabase kamu:

```bash
cp env.example.txt .env.local
```

Isi `.env.local`:

```env
# Supabase utama (room, quiz, auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase kedua (data player/participants)
NEXT_PUBLIC_SUPABASE_PLAYERS_URL=https://your-second-project.supabase.co
NEXT_PUBLIC_SUPABASE_PLAYERS_ANON_KEY=your-second-anon-key

# URL site untuk OAuth redirect (production)
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

> Lihat `env.example.txt` untuk panduan lengkap cara mendapatkan nilai-nilai ini.

### 3. Jalankan Dev Server

```bash
npm run dev
```

Buka [http://localhost:3002](http://localhost:3002)

---

## Supabase Setup

Project ini menggunakan **2 project Supabase**:

| Project | Kegunaan |
|---|---|
| Supabase Utama | Data room, quiz, autentikasi Google OAuth |
| Supabase Players | Data participants/player per sesi game |

### Tabel yang dibutuhkan di Supabase Utama:

- `quizzes` — menyimpan data quiz (title, questions, category, is_public)
- `rooms` — menyimpan state room game secara real-time
- `profiles` — profil user yang login via Google

### Google OAuth

1. Buat project di [Google Cloud Console](https://console.developers.google.com/)
2. Enable Google+ API
3. Buat OAuth 2.0 Client ID (Web application)
4. Tambahkan redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Di Supabase Dashboard → Authentication → Providers → Google: masukkan Client ID & Secret

---

## Fitur Utama

- **Multiplayer real-time** — sinkronisasi state via Supabase Realtime
- **QR Code join** — player bisa scan QR untuk langsung masuk room
- **Memory Card Mini Game** — muncul setiap 3 jawaban benar
- **Timer sinkron** — timer berjalan sama di semua device
- **Multi-bahasa** — EN, ID, AR, ZH
- **PWA** — bisa di-install di HP
- **Google Login** — autentikasi via Google OAuth
- **Kick player** — host bisa keluarkan player dari lobby
- **Reconnect** — player bisa rejoin jika koneksi terputus

---

## Scripts

```bash
npm run dev      # Development server (port 3002)
npm run build    # Build production
npm run start    # Jalankan production build (port 3002)
npm run lint     # Cek linting
```

---

## Hal Penting untuk Penerus

### Dua Supabase Project
Project ini sengaja menggunakan 2 project Supabase terpisah. Jangan hapus salah satunya — keduanya dibutuhkan.

### Real-time Sync
State game disinkronkan via Supabase Realtime subscription (di `hooks/use-room.ts`) dan `BroadcastChannel` API untuk komunikasi antar tab di browser yang sama.

### Score Update Queue
Ada mekanisme antrian update skor di `lib/score-update-queue.ts` untuk mencegah race condition saat banyak player update skor bersamaan.

### Session Management
Sesi host dan player disimpan di Supabase (`lib/supabase-session-manager.ts`) dengan fallback ke `localStorage`. Ini penting untuk fitur reconnect.

### Quiz Data
Quiz diambil dari tabel `quizzes` di Supabase. `lib/quiz-data.ts` hanya berisi tipe data dan array kosong sebagai fallback.

### Deployment
Project ini di-deploy di Vercel. Pastikan semua environment variable sudah diset di Vercel Dashboard sebelum deploy.
