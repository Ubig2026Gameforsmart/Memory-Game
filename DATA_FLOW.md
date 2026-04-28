# Alur Data & State Management

Dokumentasi ini menjelaskan **bagaimana data mengalir** di aplikasi Memory Quiz — dari user action sampai update UI.

---

## 🔄 Arsitektur Data

```
User Action → Component → Hook → Manager → Supabase → Realtime → Hook → Component → UI Update
```

### Layer-layer:

1. **Component** — UI React yang user lihat
2. **Hook** — Custom hooks untuk state management (`use-room`, `use-auth`, dll)
3. **Manager** — Business logic (`room-manager`, `session-manager`, dll)
4. **Supabase** — Database + Realtime subscription
5. **Realtime** — Push update ke semua client yang subscribe

---

## 🏠 Flow: Host Membuat Room

### 1. User Action
```
Host klik "HOST" di home → Pilih quiz → Set settings → Klik "CREATE ROOM"
```

### 2. Code Flow

**File: `app/quiz-settings/page.tsx`**
```typescript
// Line 180-220
const handleCreateRoom = async () => {
  // 1. Generate room code
  const roomCode = roomManager.generateRoomCode() // "ABC123"
  
  // 2. Create room di Supabase
  const room = await roomManager.createRoom(
    hostId,
    { questionCount: 10, totalTimeLimit: 30 },
    quizId,
    quizTitle
  )
  
  // 3. Save session
  await sessionManager.getOrCreateSession('host', {
    hostId, roomCode, quizId
  }, roomCode)
  
  // 4. Redirect ke lobby
  router.push(`/host/${roomCode}/lobby`)
}
```

**File: `lib/supabase-room-manager.ts`**
```typescript
// Line 50-120
async createRoom(hostId, settings, quizId, quizTitle) {
  // Insert ke tabel 'rooms'
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      code: roomCode,
      host_id: hostId,
      settings: settings,
      quiz_id: quizId,
      quiz_title: quizTitle,
      status: 'waiting',
      players: []
    })
    .select()
    .single()
  
  return data
}
```

### 3. Data di Supabase

