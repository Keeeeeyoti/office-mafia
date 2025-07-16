import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, Smartphone, User, Users, Clock, XCircle } from 'lucide-react-native';
import { supabase, Game, Player } from '../utils/supabaseClient';
import { joinGame, getGamePlayers, formatTimeAgo, updatePerformanceBonus } from '../utils/gameHelpers';
import { determineGameWinner } from '../utils/moderatorScripts';
import RoleCard from '../components/RoleCard';
import VictoryScreen from '../components/VictoryScreen';

export default function PlayerPage() {
  const { gameId: urlGameId } = useLocalSearchParams();
  const [gameId, setGameId] = useState(urlGameId ? String(urlGameId) : '');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinedGame, setJoinedGame] = useState<Game | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'in_progress' | 'completed' | 'abandoned'>('waiting');
  const [ooweeClicks, setOoweeClicks] = useState(0);
  const [isOoweeProcessing, setIsOoweeProcessing] = useState(false);
  const [gameWinner, setGameWinner] = useState<'employees' | 'rogue' | null>(null);

  useEffect(() => {
    // If we have URL parameters, show them in the form
    if (urlGameId) {
      setGameId(String(urlGameId));
    }
  }, [urlGameId]);

  useEffect(() => {
    if (!joinedGame || !currentPlayer) return;

    console.log('🔌 Setting up real-time subscriptions for player:', currentPlayer.name, 'in game:', joinedGame.game_code);

    // Subscribe to real-time game updates
    const gameSubscription = supabase
      .channel(`game-${joinedGame.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${joinedGame.id}`,
      }, async (payload) => {
        console.log('🎮 Game update received:', payload.new);
        const updatedGame = payload.new as Game;
        setGameStatus(updatedGame.status);
        
        if (updatedGame.status === 'in_progress') {
          console.log('🚀 Game started! Showing alert and refreshing player data');
          Alert.alert('Game Started!', 'The game has begun. You will see your role now.');
          
          // Refresh current player to get assigned role
          const { data: updatedPlayer } = await supabase
            .from('players')
            .select('*')
            .eq('id', currentPlayer?.id)
            .single();
          
          if (updatedPlayer) {
            console.log('✅ Player data refreshed:', updatedPlayer);
            setCurrentPlayer(updatedPlayer);
          }
        } else if (updatedGame.status === 'completed') {
          // Game has ended, determine winner
          const { players: finalPlayers } = await getGamePlayers(joinedGame.id);
          const winner = determineGameWinner(finalPlayers);
          setGameWinner(winner);
        }
      })
      .subscribe((status) => {
        console.log('🎮 Game subscription status:', status);
      });

    // Subscribe to real-time player updates
    const playersSubscription = supabase
      .channel(`players-${joinedGame.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `game_id=eq.${joinedGame.id}`,
      }, async (payload) => {
        console.log('👥 Player update received:', payload.eventType, payload.new || payload.old);
        
        // Refresh player list when changes occur
        const { players: updatedPlayers } = await getGamePlayers(joinedGame.id);
        console.log('📋 Updated players list:', updatedPlayers.length, 'players');
        setPlayers(updatedPlayers);
        
        // Update current player if their status changed
        if (currentPlayer) {
          const updatedCurrentPlayer = updatedPlayers.find(p => p.id === currentPlayer.id);
          if (updatedCurrentPlayer) {
            console.log('🔄 Updating current player status:', {
              name: updatedCurrentPlayer.name,
              is_alive: updatedCurrentPlayer.is_alive,
              role: updatedCurrentPlayer.role
            });
            setCurrentPlayer(updatedCurrentPlayer);
          }
        }
      })
      .subscribe((status) => {
        console.log('👥 Players subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up subscriptions for player:', currentPlayer.name);
      gameSubscription.unsubscribe();
      playersSubscription.unsubscribe();
    };
  }, [joinedGame, currentPlayer]);

  const handleJoinGame = async () => {
    if (!gameId.trim() || !playerName.trim()) {
      Alert.alert('Error', 'Please enter both game ID and your name');
      return;
    }

    setLoading(true);
    
    const { player, error } = await joinGame(gameId.trim().toUpperCase(), playerName.trim());
    
    if (error) {
      Alert.alert('Error', error);
      setLoading(false);
      return;
    }

    if (player) {
      setCurrentPlayer(player);
      
      // Fetch game details
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', player.game_id)
        .single();

      if (game) {
        setJoinedGame(game);
        setGameStatus(game.status);
        
        // Load current players
        const { players: currentPlayers } = await getGamePlayers(game.id);
        setPlayers(currentPlayers);
      }
    }
    
    setLoading(false);
  };

  const handleLeaveGame = () => {
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave the game?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => {
            // Reset state and return to join form
            setJoinedGame(null);
            setCurrentPlayer(null);
            setPlayers([]);
            setGameStatus('waiting');
            setPlayerName('');
            setGameId('');
          }
        }
      ]
    );
  };

  const handleOoweeClick = async () => {
    if (!currentPlayer || isOoweeProcessing || gameStatus !== 'waiting') return;
    
    const newClickCount = ooweeClicks + 1;
    setOoweeClicks(newClickCount);
    
    // Every 10 clicks, update the performance bonus
    if (newClickCount % 10 === 0) {
      setIsOoweeProcessing(true);
      
      const { success, newBonus, bonusEarned } = await updatePerformanceBonus(currentPlayer.id, newClickCount);
      
      if (success && newBonus > 0) {
        // Update the current player with new bonus
        const updatedPlayer = { ...currentPlayer, performance_bonus: newBonus };
        setCurrentPlayer(updatedPlayer);
        
        // Also update in the players list
        setPlayers(prevPlayers => 
          prevPlayers.map(p => 
            p.id === currentPlayer.id ? updatedPlayer : p
          )
        );
        
        // Show exciting bonus earned message
        if (bonusEarned) {
          const message = bonusEarned === 1 
            ? `Performance bonus achieved: +${bonusEarned}% (Total: ${newBonus}%)`
            : `RARE BONUS! +${bonusEarned}% performance bonus! (Total: ${newBonus}%)`;
          Alert.alert('Dedication Recognized!', message);
          console.log(`Performance bonus achieved: +${bonusEarned}%, total: ${newBonus}%`);
        }
      }
      
      setIsOoweeProcessing(false);
    }
  };

  const handlePlayAgain = () => {
    // Reset everything and go back to join screen
    setJoinedGame(null);
    setCurrentPlayer(null);
    setPlayers([]);
    setGameStatus('waiting');
    setGameWinner(null);
    setOoweeClicks(0);
    setGameId('');
    setPlayerName('');
  };

  // Show victory screen if game is completed
  if (gameStatus === 'completed' && gameWinner && currentPlayer?.role) {
    return (
      <VictoryScreen 
        winner={gameWinner}
        playerRole={currentPlayer.role}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  // If player has joined a game, show the appropriate view
  if (joinedGame && currentPlayer) {
    // If game is in progress and player has a role, show role card
    if (gameStatus === 'in_progress' && currentPlayer.role) {
      return (
        <View style={styles.container}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleLeaveGame}
              >
                <ArrowLeft size={20} color="#475569" strokeWidth={1.5} />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.title}>Your Role</Text>
                <Text style={styles.subtitle}>Game: {joinedGame.game_code}</Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>

            {/* Role Card */}
            <RoleCard 
              role={currentPlayer.role} 
              playerName={currentPlayer.name} 
              performanceBonus={currentPlayer.performance_bonus}
            />

            {/* Elimination Status */}
            {!currentPlayer.is_alive && (
              <View style={styles.eliminationOverlay}>
                <View style={styles.eliminationCard}>
                  <View style={styles.eliminationIconContainer}>
                    <XCircle size={48} color="#dc2626" strokeWidth={1.5} />
                  </View>
                  <Text style={styles.eliminationTitle}>You Have Been Eliminated</Text>
                  <Text style={styles.eliminationMessage}>
                    You have been permanently reassigned to external opportunities. 
                    Your performance review indicated that your services are no longer 
                    required by Goldman Sachs.
                  </Text>
                  <Text style={styles.eliminationNote}>
                    You may continue to observe the game, but can no longer participate 
                    in company decisions.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    // Show lobby view if game is waiting
    return (
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleLeaveGame}
            >
              <ArrowLeft size={20} color="#475569" strokeWidth={1.5} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Game Lobby</Text>
              <Text style={styles.subtitle}>Waiting for host to start</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Game Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Game: {joinedGame.game_code}</Text>
              <View style={[styles.statusBadge, gameStatus === 'in_progress' && styles.statusBadgeActive]}>
                <Text style={[styles.statusBadgeText, gameStatus === 'in_progress' && styles.statusBadgeTextActive]}>
                  {gameStatus === 'waiting' ? 'Waiting' : gameStatus === 'in_progress' ? 'In Progress' : 'Completed'}
                </Text>
              </View>
            </View>
            <Text style={styles.statusDescription}>
              {gameStatus === 'waiting' 
                ? 'Waiting for all players to join and host to start the game'
                : gameStatus === 'in_progress'
                ? 'Game is in progress - follow the instructions from your host'
                : 'Game has ended'
              }
            </Text>
          </View>

          {/* Player Info Card */}
          <View style={styles.playerInfoCard}>
            <View style={styles.playerInfoHeader}>
              <User size={20} color="#8BB4D8" strokeWidth={1.5} />
              <Text style={styles.playerInfoTitle}>Your Info</Text>
            </View>
            <View style={styles.playerInfoContent}>
              <Text style={styles.playerInfoName}>{currentPlayer.name}</Text>
              <Text style={styles.playerInfoJoined}>
                Joined {formatTimeAgo(currentPlayer.joined_at)} ago
              </Text>
            </View>
          </View>

          {/* Players List */}
          <View style={styles.playersCard}>
            <View style={styles.playersHeader}>
              <View style={styles.playersTitleContainer}>
                <Users size={20} color="#475569" strokeWidth={1.5} style={{ marginRight: 12 }} />
                <Text style={styles.playersTitle}>Players</Text>
              </View>
              <View style={styles.playersBadge}>
                <Text style={styles.playersBadgeText}>{players.length}</Text>
              </View>
            </View>
            
            <View style={styles.playersList}>
              {players.map((player, index) => (
                <View key={player.id} style={styles.playerItem}>
                  <View style={styles.playerContent}>
                    <View style={styles.playerNumber}>
                      <Text style={styles.playerNumberText}>
                        {String(index + 1).padStart(2, "0")}
                      </Text>
                    </View>
                    <View style={styles.playerInfo}>
                      <View style={styles.playerNameRow}>
                        <Text style={[styles.playerName, player.id === currentPlayer.id && styles.currentPlayerName]}>
                          {player.name} {player.id === currentPlayer.id && '(You)'}
                        </Text>
                        {player.performance_bonus > 0 && (
                          <View style={styles.performanceBadge}>
                            <Text style={styles.performanceBadgeText}>
                              +{player.performance_bonus}% performance bonus
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.playerJoinTime}>
                        Joined {formatTimeAgo(player.joined_at)} ago
                      </Text>
                    </View>
                  </View>
                  <View style={styles.playerStatus} />
                </View>
              ))}
            </View>
          </View>

          {/* Waiting Message */}
          <View style={styles.waitingCard}>
            <Clock size={48} color="#8BB4D8" strokeWidth={1.5} />
            <Text style={styles.waitingTitle}>Waiting for Host</Text>
            <Text style={styles.waitingDescription}>
              The host will start the game when all players have joined. 
              Stay on this screen to receive updates.
            </Text>
            
            {/* Debug Info */}
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info:</Text>
              <Text style={styles.debugText}>Game Status: {gameStatus}</Text>
              <Text style={styles.debugText}>Game ID: {joinedGame?.id}</Text>
              <Text style={styles.debugText}>Player Role: {currentPlayer?.role || 'None'}</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={async () => {
                  if (joinedGame) {
                    // Manually refresh game status
                    const { data: gameData } = await supabase
                      .from('games')
                      .select('*')
                      .eq('id', joinedGame.id)
                      .single();
                    
                    if (gameData) {
                      setGameStatus(gameData.status);
                      console.log('🔄 Manual refresh - Game status:', gameData.status);
                    }
                    
                    // Refresh player data
                    const { data: playerData } = await supabase
                      .from('players')
                      .select('*')
                      .eq('id', currentPlayer?.id)
                      .single();
                    
                    if (playerData) {
                      setCurrentPlayer(playerData);
                      console.log('🔄 Manual refresh - Player role:', playerData.role);
                    }
                  }
                }}
              >
                <Text style={styles.refreshButtonText}>Refresh Status</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hidden Oowee Button (Easter Egg) */}
          <View style={styles.easterEggContainer}>
            <TouchableOpacity
              style={[
                styles.ooweeButton,
                isOoweeProcessing && styles.ooweeButtonProcessing
              ]}
              onPress={handleOoweeClick}
              disabled={isOoweeProcessing || gameStatus !== 'waiting'}
            >
              <Text style={styles.ooweeButtonText}>
                {isOoweeProcessing ? '...' : 'Oowee'}
              </Text>
            </TouchableOpacity>
            {ooweeClicks > 0 && (
              <Text style={styles.clickCounter}>
                {ooweeClicks} click{ooweeClicks !== 1 ? 's' : ''} 
                {currentPlayer?.performance_bonus ? ` • ${currentPlayer.performance_bonus}% total bonus!` : ''}
                {(ooweeClicks % 10) !== 0 ? ` • ${10 - (ooweeClicks % 10)} more for next bonus` : ''}
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Show join form if not yet joined
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/')}
        >
          <ArrowLeft size={20} color="#475569" strokeWidth={1.5} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Join Session</Text>
          <Text style={styles.subtitle}>Enter session details</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* QR Scanner Section */}
      <View style={styles.qrScannerCard}>
        <View style={styles.qrScannerHeader}>
          <View style={styles.qrScannerTitleContainer}>
            <Camera size={20} color="#8BB4D8" strokeWidth={1.5} style={{ marginRight: 12 }} />
            <Text style={styles.qrScannerTitle}>Quick Access</Text>
          </View>
        </View>
        
        <View style={styles.qrScannerContent}>
          <View style={styles.qrScannerDisplay}>
            <View style={styles.phoneIcon}>
              <Smartphone size={48} color="white" strokeWidth={1.5} />
            </View>
            <Text style={styles.qrScannerText}>
              Use your device camera to scan the session QR code
            </Text>
            <TouchableOpacity style={styles.activateCameraButton}>
              <View style={styles.activateCameraContent}>
                <Camera size={16} color="#475569" strokeWidth={1.5} style={{ marginRight: 12 }} />
                <Text style={styles.activateCameraText}>Camera Coming Soon</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Manual Entry</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Manual Entry */}
      <View style={styles.manualEntryCard}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Session Identifier</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter session ID (e.g., GSI076)"
            placeholderTextColor="#94a3b8"
            value={gameId}
            onChangeText={setGameId}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name(e.g. Scar Doginton)"
            placeholderTextColor="#94a3b8"
            value={playerName}
            onChangeText={setPlayerName}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.joinButton, (!gameId || !playerName || loading) && styles.joinButtonDisabled]}
          disabled={!gameId || !playerName || loading}
          onPress={handleJoinGame}
        >
          <View style={styles.joinButtonContent}>
            <User size={16} color="white" strokeWidth={1.5} style={{ marginRight: 12 }} />
            <Text style={styles.joinButtonText}>
              {loading ? 'Joining...' : 'Join Session'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer Note */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Ensure you have the correct session identifier from your host
        </Text>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Light background (slate-50)
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40, // Extra padding at bottom
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerSpacer: {
    width: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '300', // light
    color: '#0f172a', // slate-900
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '300', // light
    color: '#475569', // slate-600
  },
  // Lobby view styles
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#0f172a',
  },
  statusBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadgeTextActive: {
    color: '#166534',
  },
  statusDescription: {
    fontSize: 14,
    fontWeight: '300',
    color: '#64748b',
    lineHeight: 20,
  },
  playerInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  playerInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerInfoTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#0f172a',
    marginLeft: 12,
  },
  playerInfoContent: {
    paddingLeft: 32,
  },
  playerInfoName: {
    fontSize: 20,
    fontWeight: '300',
    color: '#0f172a',
    marginBottom: 4,
  },
  playerInfoJoined: {
    fontSize: 14,
    fontWeight: '300',
    color: '#64748b',
  },
  playersCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  playersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
  },
  playersTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playersTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#0f172a',
  },
  playersBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  playersBadgeText: {
    fontSize: 14,
    fontWeight: '300',
    color: '#374151',
  },
  playersList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  playerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerNumber: {
    width: 40,
    height: 40,
    backgroundColor: '#8BB4D8',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  playerNumberText: {
    fontSize: 14,
    fontWeight: '300',
    color: '#ffffff',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '300',
    color: '#0f172a',
    marginBottom: 2,
  },
  currentPlayerName: {
    fontWeight: '500',
    color: '#8BB4D8',
  },
  playerJoinTime: {
    fontSize: 12,
    fontWeight: '300',
    color: '#64748b',
  },
  playerStatus: {
    width: 8,
    height: 8,
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  waitingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  waitingTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  waitingDescription: {
    fontSize: 14,
    fontWeight: '300',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Join form styles
  qrScannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  qrScannerHeader: {
    padding: 24,
    paddingBottom: 16,
  },
  qrScannerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrScannerTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#0f172a',
  },
  qrScannerContent: {
    padding: 24,
    paddingTop: 0,
  },
  qrScannerDisplay: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
  },
  phoneIcon: {
    width: 96,
    height: 96,
    backgroundColor: '#8BB4D8',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  qrScannerText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  activateCameraButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  activateCameraContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activateCameraText: {
    fontSize: 14,
    fontWeight: '300',
    color: '#475569',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
  },
  manualEntryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '300',
    color: '#374151',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#0f172a',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '300',
  },
  joinButton: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: '300',
    color: '#ffffff',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#64748b',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  // Easter egg styles
  easterEggContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingBottom: 60,
  },
  ooweeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    opacity: 0.3,
  },
  ooweeButtonProcessing: {
    opacity: 0.1,
  },
  ooweeButtonText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#64748b',
    textAlign: 'center',
  },
  clickCounter: {
    fontSize: 10,
    fontWeight: '300',
    color: '#8BB4D8',
    marginTop: 8,
    textAlign: 'center',
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceBadge: {
    backgroundColor: '#8BB4D8',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  performanceBadgeText: {
    fontSize: 10,
    fontWeight: '300',
    color: 'white',
  },
  
  // Elimination overlay styles
  eliminationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  eliminationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  eliminationIconContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eliminationTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  eliminationMessage: {
    fontSize: 16,
    fontWeight: '300',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  eliminationNote: {
    fontSize: 14,
    fontWeight: '300',
    color: '#8BB4D8',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  debugContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '300',
    color: '#475569',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#64748b',
    marginBottom: 4,
  },
  refreshButton: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#ffffff',
  },
}); 