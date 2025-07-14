import { supabase, Game, Player } from './supabaseClient';

// Game management functions
export async function createGame(hostId: string): Promise<{ game: Game | null; error: string | null }> {
  try {
    console.log('🎮 Creating game with hostId:', hostId);
    
    const { data, error } = await supabase
      .from('games')
      .insert([
        {
          host_id: hostId,
          status: 'waiting',
          current_phase: 'lobby',
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error creating game:', error);
      return { game: null, error: error.message || 'Database error occurred' };
    }

    if (!data) {
      console.error('❌ No data returned from game creation');
      return { game: null, error: 'No game data returned' };
    }

    console.log('✅ Game created successfully:', data);
    return { game: data, error: null };
  } catch (err) {
    console.error('💥 Unexpected error creating game:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { game: null, error: `Failed to create game: ${errorMessage}` };
  }
}

export async function joinGame(gameCode: string, playerName: string, isHost: boolean = false): Promise<{ player: Player | null; error: string | null }> {
  try {
    // First, find the game by game code
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, status')
      .eq('game_code', gameCode.toUpperCase())
      .single();

    if (gameError || !game) {
      return { player: null, error: 'Game not found' };
    }

    if (game.status !== 'waiting') {
      return { player: null, error: 'Game has already started' };
    }

    // Check if player name already exists in this game
    const { data: existingPlayer, error: existingError } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', game.id)
      .eq('name', playerName)
      .single();

    if (existingPlayer) {
      return { player: null, error: 'A player with this name already exists in the game' };
    }

    // Join the game
    const { data: player, error: joinError } = await supabase
      .from('players')
      .insert([
        {
          game_id: game.id,
          name: playerName,
          is_host: isHost,
        }
      ])
      .select()
      .single();

    if (joinError) {
      console.error('Error joining game:', joinError);
      return { player: null, error: joinError.message };
    }

    return { player, error: null };
  } catch (err) {
    console.error('Unexpected error joining game:', err);
    return { player: null, error: 'Failed to join game' };
  }
}

export async function getGamePlayers(gameId: string): Promise<{ players: Player[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error fetching players:', error);
      return { players: [], error: error.message };
    }

    return { players: data || [], error: null };
  } catch (err) {
    console.error('Unexpected error fetching players:', err);
    return { players: [], error: 'Failed to fetch players' };
  }
}

export async function updateGameStatus(gameId: string, status: 'waiting' | 'in_progress' | 'completed', phase?: 'lobby' | 'night' | 'day' | 'voting' | 'end'): Promise<{ error: string | null }> {
  try {
    const updateData: any = { status };
    if (phase) {
      updateData.current_phase = phase;
    }

    const { error } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', gameId);

    if (error) {
      console.error('Error updating game status:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error('Unexpected error updating game status:', err);
    return { error: 'Failed to update game status' };
  }
}

// QR Code generation
export function generateQRCodeData(gameCode: string): string {
  // Generate the join URL that players will scan
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.vercel.app';
  return `${baseUrl}/player?gameId=${gameCode}`;
}

export function generateQRCodeSVG(data: string, size: number = 200): string {
  // This is a simplified QR code generator using a library or service
  // For now, we'll return a placeholder that can be replaced with actual QR generation
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`;
}

// Utility functions
export function generateHostId(): string {
  // Generate a proper UUID for host_id (compatible with database UUID type)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID v4 generator for compatibility
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
}

// Role assignment logic (for later phases)
export function assignRoles(playerCount: number): { [role: string]: number } {
  // Simple role assignment logic based on player count
  if (playerCount < 4) {
    return { employee: playerCount - 1, rogue: 1, audit: 0, hr: 0 };
  } else if (playerCount <= 6) {
    return { employee: playerCount - 2, rogue: 1, audit: 1, hr: 0 };
  } else if (playerCount <= 9) {
    return { employee: playerCount - 3, rogue: 2, audit: 1, hr: 0 };
  } else {
    return { employee: playerCount - 4, rogue: 2, audit: 1, hr: 1 };
  }
} 