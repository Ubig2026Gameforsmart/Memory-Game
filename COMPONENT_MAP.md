# Peta Komponen & Lokasi Kode

Dokumentasi ini menjelaskan **komponen UI utama** ada di file mana dan baris berapa. Berguna untuk debugging atau modifikasi cepat.

---

## 🏠 Halaman Home (`app/page.tsx`)

| Komponen | Lokasi | Deskripsi |
|---|---|---|
| Logo GameForSmart | Line 180-192 | Logo di kiri atas |
| Menu hamburger | Line 195-220 | Menu dropdown kanan atas (language, fullscreen, logout) |
| Logo Memory Quiz | Line 330-345 | Logo besar di tengah dengan animasi bounce |
| Deskripsi game | Line 348-360 | Teks "TEST YOUR MEMORY!" |
| Tombol HOST | Line 364-380 | Tombol hijau untuk host game |
| Tombol JOIN | Line 382-398 | Tombol biru untuk join game |
| Floating pixel cards | Line 550-650 | Kartu memory yang jatuh di background |
| PWA Install prompt | Line 450-490 | Banner install app (muncul jika belum install) |

---

## 🎮 Join Room (`app/join/page.tsx`)

| Komponen | Lokasi | Deskripsi |
|---|---|---|
| Logo GameForSmart | Line 580-590 | Logo kanan atas |
| Logo Memory Quiz | Line 600-615 | Logo kiri atas dengan tombol back |
| Input Nickname | Line 650-670 | Field untuk masukkan nickname |
| Input Room Code | Line 680-720 | Field 6 digit room code dengan tombol SCAN |
| Tombol Scan QR | Line 690-700 | Tombol kamera untuk scan QR code |
| Avatar Selector | Line 740-755 | Grid avatar untuk dipilih |
| Tombol JOIN ROOM | Line 760-775 | Tombol hijau submit join |
| QR Scanner Modal | Line 780-790 | Modal kamera untuk scan QR (muncul saat klik SCAN) |
| Auto-join screen | Line 520-560 | Loading screen saat join via link/QR |

---

## 🏛️ Host Lobby (`app/host/[roomCode]/lobby/page.tsx`)

| Komponen | Lokasi | Deskripsi |
|---|---|---|
| Logo Memory Quiz | Line 620-635 | Logo kiri atas dengan tombol back |
| Logo GameForSmart | Line 640-650 | Logo kanan atas |
| Badge Time Limit | Line 670-680 | Badge biru menampilkan waktu total |
| Badge Question Count | Line 685-695 | Badge hijau menampilkan jumlah soal |
| Room Code Display | Line 700-730 | Kode room besar dengan tombol copy |
| QR Code | Line 740-780 | QR code untuk join + link dengan tombol copy |
| Tombol Enlarge QR | Line 750-760 | Tombol maximize QR code |
| Player Grid | Line 800-900 | Grid player yang sudah join (20 per halaman) |
| Tombol Kick Player | Line 850-860 | Tombol X merah di setiap player card |
| Pagination | Line 910-930 | Tombol prev/next untuk navigasi player |
| Tombol START GAME | Line 940-960 | Tombol hijau besar untuk mulai game |
| QR Modal Fullscreen | Line 970-1020 | Modal QR code ukuran besar |
| Leave Dialog | Line 1030-1070 | Dialog konfirmasi keluar room |
| Kick Dialog | Line 1075-1082 | Dialog konfirmasi kick player |

---

## 🪑 Waiting Room (`app/waiting-room/[roomCode]/page.tsx`)

| Komponen | Lokasi | Deskripsi |
|---|---|---|
| Logo Memory Quiz | Line 580-595 | Logo kiri atas |
| Logo GameForSmart | Line 600-610 | Logo kanan atas |
| Tombol Leave Room | Line 650-670 | Tombol merah kiri atas untuk keluar |
| Room Code Badge | Line 680-695 | Badge menampilkan kode room |
| Player Count Badge | Line 700-715 | Badge menampilkan jumlah player |
| Player Grid | Line 730-850 | Grid semua player yang join (virtualized) |
| "New Player Joined" Banner | Line 620-645 | Banner hijau animasi bounce saat ada player baru |
| Leave Dialog | Line 860-900 | Dialog konfirmasi keluar room |

---

## 📝 Quiz Page (`app/quiz/[roomCode]/page.tsx`)

