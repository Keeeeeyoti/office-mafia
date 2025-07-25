import { supabase, Game, Player } from './supabaseClient';

// Game management functions
export async function createGame(hostId: string): Promise<{ game: Game | null; error: string | null }> {
  try {
    console.log('🎮 Creating game with hostId:', hostId);
    
    // Clean up old abandoned games before creating a new one
    await cleanupAbandonedGames();
    
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

    if (game.status === 'in_progress') {
      return { player: null, error: 'Game has already started' };
    }
    
    if (game.status === 'completed') {
      return { player: null, error: 'Game has already ended' };
    }
    
    if (game.status === 'abandoned') {
      return { player: null, error: 'Game session has expired' };
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

// Cleanup functions
export async function cleanupAbandonedGames(): Promise<{ cleaned: number; error: string | null }> {
  try {
    console.log('🧹 Cleaning up abandoned games...');
    
    const { data, error } = await supabase.rpc('cleanup_abandoned_games');
    
    if (error) {
      console.error('❌ Cleanup failed:', error);
      return { cleaned: 0, error: error.message };
    }
    
    const cleanedCount = data || 0;
    console.log(`✅ Cleaned up ${cleanedCount} abandoned games`);
    return { cleaned: cleanedCount, error: null };
  } catch (err) {
    console.error('💥 Unexpected error during cleanup:', err);
    return { cleaned: 0, error: 'Failed to cleanup abandoned games' };
  }
}

export async function cleanupOldGames(): Promise<{ result: string; error: string | null }> {
  try {
    console.log('🧹 Running full game cleanup...');
    
    const { data, error } = await supabase.rpc('cleanup_old_games');
    
    if (error) {
      console.error('❌ Full cleanup failed:', error);
      return { result: '', error: error.message };
    }
    
    console.log(`✅ Cleanup result: ${data}`);
    return { result: data || '', error: null };
  } catch (err) {
    console.error('💥 Unexpected error during full cleanup:', err);
    return { result: '', error: 'Failed to cleanup old games' };
  }
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

// Role assignment logic
export interface RoleDistribution {
  employee: number;
  rogue: number;
  audit: number;
  hr: number;
}

export function calculateRoleDistribution(playerCount: number): RoleDistribution {
  console.log(`🎭 Calculating role distribution for ${playerCount} players`);
  
  if (playerCount < 3) {
    throw new Error('Minimum 3 players required to start a game');
  }
  
  let distribution: RoleDistribution;
  
  if (playerCount === 3) {
    // 3 players: 2 employees, 1 rogue
    distribution = { employee: 2, rogue: 1, audit: 0, hr: 0 };
  } else if (playerCount === 4) {
    // 4 players: 2 employees, 1 rogue, 1 audit
    distribution = { employee: 2, rogue: 1, audit: 1, hr: 0 };
  } else if (playerCount === 5) {
    // 5 players: 3 employees, 1 rogue, 1 audit
    distribution = { employee: 3, rogue: 1, audit: 1, hr: 0 };
  } else if (playerCount === 6) {
    // 6 players: 3 employees, 2 rogues, 1 audit
    distribution = { employee: 3, rogue: 2, audit: 1, hr: 0 };
  } else if (playerCount === 7) {
    // 7 players: 4 employees, 2 rogues, 1 audit
    distribution = { employee: 4, rogue: 2, audit: 1, hr: 0 };
  } else if (playerCount === 8) {
    // 8 players: 4 employees, 2 rogues, 1 audit, 1 hr
    distribution = { employee: 4, rogue: 2, audit: 1, hr: 1 };
  } else {
    // 9+ players: Scale proportionally
    const rogueCount = Math.floor(playerCount / 3); // ~33% rogues
    const specialRoles = Math.min(2, Math.floor(playerCount / 4)); // 1-2 special roles
    const employeeCount = playerCount - rogueCount - specialRoles;
    
    distribution = {
      employee: employeeCount,
      rogue: rogueCount,
      audit: specialRoles >= 1 ? 1 : 0,
      hr: specialRoles >= 2 ? 1 : 0
    };
  }
  
  console.log('🎭 Role distribution:', distribution);
  return distribution;
}

export async function assignRolesToPlayers(gameId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    console.log(`🎯 Assigning roles for game ${gameId}`);
    
    // Get all players for this game (excluding host)
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, name')
      .eq('game_id', gameId)
      .eq('is_host', false)
      .order('joined_at');
    
    if (playersError || !players) {
      console.error('❌ Failed to fetch players:', playersError);
      return { success: false, error: playersError?.message || 'Failed to fetch players' };
    }
    
    if (players.length < 3) {
      return { success: false, error: 'Minimum 3 players required to start the game' };
    }
    
    // Calculate role distribution
    const distribution = calculateRoleDistribution(players.length);
    
    // Create array of roles to assign
    const rolesToAssign: string[] = [];
    for (let i = 0; i < distribution.employee; i++) rolesToAssign.push('employee');
    for (let i = 0; i < distribution.rogue; i++) rolesToAssign.push('rogue');
    for (let i = 0; i < distribution.audit; i++) rolesToAssign.push('audit');
    for (let i = 0; i < distribution.hr; i++) rolesToAssign.push('hr');
    
    // Shuffle roles randomly
    for (let i = rolesToAssign.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rolesToAssign[i], rolesToAssign[j]] = [rolesToAssign[j], rolesToAssign[i]];
    }
    
    console.log('🎭 Shuffled roles:', rolesToAssign);
    
    // Assign roles to players
    const assignments = players.map((player, index) => ({
      id: player.id,
      role: rolesToAssign[index]
    }));
    
    // Update players with their assigned roles
    for (const assignment of assignments) {
      const { error: updateError } = await supabase
        .from('players')
        .update({ role: assignment.role })
        .eq('id', assignment.id);
      
      if (updateError) {
        console.error(`❌ Failed to assign role to player ${assignment.id}:`, updateError);
        return { success: false, error: `Failed to assign role: ${updateError.message}` };
      }
      
      console.log(`✅ Assigned ${assignment.role} to player ${assignment.id}`);
    }
    
    console.log('🎉 Role assignment completed successfully!');
    return { success: true, error: null };
    
  } catch (err) {
    console.error('💥 Unexpected error during role assignment:', err);
    return { success: false, error: 'Failed to assign roles' };
  }
}

// Generate random bonus with weighted probability (1% = 80%, higher values exponentially rarer)
function generateRandomBonus(): number {
  const random = Math.random();
  
  // 80% chance for 1%
  if (random < 0.8) return 1;
  
  // Remaining 20% distributed exponentially across 2-15%
  const remaining = (random - 0.8) / 0.2; // Normalize to 0-1 for remaining 20%
  
  // Exponential distribution: higher values are exponentially rarer
  // Using formula: bonus = 2 + floor(-log(1-remaining) * 3)
  // This creates exponential decay with max around 15%
  const exponentialValue = Math.floor(-Math.log(1 - remaining * 0.99) * 3);
  const bonus = Math.min(2 + exponentialValue, 15);
  
  return bonus;
}

// Performance bonus system (easter egg)
export async function updatePerformanceBonus(playerId: string, clicks: number): Promise<{ success: boolean; error: string | null; newBonus: number; bonusEarned?: number }> {
  try {
    console.log(`🎯 Updating performance bonus for player ${playerId}, clicks: ${clicks}`);
    
    // Check if this is a milestone (every 10 clicks)
    const milestones = Math.floor(clicks / 10);
    const previousMilestones = Math.floor((clicks - 1) / 10);
    
    if (milestones <= previousMilestones) {
      // No new milestone reached
      return { success: true, error: null, newBonus: 0 };
    }
    
    // Get current bonus
    const { data: currentPlayer, error: fetchError } = await supabase
      .from('players')
      .select('performance_bonus')
      .eq('id', playerId)
      .single();
    
    if (fetchError || !currentPlayer) {
      console.error('❌ Failed to fetch current bonus:', fetchError);
      return { success: false, error: 'Failed to fetch current bonus', newBonus: 0 };
    }
    
    // Generate random bonus amount
    const bonusEarned = generateRandomBonus();
    const newBonus = (currentPlayer.performance_bonus || 0) + bonusEarned;
    
    // Update the bonus
    const { error: updateError } = await supabase
      .from('players')
      .update({ performance_bonus: newBonus })
      .eq('id', playerId);
    
    if (updateError) {
      console.error('❌ Failed to update performance bonus:', updateError);
      return { success: false, error: updateError.message, newBonus: 0 };
    }
    
    console.log(`✅ Performance bonus updated: +${bonusEarned}% earned, total: ${newBonus}%`);
    return { success: true, error: null, newBonus, bonusEarned };
    
  } catch (err) {
    console.error('💥 Unexpected error updating performance bonus:', err);
    return { success: false, error: 'Failed to update performance bonus', newBonus: 0 };
  }
}

// Player elimination system
export async function eliminatePlayer(playerId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    console.log(`🔥 Eliminating player ${playerId}`);
    
    const { error } = await supabase
      .from('players')
      .update({ is_alive: false })
      .eq('id', playerId);
    
    if (error) {
      console.error('❌ Failed to eliminate player:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Player eliminated successfully');
    return { success: true, error: null };
    
  } catch (err) {
    console.error('💥 Unexpected error eliminating player:', err);
    return { success: false, error: 'Failed to eliminate player' };
  }
}

// Revive player (undo elimination)
export async function revivePlayer(playerId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    console.log(`💊 Reviving player ${playerId}`);
    
    const { error } = await supabase
      .from('players')
      .update({ is_alive: true })
      .eq('id', playerId);
    
    if (error) {
      console.error('❌ Failed to revive player:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Player revived successfully');
    return { success: true, error: null };
    
  } catch (err) {
    console.error('💥 Unexpected error reviving player:', err);
    return { success: false, error: 'Failed to revive player' };
  }
}

// Update game phase
export async function updateGamePhase(gameId: string, phase: 'lobby' | 'night' | 'day' | 'voting' | 'end'): Promise<{ success: boolean; error: string | null }> {
  try {
    console.log(`🎮 Updating game ${gameId} to phase: ${phase}`);
    
    const { error } = await supabase
      .from('games')
      .update({ current_phase: phase })
      .eq('id', gameId);
    
    if (error) {
      console.error('❌ Failed to update game phase:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Game phase updated successfully');
    return { success: true, error: null };
    
  } catch (err) {
    console.error('💥 Unexpected error updating game phase:', err);
    return { success: false, error: 'Failed to update game phase' };
  }
} 