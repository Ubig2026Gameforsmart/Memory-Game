import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  try {
    const { roomCode } = params
    const body = await request.json()
    const { playerId, clientTime } = body

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      )
    }

    const clientTimeOffset = clientTime ? Date.now() - clientTime : null

    // Update player's last heartbeat timestamp using Supabase B if available
    const { participantsApi, isPlayersSupabaseConfigured } = await import('@/lib/supabase-players')
    
    let success = false
    if (isPlayersSupabaseConfigured()) {
      success = await participantsApi.updateHeartbeat(playerId, clientTimeOffset)
    } else {
      // Fallback to Supabase A participants table if players DB not used
      const { error: updateError } = await supabase
        .from('participants')
        .update({ 
          last_heartbeat: new Date().toISOString(),
          client_time_offset: clientTimeOffset
        })
        .eq('room_code', roomCode)
        .eq('id', playerId)
      
      success = !updateError
      if (updateError) console.error('[Heartbeat API] Error updating fallback heartbeat:', updateError)
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update heartbeat' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      serverTime: Date.now(),
      roomCode,
      playerId
    })

  } catch (error) {
    console.error('[Heartbeat API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
