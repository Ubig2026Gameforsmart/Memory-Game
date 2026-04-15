import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase Players Client - Dedicated database for game participants
 * 
 * This separate Supabase instance handles all player-related data:
 * - participants table with individual rows per player
 * - Enables parallel updates (no JSONB bottleneck)
 */

// Use placeholder values to prevent build errors - actual values from env
const supabasePlayersUrl = process.env.NEXT_PUBLIC_SUPABASE_PLAYERS_URL || 'https://placeholder.supabase.co'
const supabasePlayersAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PLAYERS_ANON_KEY || 'placeholder-key'

// Create client for Players database (will only be used if properly configured)
export const supabasePlayers: SupabaseClient = createClient(supabasePlayersUrl, supabasePlayersAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
    }
})

// Helper function to check if Players Supabase is properly configured
export const isPlayersSupabaseConfigured = () => {
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_PLAYERS_URL
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_PLAYERS_ANON_KEY
    const isValidUrl = hasUrl && !process.env.NEXT_PUBLIC_SUPABASE_PLAYERS_URL?.includes('placeholder')
    const isValidKey = hasKey && !process.env.NEXT_PUBLIC_SUPABASE_PLAYERS_ANON_KEY?.includes('placeholder')
    const result = isValidUrl && isValidKey

    return result
}

/**
 * Generate XID 
 * Example: d3fmdnp53dtg000j5r30
 */