| Komponen | Lokasi | Deskripsi |
|---|---|---|
| Timer Display | Line 450-470 | Timer countdown di atas |
| Progress Bar | Line 480-495 | Bar progress soal (X dari Y) |
| Question Card | Line 500-550 | Card soal dengan gambar (jika ada) |
| Tombol Zoom Image | Line 520-530 | Tombol maximize gambar soal |
| Option Buttons | Line 560-620 | 4 tombol pilihan jawaban (A, B, C, D) |
| Score Display | Line 630-645 | Skor saat ini di pojok |
| Correct/Wrong Indicator | Line 650-680 | Animasi centang hijau / silang merah |
| Image Zoom Modal | Line 690-720 | Modal fullscreen untuk gambar soal |
| Time Warning | Line 730-750 | Banner merah "TIME RUNNING OUT!" |

---

## 🧠 Memory Game (`app/game/[roomCode]/memory-challenge/page.tsx`)

| Komponen | Lokasi | Deskripsi |
|---|---|---|
| Timer Display | Line 180-195 | Timer countdown |
| Matches Counter | Line 200-215 | Jumlah pasangan yang sudah cocok |
| Memory Card Grid | Line 230-350 | Grid 12 kartu (6 pasang) |
| Single Card | Line 260-290 | Kartu individual dengan flip animation |
| Success Banner | Line 360-380 | Banner hijau "ALL MATCHED!" |
| Continue Button | Line 390-410 | Tombol lanjut ke quiz setelah selesai |

---

## 🏆 Result Page (`app/result/page.tsx`)

| Komponen | Lokasi | Deskripsi |
|---|---|---|
| Logo Memory Quiz | Line 280-290 | Logo kiri atas di card |
| Logo GameForSmart | Line 295-305 | Logo kanan atas di card |
| Player Avatar | Line 320-345 | Avatar player dengan border glow |
| Player Nickname | Line 350-360 | Nama player |
| Rank Display | Line 365-380 | Emoji medali + teks ranking (1st, 2nd, 3rd, dll) |
| Score Display | Line 385-400 | Skor total dengan background gradient |
| Tombol Back to Home | Line 410-425 | Tombol biru kembali ke home |

---

## 🎯 Host Leaderboard (`app/host/leaderboard/page.tsx`)

| Komponen | Lokasi | Deskripsi |
|---|---|---|
| Logo Memory Quiz | Line 150-160 | Logo di header |
| Logo GameForSmart | Line 165-175 | Logo kanan atas |
| Podium Top 3 | Line 200-350 | Podium 3D untuk juara 1, 2, 3 |
| Player List | Line 360-480 | List semua player dengan ranking |
| Player Card | Line 390-420 | Card individual player (avatar, nama, skor) |
| Tombol Close Room | Line 490-510 | Tombol merah tutup room |
| Tombol New Game | Line 515-535 | Tombol hijau buat game baru |

---

## 🔧 Komponen Reusable

### Avatar Selector (`components/avatar-selector.tsx`)

| Komponen | Lokasi | Deskripsi |
|---|---|---|
| Avatar Grid | Line 80-150 | Grid 16 avatar lokal + Google avatar |
| Google Avatar Card | Line 90-110 | Card khusus untuk avatar Google (jika login) |
| Local Avatar Card | Line 115-140 | Card avatar lokal (ava1.webp - ava16.webp) |

### QR Scanner (`components/qr-scanner.tsx`)

| Komponen | Lokasi | Deskripsi |
|---|---|---|
| Camera View | Line 120-150 | Preview kamera untuk scan |
| Close Button | Line 100-110 | Tombol X tutup scanner |
| Scan Result Handler | Line 160-180 | Logic handle hasil scan |

### Countdown Timer (`components/countdown-timer.tsx`)

| Komponen | Lokasi | Deskripsi |
|---|---|---|
| Countdown Number | Line 150-180 | Angka countdown besar di tengah |
| Background Animation | Line 120-140 | Animasi pixel background |
| Sound Effect | Line 190-210 | Trigger sound saat countdown |

### User Profile (`components/user-profile.tsx`)

| Komponen | Lokasi | Deskripsi |
|---|---|---|
| Avatar Circle | Line 50-70 | Avatar user di kanan atas |
| Nickname Display | Line 75-85 | Nama user di samping avatar |
| Dropdown Menu | Line 90-120 | Menu logout saat diklik |

---

## 🎨 Styling & Animasi

### Global Styles (`app/globals.css`)

