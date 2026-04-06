"use client"

import { useState, useEffect, useRef } from "react"
import { roomManager, type Room } from "@/lib/room-manager"

export function useRoom(roomCode: string | null) {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const roomRef = useRef<Room | null>(null)

  useEffect(() => {
    if (!roomCode) {
      setRoom(null)
      roomRef.current = null
      setLoading(false)
      return
    }

    // Load room immediately without delay
    const loadRoom = async () => {
      try {
        const initialRoom = await roomManager.getRoom(roomCode)
        setRoom(initialRoom)
        roomRef.current = initialRoom
        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    }

    // Load immediately first
    loadRoom()

    // Subscribe to updates using Supabase realtime
    let unsubscribe: (() => void) | null = null

    const setupSubscription = async () => {
      try {
        unsubscribe = await roomManager.subscribe(roomCode, (updatedRoom) => {
          // Compare with previous room to ensure we're actually updating
          const previousRoom = roomRef.current

          // Monotonic merge: never roll back to older progress or status (Enterprise Pattern)
          if (previousRoom && updatedRoom) {
            // 1. Keep status progression - once countdown/quiz starts, don't go back to 'waiting'
            const statusOrder = { 'waiting': 0, 'countdown': 1, 'quiz': 2, 'memory': 3, 'finished': 4 }
            const prevOrder = statusOrder[previousRoom.status] || 0
            const nextOrder = statusOrder[updatedRoom.status] || 0
            
            if (nextOrder < prevOrder) {
              updatedRoom.status = previousRoom.status
              updatedRoom.gameStarted = previousRoom.gameStarted
            }

            // 2. Keep countdownStartTime if it's already set (prevents flicker)
            if (previousRoom.countdownStartTime && !updatedRoom.countdownStartTime) {
              updatedRoom.countdownStartTime = previousRoom.countdownStartTime
              updatedRoom.countdownDuration = previousRoom.countdownDuration || 10
            }

            // 3. Keep monotonic player progress
            if (previousRoom.players && updatedRoom.players) {
              updatedRoom.players = updatedRoom.players.map(newPlayer => {
                const oldPlayer = previousRoom.players?.find(p => p.id === newPlayer.id)
                if (oldPlayer) {
                  return {
                    ...newPlayer,
                    quizScore: Math.max(newPlayer.quizScore || 0, oldPlayer.quizScore || 0),
                    questionsAnswered: Math.max(newPlayer.questionsAnswered || 0, oldPlayer.questionsAnswered || 0),
                    currentQuestion: Math.max(newPlayer.currentQuestion || 0, oldPlayer.currentQuestion || 0),
                    correctAnswers: Math.max(newPlayer.correctAnswers || 0, oldPlayer.correctAnswers || 0),
                  }
                }
                return newPlayer
              })
            }
          }

          const hasChanged = !previousRoom ||
            previousRoom.players?.length !== updatedRoom?.players?.length ||
            JSON.stringify(previousRoom.players?.map(p => p.id).sort()) !==
            JSON.stringify(updatedRoom?.players?.map(p => p.id).sort()) ||
            previousRoom.status !== updatedRoom?.status ||
            previousRoom.countdownStartTime !== updatedRoom?.countdownStartTime ||
            previousRoom.gameStarted !== updatedRoom?.gameStarted ||
            // Check for score/progress changes
            JSON.stringify(previousRoom.players?.map(p => ({
              id: p.id,
              quizScore: p.quizScore,
              memoryScore: p.memoryScore,
              questionsAnswered: p.questionsAnswered
            })).sort((a, b) => a.id.localeCompare(b.id))) !==
            JSON.stringify(updatedRoom?.players?.map(p => ({
              id: p.id,
              quizScore: p.quizScore,
              memoryScore: p.memoryScore,
              questionsAnswered: p.questionsAnswered
            })).sort((a, b) => a.id.localeCompare(b.id)))

          if (hasChanged && updatedRoom) {

            setRoom(updatedRoom)
            roomRef.current = updatedRoom
            setIsConnected(true)
          }
        })
      } catch (error) {
        console.error('[useRoom] Error setting up subscription:', error)
      }
    }

    setupSubscription()

    // 🚀 Polling as failsafe - only apply if data has HIGHER progress (prevent stale overwrites)
    const pollInterval = setInterval(async () => {
      try {
        const polledRoom = await roomManager.getRoom(roomCode)
        if (polledRoom) {
          const previousRoom = roomRef.current

          // Monotonic merge for polling (failsafe)
          if (previousRoom && polledRoom) {
             const statusOrder = { 'waiting': 0, 'countdown': 1, 'quiz': 2, 'memory': 3, 'finished': 4 }
             const prevOrder = statusOrder[previousRoom.status] || 0
             const nextOrder = statusOrder[polledRoom.status] || 0
             
             if (nextOrder < prevOrder) {
               polledRoom.status = previousRoom.status
               polledRoom.gameStarted = previousRoom.gameStarted
             }

             if (previousRoom.countdownStartTime && !polledRoom.countdownStartTime) {
                polledRoom.countdownStartTime = previousRoom.countdownStartTime
                polledRoom.countdownDuration = previousRoom.countdownDuration || 10
             }

             if (previousRoom.players) {
              polledRoom.players = polledRoom.players.map(polledPlayer => {
                const currentPlayer = previousRoom.players?.find(p => p.id === polledPlayer.id)
                if (currentPlayer) {
                  return {
                    ...polledPlayer,
                    quizScore: Math.max(polledPlayer.quizScore || 0, currentPlayer.quizScore || 0),
                    questionsAnswered: Math.max(polledPlayer.questionsAnswered || 0, currentPlayer.questionsAnswered || 0),
                    currentQuestion: Math.max(polledPlayer.currentQuestion || 0, currentPlayer.currentQuestion || 0),
                    correctAnswers: Math.max(polledPlayer.correctAnswers || 0, currentPlayer.correctAnswers || 0),
                  }
                }
                return polledPlayer
              })
            }
          }

          const hasChanged = !previousRoom ||
            previousRoom.players?.length !== polledRoom?.players?.length ||
            // Multi-criteria change detection (International Best Practice)
            previousRoom.status !== polledRoom?.status ||
            previousRoom.countdownStartTime !== polledRoom?.countdownStartTime ||
            previousRoom.gameStarted !== polledRoom?.gameStarted ||
            JSON.stringify(previousRoom.players?.map(p => ({
              id: p.id,
              quizScore: p.quizScore,
              questionsAnswered: p.questionsAnswered
            })).sort((a, b) => a.id.localeCompare(b.id))) !==
            JSON.stringify(polledRoom?.players?.map(p => ({
              id: p.id,
              quizScore: p.quizScore,
              questionsAnswered: p.questionsAnswered
            })).sort((a, b) => a.id.localeCompare(b.id)))

          if (hasChanged) {
            setRoom(polledRoom)
            roomRef.current = polledRoom
            setIsConnected(true)
          }
        }
      } catch (err) {
        console.error('[useRoom] Polling error:', err)
      }
    }, 2000)

    return () => {
      if (unsubscribe) unsubscribe()
      clearInterval(pollInterval)
    }
  }, [roomCode])

  return { room, setRoom, loading, isConnected }
}