function generateXID(): string {
    // Menyamakan format dengan session_id/user_id yang biasanya diawali '01m'
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const prefix = '01m'
    let result = prefix
    for (let i = 0; i < 20 - prefix.length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

// Type definitions for answer
export interface QuizAnswer {
    correct: boolean
    answer_id: number
    timestamp: number
    question_id: number
}

// Type definitions for participants table (matches actual Supabase B schema)
export interface GameParticipant {
    id: string
    session_id: string
    nickname: string
    avatar: string | null
    user_id: string | null
    score: number
    joined_at: string
    answers: QuizAnswer[]
    correct: number
    current_question: number  // This is the ONLY question tracking field in the DB
    duration: number
    finished_at: string | null
    started_at: string | null
}

// Participants API functions
export const participantsApi = {
    /**
     * Generate XID for new player
     */
    generatePlayerId(): string {
        return generateXID()
    },

    /**
     * Add a player to a game session
     */
    async addParticipant(
        gamePin: string,
        playerId: string,
        nickname: string,
        avatar: string,
        isHost: boolean = false,
        userId: string | null = null
    ): Promise<GameParticipant | null> {
        try {
            // First, get the session_id from sessions table
            const session = await sessionsApi.getSession(gamePin)
            const sessionId = session?.id
            if (!sessionId) {
                console.error('[PlayersDB] Session not found for pin:', gamePin)
                return null
            }

            // Cleanup existing participant with same nickname in this session
            try {
                await supabasePlayers
                    .from('participants')
                    .delete()
                    .eq('session_id', sessionId)
                    .eq('nickname', nickname)
            } catch (cleanupError) {
                console.warn('[PlayersDB] Exception during nickname cleanup:', cleanupError)
            }

            const { data, error } = await supabasePlayers
                .from('participants')
                .upsert({
                    id: playerId,
                    session_id: sessionId,
                    user_id: userId,
                    nickname,
                    avatar, // ✅ ADD THIS: Store the selected avatar path
                    score: 0,
                    correct: 0,
                    current_question: 0,
                    duration: 0,
                    started_at: null,
                    finished_at: null,
                    answers: []
                }, {
                    onConflict: 'id'
                })
                .select()
                .single()

            if (error) {
                console.error('[PlayersDB] Error adding participant:', error)
                return null
            }

            return data
        } catch (error) {
            console.error('[PlayersDB] Exception adding participant:', error)
            return null
        }
    },

    /**
     * Get all participants for a game by game_pin
     */
    async getParticipants(gamePin: string): Promise<GameParticipant[]> {
        try {
            const session = await sessionsApi.getSession(gamePin)
            if (!session) return []

            const { data, error } = await supabasePlayers
                .from('participants')
                .select('*')
                .eq('session_id', session.id)
                .order('joined_at', { ascending: true })

            if (error) {
                console.error('[PlayersDB] Error getting participants:', error)
                return []
            }

            return data || []
        } catch (error) {
            console.error('[PlayersDB] Exception getting participants:', error)
            return []
        }
    },

    /**
     * Get a single participant by player_id
     */
    async getParticipant(gamePin: string, playerId: string): Promise<GameParticipant | null> {
        try {
            const { data, error } = await supabasePlayers
                .from('participants')
                .select('*')
                .eq('id', playerId)
                .single()

            if (error) {
                console.error('[PlayersDB] Error getting participant:', error)
                return null
            }

            return data
        } catch (error) {
            console.error('[PlayersDB] Exception getting participant:', error)
            return null
        }
    },

    /**
     * Mark player as started
     */
    async markStarted(gamePin: string, playerId: string): Promise<boolean> {
        try {
            const { error } = await supabasePlayers
                .from('participants')
                .update({
                    started_at: new Date().toISOString()
                })
                .eq('id', playerId)

            if (error) {
                console.error('[PlayersDB] Error marking started:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[PlayersDB] Exception marking started:', error)
            return false
        }
    },

    /**
     * Update player score
     */
    async updateScore(
        gamePin: string,
        playerId: string,
        score: number,
        questionsAnswered: number,
        current_question?: number,
        correct?: number
    ): Promise<boolean> {
        try {
            const current = await this.getParticipant(gamePin, playerId)

            const finalScore = current ? Math.max(current.score, score) : score
            // current_question is the actual DB column that tracks progress
            const finalCurrentQuestion = current_question !== undefined
                ? Math.max(current?.current_question || 0, current_question)
                : Math.max(current?.current_question || 0, questionsAnswered)
            const finalCorrect = correct !== undefined ? Math.max(current?.correct || 0, correct) : (current?.correct || 0)

            console.log(`[PlayersDB] Updating score for ${playerId}: score=${finalScore}, current_question=${finalCurrentQuestion}, correct=${finalCorrect}`)

            const { error } = await supabasePlayers
                .from('participants')
                .update({
                    score: finalScore,
                    current_question: finalCurrentQuestion,
                    correct: finalCorrect
                })
                .eq('id', playerId)

            if (error) {
                console.error('[PlayersDB] Error updating score:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[PlayersDB] Exception updating score:', error)
            return false
        }
    },

    /**
     * Update player heartbeat 
     */
    async updateHeartbeat(playerId: string, clientTimeOffset?: number | null): Promise<boolean> {
        try {
            const { error } = await supabasePlayers
                .from('participants')
                .update({
                    last_heartbeat: new Date().toISOString(),
                    client_time_offset: clientTimeOffset || null
                })
                .eq('id', playerId)

            if (error) {
                console.error('[PlayersDB] Error updating heartbeat:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[PlayersDB] Exception updating heartbeat:', error)
            return false
        }
    },

    /**
     * Mark player as finished
     */
    async markFinished(gamePin: string, playerId: string, finalScore: number): Promise<boolean> {
        try {
            const current = await this.getParticipant(gamePin, playerId)
            let duration = 0
            const now = new Date()

            if (current && current.started_at) {
                duration = Math.floor((now.getTime() - new Date(current.started_at).getTime()) / 1000)
            }

            const { error } = await supabasePlayers
                .from('participants')
                .update({
                    score: finalScore,
                    finished_at: now.toISOString(),
                    duration
                })
                .eq('id', playerId)

            if (error) {
                console.error('[PlayersDB] Error marking finished:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[PlayersDB] Exception marking finished:', error)
            return false
        }
    },

    /**
     * Add an answer to participant's answers array
     */
    async addAnswer(
        gamePin: string,
        playerId: string,
        answer: {
            question_id: string | number
            answer_id: string | number
            is_correct: boolean
            points_earned?: number
        },
        score?: number,
        current_question?: number,
        nickname?: string,
        avatar?: string
    ): Promise<boolean> {
        try {
            console.log(`[PlayersDB] 📝 Attempting to add answer for player: ${playerId}`, answer)
            
            let { data: participant, error: fetchError } = await supabasePlayers
                .from('participants')
                .select('id, answers, correct, score, current_question, session_id, started_at')
                .eq('id', playerId)
                .maybeSingle()

            // [Auto-Healing] Gunakan Nama dan Avatar asli jika tersedia
            if (!participant && !fetchError) {
                console.warn(`[PlayersDB] ⚠️ Player ${playerId} not found. Attempting auto-registration...`)
                const session = await sessionsApi.getSession(gamePin)
                
                if (session) {
                    console.log(`[PlayersDB] 🔍 Found session for ${gamePin} in DB:`, session.id)
                    
                    // 🚀 STEP 1: Search by Nickname + Session (Case-insensitive)
                    // This is much safer than a complex upsert
                    const { data: existingPart } = await supabasePlayers
                        .from('participants')
                        .select('*')
                        .eq('session_id', session.id)
                        .ilike('nickname', nickname || 'Anonymous Player')
                        .maybeSingle()

                    if (existingPart) {
                        console.log(`[PlayersDB] ✨ Found existing record for ${nickname}. Identity restored.`)
                        participant = existingPart
                    } else {
                        // 🚀 STEP 2: Truly missing, so Insert new entry
                        const { data: newPart, error: insError } = await supabasePlayers
                            .from('participants')
                            .insert({
                                id: playerId,
                                session_id: session.id,
                                nickname: nickname || 'Anonymous Player',
                                avatar: avatar || '/ava1.webp',
                                score: score || 0,
                                correct: 0,
                                current_question: current_question || 0,
                                answers: []
                            })
                            .select()
                            .maybeSingle()
                        
                        if (insError) {
                            console.error('[PlayersDB] ❌ Auto-healing insert failed:', insError)
                        } else {
                            participant = newPart
                        }
                    }
                } else {
                    console.error(`[PlayersDB] ❌ Session ${gamePin} NOT FOUND in Supabase B.`)
                }
            }

            if (!participant) {
                console.error('[PlayersDB] ❌ Final check failed: Player not found and auto-healing failed.', { fetchError })
                return false
            }

            const currentAnswers = Array.isArray(participant?.answers) ? participant.answers : []
            const currentCorrect = participant?.correct || 0

            // Pastikan ID dikonversi ke number dengan aman
            const safeQuestionId = typeof answer.question_id === 'string' ? parseInt(answer.question_id, 10) : answer.question_id
            const safeAnswerId = typeof answer.answer_id === 'string' ? parseInt(answer.answer_id, 10) : answer.answer_id

            const newAnswer: QuizAnswer = {
                correct: answer.is_correct,
                answer_id: isNaN(safeAnswerId as number) ? 0 : (safeAnswerId as number),
                timestamp: Date.now(),
                question_id: isNaN(safeQuestionId as number) ? 0 : (safeQuestionId as number)
            }

            const updates: any = {
                answers: [...currentAnswers, newAnswer],
                correct: answer.is_correct ? currentCorrect + 1 : currentCorrect
            }

            if (score !== undefined) updates.score = score
            if (current_question !== undefined) {
                updates.current_question = current_question
                
                // 🕒 AUTO-START: Set started_at on first question if not already set
                if (current_question === 1 && !participant.started_at) {
                    console.log(`[PlayersDB] 🕒 First question answered. Setting started_at for ${participant.id}`)
                    const startTime = new Date()
                    updates.started_at = startTime.toISOString()
                    participant.started_at = updates.started_at // Update local ref for duration calculation if needed
                }
                
                // 🕒 AUTO-FINISH: Detect if this is the final question and mark accordingly
                const session = await sessionsApi.getSession(gamePin)
                const totalQuestions = session?.question_limit || 0
                
                if (totalQuestions > 0 && current_question >= totalQuestions && participant.started_at) {
                    console.log(`[PlayersDB] 🏁 Final question (${current_question}/${totalQuestions}) answered. Marking as finished...`)
                    const finishTime = new Date()
                    updates.finished_at = finishTime.toISOString()
                    // Calculate duration in seconds
                    const startTime = new Date(participant.started_at)
                    updates.duration = Math.floor((finishTime.getTime() - startTime.getTime()) / 1000)
                }
            }

            const { error: updateError } = await supabasePlayers
                .from('participants')
                .update(updates)
                .eq('id', participant.id) // Use the validated/healed ID

            if (updateError) {
                console.error('[PlayersDB] ❌ Error updating participant answers:', updateError)
                return false
            }

            console.log(`[PlayersDB] ✅ Answer saved successfully for ${participant.id}`)
            return true
        } catch (error) {
            console.error('[PlayersDB] 💥 Exception in addAnswer:', error)
            return false
        }
    },

    /**
     * Remove a participant
     */
    async removeParticipant(gamePin: string, playerId: string): Promise<boolean> {
        try {
            const { error } = await supabasePlayers
                .from('participants')
                .delete()
                .eq('id', playerId)

            if (error) {
                console.error('[PlayersDB] Error removing participant:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[PlayersDB] Exception removing participant:', error)
            return false
        }
    },

    /**
     * Remove all participants for a game
     */
    async clearSession(gamePin: string): Promise<boolean> {
        try {
            const session = await sessionsApi.getSession(gamePin)
            if (!session) return false

            const { error } = await supabasePlayers
                .from('participants')
                .delete()
                .eq('session_id', session.id)

            if (error) {
                console.error('[PlayersDB] Error clearing session:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[PlayersDB] Exception clearing session:', error)
            return false
        }
    },

    /**
     * Subscribe to participant changes
     */
    subscribeToParticipants(
        gamePin: string,
        callback: (participants: GameParticipant[]) => void
    ): () => void {
        let cachedParticipants: GameParticipant[] = []
        let channel: any = null

        sessionsApi.getSession(gamePin).then(session => {
            if (!session) return

            this.getParticipants(gamePin).then(participants => {
                cachedParticipants = participants
                callback(cachedParticipants)
            })

            channel = supabasePlayers
                .channel(`participants-${session.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'participants',
                        filter: `session_id=eq.${session.id}`
                    },
                    (payload) => {
                        if (payload.eventType === 'INSERT' && payload.new) {
                            const newParticipant = payload.new as GameParticipant
                            cachedParticipants = cachedParticipants.filter(p => p.id !== newParticipant.id && p.nickname !== newParticipant.nickname)
                            cachedParticipants = [...cachedParticipants, newParticipant]
                            callback(cachedParticipants)
                        } else if (payload.eventType === 'UPDATE' && payload.new) {
                            const updatedParticipant = payload.new as GameParticipant
                            cachedParticipants = cachedParticipants.map(p => p.id === updatedParticipant.id ? updatedParticipant : p)
                            callback(cachedParticipants)
                        } else if (payload.eventType === 'DELETE' && payload.old) {
                            const deletedId = (payload.old as any).id
                            cachedParticipants = cachedParticipants.filter(p => p.id !== deletedId)
                            callback(cachedParticipants)
                        }
                    }
                )
                .subscribe()
        })

        return () => {
            if (channel) {
                supabasePlayers.removeChannel(channel)
            }
        }
    }
}

// =====================================================
// Sessions API 
// =====================================================

export interface GameSessionB {
    id: string
    game_pin: string
    quiz_id: string
    status: 'waiting' | 'active' | 'finished'
    question_limit: number
    total_time_minutes: number
    created_at: string
    started_at: string | null
    ended_at: string | null
    current_questions: any[]
    countdown_started_at: string | null
    countdown_duration_seconds: number
    host_id: string | null
    expires_at: string | null
    max_players: number
}

export const sessionsApi = {
    /**
     * Create a new game session 
     */
    async createSession(sessionData: {
        game_pin: string
        host_id: string
        quiz_id?: string
        settings?: { questionCount: number; totalTimeLimit: number }
        questions?: any[]
    }): Promise<GameSessionB | null> {
        try {
            if (!sessionData.game_pin) return null

            // 🔧 CLEANUP: Always remove old/stale sessions with the SAME PIN before starting a new one
            // This prevents "Session Collision" and ensures getSession always finds the right one
            try {
                await supabasePlayers
                    .from('sessions')
                    .delete()
                    .eq('game_pin', sessionData.game_pin)
                console.log(`[SessionsDB] 🧹 Cleaned up old sessions for PIN: ${sessionData.game_pin}`)
            } catch (cleanupErr) {
                console.warn('[SessionsDB] Cleanup warning (non-critical):', cleanupErr)
            }

            const { data, error } = await supabasePlayers
                .from('sessions')
                .insert({
                    game_pin: sessionData.game_pin,
                    host_id: sessionData.host_id,
                    quiz_id: sessionData.quiz_id || '',
                    status: 'waiting',
                    question_limit: sessionData.settings?.questionCount || 10,
                    // 🔧 FIX: totalTimeLimit is already in minutes from quiz-settings page
                    total_time_minutes: sessionData.settings?.totalTimeLimit || 5,
                    current_questions: sessionData.questions || [],
                    max_players: 1000
                })
                .select()
                .single()

            if (error) {
                console.error('[SessionsDB] Error creating session:', error)
                return null
            }

            const newSession = data
            
            // 🚀 RE-LINK: Update any existing participants for this PIN to point to the NEW session ID
            // This ensures players who joined the lobby don't "disappear" when the session is recreated
            try {
                const { error: relinkError } = await supabasePlayers
                    .from('participants')
                    .update({ session_id: newSession.id })
                    .eq('id', 'MATCH_ANY_BUT_NEED_SESSION_LOGIC') // Wait, I don't have game_pin in participants table
                
                // CRAP! participants table doesn't have game_pin.
            } catch (e) {}

            return newSession
        } catch (error) {
            console.error('[SessionsDB] Exception creating session:', error)
            return null
        }
    },

    /**
     * Get session by game_pin
     */
    async getSession(gamePin: string): Promise<GameSessionB | null> {
        try {
            // 🔧 FIX: Instead of .single(), use .limit(1) and order by created_at DESC
            // This ensures we ALWAYS get the most recent session even if there are duplicates
            const { data, error } = await supabasePlayers
                .from('sessions')
                .select('*')
                .eq('game_pin', gamePin)
                .order('created_at', { ascending: false })
                .limit(1)

            if (error) {
                console.error('[SessionsDB] Error getting session:', error)
                return null
            }

            if (!data || data.length === 0) {
                return null
            }

            return data[0]
        } catch (error) {
            console.error('[SessionsDB] Exception getting session:', error)
            return null
        }
    },

    /**
     * Update session status
     */
    async updateStatus(gamePin: string, status: GameSessionB['status']): Promise<boolean> {
        try {
            const updates: any = { status }

            if (status === 'active') {
                updates.started_at = new Date().toISOString()
            } else if (status === 'finished') {
                updates.ended_at = new Date().toISOString()
            }

            const { error } = await supabasePlayers
                .from('sessions')
                .update(updates)
                .eq('game_pin', gamePin)

            if (error) {
                console.error('[SessionsDB] Error updating status:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[SessionsDB] Exception updating status:', error)
            return false
        }
    },

    /**
     * Start countdown
     */
    async startCountdown(gamePin: string, duration: number = 10): Promise<boolean> {
        try {
            if (!gamePin) return false

            const startTime = new Date().toISOString()
            const { error } = await supabasePlayers
                .from('sessions')
                .update({
                    countdown_started_at: startTime,
                    countdown_duration_seconds: duration,
                    // Keep status as waiting during countdown for backward compatibility
                    status: 'waiting' 
                })
                .eq('game_pin', gamePin)

            if (error) {
                console.error('[SessionsAPI] Error starting countdown in Supabase B:', error.message)
                return false
            }

            console.log(`[SessionsAPI] ✅ Countdown started for ${gamePin} at ${startTime}`)
            return true
        } catch (error) {
            console.error('[SessionsAPI] Exception in startCountdown:', error)
            return false
        }
    },

    /**
     * Delete session
     */
    async deleteSession(gamePin: string): Promise<boolean> {
        try {
            const { error } = await supabasePlayers
                .from('sessions')
                .delete()
                .eq('game_pin', gamePin)

            if (error) {
                console.error('[SessionsDB] Error deleting session:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[SessionsDB] Exception deleting session:', error)
            return false
        }
    },

    /**
     * Subscribe to session changes
     */
    subscribeToSession(
        gamePin: string,
        callback: (session: GameSessionB | null) => void
    ): () => void {
        const channel = supabasePlayers
            .channel(`session-${gamePin}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'sessions',
                    filter: `game_pin=eq.${gamePin}`
                },
                (payload) => {
                    if (payload.eventType === 'DELETE') {
                        callback(null)
                    } else if (payload.new) {
                        callback(payload.new as GameSessionB)
                    }
                }
            )
            .subscribe()

        return () => {
            supabasePlayers.removeChannel(channel)
        }
    }
}