| Class | Lokasi | Deskripsi |
|---|---|---|
| `.pixel-grid` | Line 50-70 | Background grid pixel |
| `.scanlines` | Line 75-95 | Efek scanline retro |
| `.pixel-font` | Line 100-110 | Font pixel art |
| `.pixel-button-shadow` | Line 120-135 | Shadow 3D untuk tombol |
| `.pixel-card-shadow` | Line 140-155 | Shadow untuk card |
| `.animate-float` | Line 200-215 | Animasi floating element |
| `.animate-bounce` | Line 220-235 | Animasi bounce |
| `.room-code-input` | Line 300-320 | Style khusus input room code |

---

## 📦 Library & Hooks

### Room Hook (`hooks/use-room.ts`)

| Function | Lokasi | Deskripsi |
|---|---|---|
| `useRoom` | Line 20-150 | Hook subscribe real-time room data |
| Subscribe handler | Line 60-90 | Handle update dari Supabase Realtime |
| Cleanup | Line 130-145 | Unsubscribe saat unmount |

### Auth Hook (`hooks/use-auth.ts`)

| Function | Lokasi | Deskripsi |
|---|---|---|
| `useAuth` | Line 30-180 | Hook state autentikasi |
| `logout` | Line 100-120 | Function logout + clear session |
| `showLogoutDialog` | Line 125-135 | Show dialog konfirmasi logout |

### Timer Hook (`hooks/use-synchronized-timer.ts`)

| Function | Lokasi | Deskripsi |
|---|---|---|
| `useSynchronizedTimer` | Line 25-200 | Hook timer sinkron dengan server |
| Calculate remaining | Line 80-110 | Hitung sisa waktu dari server time |
| Handle time up | Line 150-170 | Callback saat waktu habis |

---

## 🗄️ Data Management

### Room Manager (`lib/supabase-room-manager.ts`)

| Function | Lokasi | Deskripsi |
|---|---|---|
| `createRoom` | Line 50-120 | Buat room baru di Supabase |
| `joinRoom` | Line 130-200 | Player join room |
| `kickPlayer` | Line 210-250 | Host kick player |
| `updatePlayerScore` | Line 260-310 | Update skor player |
| `startCountdown` | Line 320-360 | Mulai countdown |
| `startGame` | Line 370-410 | Mulai game |
| `deleteRoom` | Line 420-450 | Hapus room |
| `subscribe` | Line 460-520 | Subscribe real-time updates |

### Session Manager (`lib/supabase-session-manager.ts`)

| Function | Lokasi | Deskripsi |
|---|---|---|
| `getOrCreateSession` | Line 40-110 | Buat/ambil session |
| `getSessionData` | Line 120-160 | Ambil data session |
| `clearSession` | Line 170-200 | Hapus session |
| `getSessionIdFromStorage` | Line 210-230 | Ambil session ID dari localStorage |

### Quiz API (`lib/supabase.ts`)

| Function | Lokasi | Deskripsi |
|---|---|---|
| `getQuizzes` | Line 80-130 | Ambil semua quiz public |
| `getQuizById` | Line 140-170 | Ambil quiz by ID |
| `searchQuizzes` | Line 180-220 | Search quiz by keyword |
| `getQuizzesPaginated` | Line 230-310 | Ambil quiz dengan pagination |

---

## 🎯 Tips untuk Penerus

### Cara Cepat Cari Komponen

1. **Cari berdasarkan teks yang terlihat**
   ```bash
   # Contoh: cari tombol "START GAME"
   grep -r "START GAME" app/
   ```

2. **Cari berdasarkan class CSS**
   ```bash
   # Contoh: cari semua yang pakai class pixel-button
   grep -r "pixel-button" app/
   ```

3. **Cari berdasarkan icon Lucide**
   ```bash
   # Contoh: cari semua yang pakai icon Users
   grep -r "Users" app/ | grep "lucide"
   ```

### Modifikasi Styling

- Semua warna gradient ada di `app/globals.css`
- Animasi custom ada di `tailwind.config.ts`
- Shadow & border style ada di class `.pixel-*` di `globals.css`

### Debugging Real-time

- Buka console browser, cari log dengan prefix `[RoomManager]`, `[Quiz]`, `[WaitingRoom]`, dll
- Supabase Realtime logs ada di Supabase Dashboard → Database → Realtime
- BroadcastChannel messages bisa di-log dengan `console.log` di event listener

### Testing Multi-device

1. Buka 2 browser berbeda (Chrome + Firefox)
2. Satu jadi Host, satu jadi Player
3. Atau buka Incognito mode untuk simulasi device kedua