**Tabel: `rooms`**
```json
{
  "code": "ABC123",
  "host_id": "host_xyz",
  "settings": {
    "questionCount": 10,
    "totalTimeLimit": 30
  },
  "quiz_id": "math-basic",
  "quiz_title": "Basic Math",
  "status": "waiting",
  "players": [],
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

## 🚪 Flow: Player Join Room

### 1. User Action
```
Player masukkan room code "ABC123" + nickname → Pilih avatar → Klik "JOIN ROOM"
```

### 2. Code Flow

**File: `app/join/page.tsx`**
```typescript
// Line 400-500
const handleJoinRoom = async () => {
  // 1. Validasi room exists
  const room = await roomManager.getRoom(roomCode)
  if (!room) {
    setRoomError("Room not found")
    return
  }
  
  // 2. Join room
  const success = await roomManager.joinRoom(roomCode, {
    nickname: nickname,
    avatar: selectedAvatar
  })
  
  // 3. Save session
  await sessionManager.getOrCreateSession('player', {
    id: playerId,
    nickname: nickname,
    avatar: selectedAvatar,
    roomCode: roomCode
  }, roomCode)
  
  // 4. Redirect ke waiting room
  router.push(`/waiting-room/${roomCode}`)
}
```

**File: `lib/supabase-room-manager.ts`**
```typescript
// Line 130-200
async joinRoom(roomCode, player) {
  // 1. Get current room
  const room = await this.getRoom(roomCode)
  
  // 2. Add player ke array
  const newPlayer = {
    id: generateId(),
    nickname: player.nickname,
    avatar: player.avatar,
    joinedAt: new Date().toISOString(),
    isReady: false,
    isHost: false,
    quizScore: 0
  }
  
  // 3. Update room di Supabase
  await supabase
    .from('rooms')
    .update({
      players: [...room.players, newPlayer]
    })
    .eq('code', roomCode)
  
  return true
}
```

### 3. Real-time Update

**Semua client yang subscribe ke room ini akan dapat update otomatis:**

**File: `hooks/use-room.ts`**
```typescript
// Line 60-90
useEffect(() => {
  const subscription = supabase
    .channel(`room:${roomCode}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'rooms',
      filter: `code=eq.${roomCode}`
    }, (payload) => {
      // Update state dengan data baru
      setRoom(payload.new)
    })
    .subscribe()
  
  return () => {
    subscription.unsubscribe()
  }
}, [roomCode])
```

### 4. UI Update

**Host Lobby (`app/host/[roomCode]/lobby/page.tsx`)**
```typescript
// Line 800-900
// Otomatis re-render karena room state berubah
{room.players.map(player => (
  <PlayerCard key={player.id} player={player} />
))}
```

**Waiting Room (`app/waiting-room/[roomCode]/page.tsx`)**
```typescript
// Line 730-850
// Player count badge update otomatis
<Badge>{room.players.length} PLAYERS</Badge>
```

---

## ⏱️ Flow: Host Start Game (Countdown)

### 1. User Action
```
Host klik "START GAME" di lobby
```

### 2. Code Flow

**File: `app/host/[roomCode]/lobby/page.tsx`**
```typescript
// Line 940-980
const startGame = async () => {
  // 1. Start countdown di Supabase
  await roomManager.startCountdown(roomCode, hostId, 10)
  
  // 2. Update local state immediately (optimistic update)
  setGameStarted(true)
  
  // 3. Broadcast via BroadcastChannel (same browser tabs)
  const channel = new BroadcastChannel(`countdown-${roomCode}`)
  channel.postMessage({
    type: 'countdown-started',
    countdownStartTime: new Date().toISOString(),
    countdownDuration: 10
  })
}
```

**File: `lib/supabase-room-manager.ts`**
```typescript
// Line 320-360
async startCountdown(roomCode, hostId, duration) {
  const countdownStartTime = new Date().toISOString()
  
  await supabase
    .from('rooms')
    .update({
      status: 'countdown',
      countdown_start_time: countdownStartTime,
      countdown_duration: duration
    })
    .eq('code', roomCode)
    .eq('host_id', hostId)
  
  return true
}
```

### 3. Multi-channel Sync

**A. Supabase Realtime (cross-device)**
```typescript
// Semua device yang subscribe dapat update
// Delay: ~500ms - 2s
```

**B. BroadcastChannel (same browser)**
```typescript
// Tabs di browser yang sama dapat update instant
// Delay: ~10ms
```

**File: `app/waiting-room/[roomCode]/page.tsx`**
```typescript
// Line 200-250
useEffect(() => {
  // Listen BroadcastChannel
  const channel = new BroadcastChannel(`countdown-${roomCode}`)
  channel.onmessage = (event) => {
    if (event.data.type === 'countdown-started') {
      setForceCountdown(true) // Trigger countdown UI
    }
  }
  
  return () => channel.close()
}, [roomCode])
```

### 4. Countdown Component

**File: `components/countdown-timer.tsx`**
```typescript
// Line 50-150
const CountdownTimer = ({ room, onCountdownComplete }) => {
  const [count, setCount] = useState(10)
  
  useEffect(() => {
    // Calculate dari server time
    const startTime = new Date(room.countdownStartTime).getTime()
    const now = Date.now()
    const elapsed = (now - startTime) / 1000
    const remaining = Math.max(0, room.countdownDuration - elapsed)
    
    setCount(Math.ceil(remaining))
    
    // Countdown interval
    const interval = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onCountdownComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [room])
  
  return <div className="countdown-number">{count}</div>
}
```

---

## 📝 Flow: Player Jawab Soal

### 1. User Action
```
Player klik salah satu pilihan jawaban
```

### 2. Code Flow

**File: `app/quiz/[roomCode]/page.tsx`**
```typescript
// Line 560-620
const handleAnswerSelect = async (optionIndex) => {
  // 1. Check jawaban benar/salah
  const isCorrect = optionIndex === questions[currentQuestion].correct
  
  // 2. Update local state
  if (isCorrect) {
    setScore(prev => prev + 100)
    setCorrectAnswers(prev => prev + 1)
  }
  setQuestionsAnswered(prev => prev + 1)
  
  // 3. Queue update ke Supabase (anti race condition)
  scoreUpdateQueue.enqueue({
    roomCode,
    playerId,
    quizScore: score + (isCorrect ? 100 : 0),
    questionsAnswered: questionsAnswered + 1,
    correctAnswers: correctAnswers + (isCorrect ? 1 : 0)
  })
  
  // 4. Check apakah perlu memory game
  if (correctAnswers + 1 === 3 || correctAnswers + 1 === 6) {
    // Save progress
    localStorage.setItem(`quiz-progress-${roomCode}`, JSON.stringify({
      currentQuestion,
      score,
      correctAnswers: correctAnswers + 1,
      questionsAnswered: questionsAnswered + 1
    }))
    
    // Redirect ke memory game
    router.push(`/game/${roomCode}/memory-challenge`)
  } else {
    // Next question
    setCurrentQuestion(prev => prev + 1)
  }
}
```

**File: `lib/score-update-queue.ts`**
```typescript
// Line 30-80
class ScoreUpdateQueue {
  private queue: UpdateTask[] = []
  private processing = false
  
  enqueue(task: UpdateTask) {
    this.queue.push(task)
    this.processQueue()
  }
  
  async processQueue() {
    if (this.processing) return
    this.processing = true
    
    while (this.queue.length > 0) {
      const task = this.queue.shift()
      
      // Update ke Supabase
      await roomManager.updatePlayerScore(
        task.roomCode,
        task.playerId,
        task.quizScore,
        task.questionsAnswered,
        task.currentQuestion,
        task.correctAnswers
      )
      
      // Delay 100ms untuk avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    this.processing = false
  }
}
```

### 3. Update di Supabase

**File: `lib/supabase-room-manager.ts`**
```typescript
// Line 260-310
async updatePlayerScore(roomCode, playerId, quizScore, questionsAnswered) {
  // 1. Get current room
  const room = await this.getRoom(roomCode)
  
  // 2. Update player di array
  const updatedPlayers = room.players.map(p => {
    if (p.id === playerId) {
      return {
        ...p,
        quizScore: quizScore,
        questionsAnswered: questionsAnswered
      }
    }
    return p
  })
  
  // 3. Update room
  await supabase
    .from('rooms')
    .update({ players: updatedPlayers })
    .eq('code', roomCode)
  
  return true
}
```

### 4. Real-time Sync ke Host Monitor

**File: `app/host/[roomCode]/monitor/page.tsx`**
```typescript
// Otomatis update karena subscribe via use-room hook
// Host bisa lihat progress semua player real-time
{room.players.map(player => (
  <div>
    <span>{player.nickname}</span>
    <span>{player.quizScore} pts</span>
    <Progress value={player.questionsAnswered / totalQuestions * 100} />
  </div>
))}
```

---

## 🧠 Flow: Memory Game

### 1. Trigger
```
Player jawab benar 3 soal → Redirect ke memory game
```

### 2. Save Progress

**File: `app/quiz/[roomCode]/page.tsx`**
```typescript
// Line 650-680
// Sebelum redirect, save progress ke localStorage
localStorage.setItem(`quiz-progress-${roomCode}`, JSON.stringify({
  currentQuestion: currentQuestion,
  score: score,
  correctAnswers: correctAnswers,
  questionsAnswered: questionsAnswered
}))

// Redirect
router.push(`/game/${roomCode}/memory-challenge`)
```

### 3. Memory Game Logic

**File: `app/game/[roomCode]/memory-challenge/page.tsx`**
```typescript
// Line 230-350
const handleCardClick = (index) => {
  // 1. Flip card
  const newCards = [...cards]
  newCards[index].isFlipped = true
  setCards(newCards)
  
  // 2. Check match
  const flippedCards = newCards.filter(c => c.isFlipped && !c.isMatched)
  
  if (flippedCards.length === 2) {
    if (flippedCards[0].pairId === flippedCards[1].pairId) {
      // Match! Mark as matched
      setTimeout(() => {
        const matched = newCards.map(c => {
          if (c.pairId === flippedCards[0].pairId) {
            return { ...c, isMatched: true }
          }
          return c
        })
        setCards(matched)
        setMatchCount(prev => prev + 1)
      }, 500)
    } else {
      // No match, flip back
      setTimeout(() => {
        const flipped = newCards.map(c => {
          if (!c.isMatched) {
            return { ...c, isFlipped: false }
          }
          return c
        })
        setCards(flipped)
      }, 1000)
    }
  }
}
```

### 4. Return to Quiz

**File: `app/game/[roomCode]/memory-challenge/page.tsx`**
```typescript
// Line 400-450
const handleContinue = () => {
  // 1. Mark memory game as completed
  localStorage.setItem(`memory-return-${roomCode}`, JSON.stringify({
    completed: true,
    resumeQuestion: currentQuestion + 1
  }))
  
  // 2. Clear memory game state
  localStorage.removeItem(`memory-cards-state-${roomCode}`)
  
  // 3. Return to quiz
  router.push(`/quiz/${roomCode}`)
}
```

**File: `app/quiz/[roomCode]/page.tsx`**
```typescript
// Line 150-200
useEffect(() => {
  // Check if returning from memory game
  const memoryReturn = localStorage.getItem(`memory-return-${roomCode}`)
  
  if (memoryReturn) {
    const data = JSON.parse(memoryReturn)
    
    // Restore progress
    setCurrentQuestion(data.resumeQuestion)
    
    // Clean up
    localStorage.removeItem(`memory-return-${roomCode}`)
  }
}, [roomCode])
```

---

## ⏰ Flow: Timer Habis

### 1. Timer Sync

**File: `hooks/use-synchronized-timer.ts`**
```typescript
// Line 80-110
const calculateRemaining = () => {
  if (!room?.startedAt || !room?.settings?.totalTimeLimit) return 0
  
  const startTime = new Date(room.startedAt).getTime()
  const now = Date.now()
  const elapsed = (now - startTime) / 1000
  const totalTime = room.settings.totalTimeLimit * 60
  
  return Math.max(0, totalTime - elapsed)
}
```

### 2. Time Up Handler

**File: `app/quiz/[roomCode]/page.tsx`**
```typescript
// Line 450-500
const handleTimeUp = async () => {
  // 1. Flush pending score updates
  await scoreUpdateQueue.flushNow()
  
  // 2. Only HOST updates game status
  if (isHost) {
    await roomManager.updateGameStatus(roomCode, "finished")
    
    // Broadcast to all players
    const channel = new BroadcastChannel(`game-end-${roomCode}`)
    channel.postMessage({ type: 'game-ended' })
    
    // Redirect host to leaderboard
    window.location.href = `/host/leaderboard?roomCode=${roomCode}`
  } else {
    // Player redirect to result
    window.location.href = `/result?roomCode=${roomCode}`
  }
}
```

### 3. Player Listen Game End

**File: `app/quiz/[roomCode]/page.tsx`**
```typescript
// Line 520-560
useEffect(() => {
  // Listen for game end broadcast
  const channel = new BroadcastChannel(`game-end-${roomCode}`)
  
  channel.onmessage = (event) => {
    if (event.data.type === 'game-ended') {
      window.location.href = `/result?roomCode=${roomCode}`
    }
  }
  
  return () => channel.close()
}, [roomCode])
```

---

## 🏆 Flow: Show Results

### 1. Host Leaderboard

**File: `app/host/leaderboard/page.tsx`**
```typescript
// Line 100-150
useEffect(() => {
  const fetchResults = async () => {
    const room = await roomManager.getRoom(roomCode)
    
    // Sort players by score
    const sorted = [...room.players].sort((a, b) => 
      (b.quizScore || 0) - (a.quizScore || 0)
    )
    
    setPlayers(sorted)
  }
  
  fetchResults()
}, [roomCode])
```

### 2. Player Result

**File: `app/result/page.tsx`**
```typescript
// Line 80-150
useEffect(() => {
  const fetchResult = async () => {
    const room = await roomManager.getRoom(roomCode)
    
    // Get current player from session
    const sessionId = sessionManager.getSessionIdFromStorage()
    const sessionData = await sessionManager.getSessionData(sessionId)
    const player = sessionData.user_data
    
    // Find player rank
    const sorted = [...room.players].sort((a, b) => 
      (b.quizScore || 0) - (a.quizScore || 0)
    )
    
    const rank = sorted.findIndex(p => p.id === player.id) + 1
    
    setPlayerRanking({
      rank: rank,
      totalScore: player.quizScore || 0,
      player: player
    })
  }
  
  fetchResult()
}, [roomCode])
```

---

## 🔐 Session Management

### Save Session

**File: `lib/supabase-session-manager.ts`**
```typescript
// Line 40-110
async getOrCreateSession(userType, userData, roomCode) {
  // 1. Generate session ID
  const sessionId = `${userType}_${Date.now()}_${Math.random()}`
  
  // 2. Save to Supabase
  await supabase
    .from('sessions')
    .insert({
      session_id: sessionId,
      user_type: userType,
      user_data: userData,
      room_code: roomCode,
      created_at: new Date().toISOString()
    })
  
  // 3. Save to localStorage (backup)
  localStorage.setItem('kiro_session_id', sessionId)
  
  return { sessionId }
}
```

### Restore Session

**File: `app/waiting-room/[roomCode]/page.tsx`**
```typescript
// Line 50-120
useEffect(() => {
  const restoreSession = async () => {
    // 1. Get session ID from localStorage
    const sessionId = sessionManager.getSessionIdFromStorage()
    
    // 2. Fetch session data from Supabase
    const sessionData = await sessionManager.getSessionData(sessionId)
    
    // 3. Restore player info
    if (sessionData && sessionData.user_type === 'player') {
      setPlayerInfo({
        nickname: sessionData.user_data.nickname,
        avatar: sessionData.user_data.avatar,
        playerId: sessionData.user_data.id
      })
    }
  }
  
  restoreSession()
}, [])
```

---

## 🚨 Error Handling & Edge Cases

### 1. Player Kicked

**Detection:**
```typescript
// File: app/waiting-room/[roomCode]/page.tsx
// Line 300-350

// Method A: BroadcastChannel (same browser)
const kickChannel = new BroadcastChannel(`kick-${roomCode}`)
kickChannel.onmessage = (event) => {
  if (event.data.playerId === playerInfo.playerId) {
    // Redirect to home
    window.location.href = "/?message=kicked"
  }
}

// Method B: Realtime subscription (cross-device)
useEffect(() => {
  if (!room.players.some(p => p.id === playerInfo.playerId)) {
    // Player not in list anymore = kicked
    window.location.href = "/?message=kicked"
  }
}, [room.players])
```

### 2. Host Left

**Detection:**
```typescript
// File: app/waiting-room/[roomCode]/page.tsx
// Line 400-450

// Method A: BroadcastChannel
const hostLeftChannel = new BroadcastChannel(`host-left-${roomCode}`)
hostLeftChannel.onmessage = (event) => {
  if (event.data.type === 'host-left') {
    window.location.href = "/join?message=host-left"
  }
}

// Method B: Polling (cross-device)
const checkRoomExists = async () => {
  const room = await roomManager.getRoom(roomCode)
  if (!room) {
    // Room deleted = host left
    window.location.href = "/join?message=host-left"
  }
}
setInterval(checkRoomExists, 3000)
```

### 3. Connection Lost

**Reconnect Logic:**
```typescript
// File: hooks/use-reconnection.ts
// Line 30-100

const useReconnection = () => {
  const [isOnline, setIsOnline] = useState(true)
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Refresh room data
      window.location.reload()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return { isOnline }
}
```

---

## 📊 Data Structure Reference

### Room Object
```typescript
{
  code: string              // "ABC123"
  host_id: string           // "host_xyz"
  quiz_id: string           // "math-basic"
  quiz_title: string        // "Basic Math"
  status: "waiting" | "countdown" | "quiz" | "finished"
  settings: {
    questionCount: number   // 10
    totalTimeLimit: number  // 30 (minutes)
  }
  players: Player[]
  countdown_start_time?: string
  countdown_duration?: number
  started_at?: string
  created_at: string
}
```

### Player Object
```typescript
{
  id: string                // "player_abc"
  nickname: string          // "John Doe"
  avatar: string            // "/ava1.webp" or Google avatar URL
  joinedAt: string          // ISO timestamp
  isReady: boolean
  isHost: boolean
  quizScore: number         // 0-1000+
  questionsAnswered: number // 0-10
  correctAnswers: number    // 0-10
  currentQuestion: number   // 0-9
}
```

### Session Object
```typescript
{
  session_id: string        // "player_1234567890_abc"
  user_type: "host" | "player"
  user_data: {
    id: string
    nickname?: string
    avatar?: string
    roomCode: string
    quizId?: string
  }
  room_code: string
  created_at: string
}
```

---

## 🎯 Tips Debugging

### 1. Cek Real-time Subscription
```typescript
// Tambahkan log di use-room hook
console.log('[useRoom] Subscription status:', subscription.state)
console.log('[useRoom] Room update:', payload.new)
```

### 2. Cek Score Update Queue
```typescript
// Tambahkan log di score-update-queue
console.log('[Queue] Enqueued:', task)
console.log('[Queue] Processing:', this.queue.length, 'tasks')
```

### 3. Cek Session
```typescript
// Di browser console
const sessionId = localStorage.getItem('kiro_session_id')
console.log('Session ID:', sessionId)

// Atau di component
const sessionData = await sessionManager.getSessionData(sessionId)
console.log('Session data:', sessionData)
```

### 4. Cek Room State
```typescript
// Di browser console
const room = await roomManager.getRoom('ABC123')
console.log('Room:', room)
console.log('Players:', room.players)
console.log('Status:', room.status)
```
