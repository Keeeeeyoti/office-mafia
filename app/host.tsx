import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Smartphone, QrCode, Users } from 'lucide-react-native';
import { supabase, Game, Player } from '../utils/supabaseClient';
import { createGame, getGamePlayers, generateHostId, generateQRCodeData, generateQRCodeSVG, formatTimeAgo, updateGameStatus, assignRolesToPlayers, eliminatePlayer, revivePlayer, updateGamePhase } from '../utils/gameHelpers';
import { getScriptByPhase, determineGameWinner, ModeratorScript } from '../utils/moderatorScripts';

export default function HostPage() {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [hostId, setHostId] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [gamePhase, setGamePhase] = useState<'lobby' | 'in_progress' | 'completed'>('lobby');
  const [currentPhase, setCurrentPhase] = useState<'intro' | 'night' | 'day' | 'end'>('intro');
  const [currentScript, setCurrentScript] = useState<ModeratorScript | null>(null);
  const [gameWinner, setGameWinner] = useState<'employees' | 'rogue' | null>(null);

  const createNewGame = async () => {
    setLoading(true);
    console.log('🚀 Creating new host game...');
    
    const newHostId = generateHostId();
    console.log('👤 Generated hostId:', newHostId);
    setHostId(newHostId);
    
    console.log('🎮 Creating game...');
    const { game: newGame, error } = await createGame(newHostId);
    
    if (error) {
      console.error('❌ Host game creation failed:', error);
      Alert.alert('Error', `Failed to create game: ${error}`);
      setLoading(false);
      return;
    }
    
    if (newGame) {
      console.log('✅ Host game created successfully:', newGame);
      setGame(newGame);
      
      // Generate QR code
      const qrData = generateQRCodeData(newGame.game_code);
      const qrUrl = generateQRCodeSVG(qrData, 192);
      setQrCodeUrl(qrUrl);
      console.log('🔗 QR code generated:', qrUrl);
      
      // Load initial players (should be empty)
      const { players: initialPlayers } = await getGamePlayers(newGame.id);
      setPlayers(initialPlayers);
      console.log('👥 Initial players loaded:', initialPlayers.length);
    }
    
    setLoading(false);
    console.log('✅ Host game creation complete');
  };

  useEffect(() => {
    if (!game) return;

    console.log('🔌 HOST: Setting up real-time subscriptions for game:', game.game_code, 'ID:', game.id);

    // Load initial players immediately
    const loadInitialPlayers = async () => {
      console.log('📋 HOST: Loading initial players...');
      const { players: initialPlayers } = await getGamePlayers(game.id);
      console.log('📋 HOST: Initial players loaded:', initialPlayers.map(p => ({
        name: p.name,
        id: p.id,
        joined_at: p.joined_at
      })));
      setPlayers(initialPlayers);
    };
    
    loadInitialPlayers();

    // Subscribe to real-time player updates
    const playersSubscription = supabase
      .channel(`host-players-${game.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `game_id=eq.${game.id}`,
      }, async (payload) => {
        console.log('👥 HOST: Player update received:', payload.eventType, payload.new || payload.old);
        
        // Refresh player list when changes occur
        const { players: updatedPlayers } = await getGamePlayers(game.id);
        console.log('📋 HOST: Updated players list:', updatedPlayers.map(p => ({
          name: p.name,
          role: p.role,
          is_alive: p.is_alive
        })));
        setPlayers(updatedPlayers);
      })
      .subscribe((status, err) => {
        console.log('👥 HOST: Players subscription status:', status);
        if (err) {
          console.error('❌ HOST: Subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ HOST: Successfully subscribed to player updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ HOST: Channel error - real-time updates may not work. Use manual refresh.');
        }
      });

    return () => {
      console.log('🔌 HOST: Cleaning up subscriptions');
      playersSubscription.unsubscribe();
    };
  }, [game]);

  // Auto-check for game end conditions
  useEffect(() => {
    if (gamePhase === 'in_progress' && players.length > 0) {
      // Only check if all players have roles assigned
      const playersWithRoles = players.filter(p => p.role && p.role !== null);
      if (playersWithRoles.length === players.length) {
        console.log('🎯 Checking game end conditions - all players have roles');
        checkGameEnd();
      } else {
        console.log('⏳ Waiting for all players to get roles assigned...', {
          total: players.length,
          withRoles: playersWithRoles.length
        });
      }
    }
  }, [players, gamePhase]);

  const handleStartGame = async () => {
    if (!game || players.length < 3) return;

    try {
      console.log('🎮 Starting game with role assignment...');
      
      // Step 1: Assign roles to all players
      const { success: roleSuccess, error: roleError } = await assignRolesToPlayers(game.id);
      
      if (!roleSuccess || roleError) {
        Alert.alert('Error', `Failed to assign roles: ${roleError}`);
        return;
      }
      
      // Step 2: Update game status to in progress
      const { error: statusError } = await updateGameStatus(game.id, 'in_progress', 'night');
      
      if (statusError) {
        Alert.alert('Error', `Failed to start game: ${statusError}`);
        return;
      }

      console.log('🎉 Game started successfully with roles assigned!');
      setGamePhase('in_progress');
      setCurrentPhase('intro');
      
      // Load initial script
      const introScript = getScriptByPhase('intro');
      setCurrentScript(introScript);
      
      Alert.alert('Game Started!', `Roles have been assigned to ${players.length} players. Read the introduction script to begin!`);
      
    } catch (error) {
      console.error('❌ Error starting game:', error);
      Alert.alert('Error', 'An unexpected error occurred while starting the game.');
    }
  };

  const copyGameCode = () => {
    if (game) {
      // For web, we can use the Clipboard API if available
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(game.game_code);
        Alert.alert('Copied!', 'Game code copied to clipboard');
      } else {
        Alert.alert('Game Code', `Share this code with players: ${game.game_code}`);
      }
    }
  };

  const handleEliminatePlayer = async (player: Player) => {
    console.log('🚨 Showing elimination confirmation dialog for:', player.name);
    
    // Use browser's native confirm dialog for web compatibility
    const confirmed = confirm(`Are you sure you want to eliminate ${player.name}?`);
    
    if (confirmed) {
      console.log('🔥 Eliminating player:', player.name, 'with ID:', player.id);
      const { success, error } = await eliminatePlayer(player.id);
      if (success) {
        console.log('✅ Player eliminated successfully:', player.name);
        
        // Manually refresh the players list to see immediate update
        console.log('🔄 Refreshing players list after elimination...');
        const { players: updatedPlayers } = await getGamePlayers(game!.id);
        console.log('📋 Players after elimination:', updatedPlayers.map(p => ({
          name: p.name,
          is_alive: p.is_alive
        })));
        setPlayers(updatedPlayers);
        
        // Show elimination script
        showEliminationScript(player);
        checkGameEnd();
      } else {
        console.log('❌ Failed to eliminate player:', error);
        alert(`Error: ${error || 'Failed to eliminate player'}`);
      }
    } else {
      console.log('❌ Elimination cancelled for:', player.name);
    }
  };

  const showEliminationScript = (eliminatedPlayer: Player) => {
    // Get the elimination script and customize it
    const eliminationScript = getScriptByPhase('elimination');
    if (eliminationScript) {
      // Substitute player name and role in the script
      const roleNames = {
        'employee': 'Employee',
        'rogue': 'Rogue Employee', 
        'audit': 'Audit Department',
        'hr': 'HR Department'
      };
      
      const customizedScript = {
        ...eliminationScript,
        content: eliminationScript.content
          .replace('[PLAYER NAME]', eliminatedPlayer.name)
          .replace('[ROLE]', roleNames[eliminatedPlayer.role as keyof typeof roleNames] || eliminatedPlayer.role || 'Unknown')
      };
      
      // Set this as the current script to display
      setCurrentScript(customizedScript);
      console.log('📋 Showing elimination script for:', eliminatedPlayer.name);
    }
  };

  const handleRevivePlayer = async (player: Player) => {
    console.log('🔄 Reviving player:', player.name, 'with ID:', player.id);
    const { success, error } = await revivePlayer(player.id);
    if (success) {
      console.log('✅ Player revived successfully:', player.name);
      
      // Manually refresh the players list to see immediate update
      console.log('🔄 Refreshing players list after revival...');
      const { players: updatedPlayers } = await getGamePlayers(game!.id);
      console.log('📋 Players after revival:', updatedPlayers.map(p => ({
        name: p.name,
        is_alive: p.is_alive
      })));
      setPlayers(updatedPlayers);
      
      Alert.alert('Player Revived', `${player.name} has been brought back to the game.`);
    } else {
      console.log('❌ Failed to revive player:', error);
      Alert.alert('Error', error || 'Failed to revive player');
    }
  };

  const changePhase = async (newPhase: 'intro' | 'night' | 'day' | 'elimination') => {
    if (!game) return;
    
    // Only update current phase for game phases, not elimination script
    if (newPhase !== 'elimination') {
      setCurrentPhase(newPhase as 'intro' | 'night' | 'day');
      // Update database phase
      await updateGamePhase(game.id, newPhase === 'intro' ? 'lobby' : newPhase as 'night' | 'day');
    }
    
    const script = getScriptByPhase(newPhase);
    setCurrentScript(script);
  };

  const checkGameEnd = () => {
    console.log('🔍 Checking game end conditions with players:', players.map(p => ({
      name: p.name, 
      role: p.role, 
      is_alive: p.is_alive
    })));
    
    const winner = determineGameWinner(players);
    console.log('🏆 Game winner determined:', winner);
    
    if (winner) {
      console.log('🎉 Game ending with winner:', winner);
      setGameWinner(winner);
      setGamePhase('completed');
      
      // Load victory script based on winner
      const victoryPhase = winner === 'employees' ? 'victory_employees' : 'victory_rogue';
      const victoryScript = getScriptByPhase(victoryPhase);
      setCurrentScript(victoryScript);
      setCurrentPhase('day'); // Keep UI phase as 'day' for consistency
      
      // Update game status to completed
      if (game) {
        updateGameStatus(game.id, 'completed', 'end');
      }
    } else {
      console.log('⏸️ No winner yet - game continues');
    }
  };

  const endGame = async () => {
    if (!game) return;
    
    Alert.alert(
      'End Game',
      'Are you sure you want to end the game? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Game',
          style: 'destructive',
          onPress: async () => {
            await updateGameStatus(game.id, 'completed', 'end');
            setGamePhase('completed');
            Alert.alert('Game Ended', 'The game has been ended. Thank you for playing!');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Creating game session...</Text>
      </View>
    );
  }

  // Show pre-hosting screen when no game exists yet
  if (!game) {
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
              onPress={() => router.push('/')}
            >
              <ArrowLeft size={20} color="#475569" strokeWidth={1.5} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Host Game</Text>
              <Text style={styles.subtitle}>Create a new game session</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Pre-hosting Info Card */}
          <View style={styles.preHostCard}>
            <View style={styles.preHostIconContainer}>
              <Users size={48} color="#8BB4D8" strokeWidth={1.5} />
            </View>
            <Text style={styles.preHostTitle}>Ready to Host?</Text>
            <Text style={styles.preHostDescription}>
              Create a new Office Mafia game session. You'll get a unique game code that players can use to join.
            </Text>
            
            <View style={styles.preHostFeatures}>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>•</Text>
                <Text style={styles.featureText}>Generate unique session code</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>•</Text>
                <Text style={styles.featureText}>QR code for easy joining</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>•</Text>
                <Text style={styles.featureText}>Moderator tools and scripts</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureBullet}>•</Text>
                <Text style={styles.featureText}>Real-time player management</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.createGameButton}
              onPress={createNewGame}
              disabled={loading}
            >
              <Text style={styles.createGameButtonText}>
                {loading ? 'Creating Session...' : 'Create New Game'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Show different UI based on game phase
  if (gamePhase === 'completed') {
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
              onPress={() => router.push('/')}
            >
              <ArrowLeft size={20} color="#475569" strokeWidth={1.5} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Game Complete</Text>
              <Text style={styles.subtitle}>Final Results</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Game Completion Card */}
          <View style={styles.gameCompletionCard}>
            <View style={styles.completionIconContainer}>
              <Users size={48} color="#8BB4D8" strokeWidth={1.5} />
            </View>
            
            <Text style={styles.completionTitle}>
              {gameWinner === 'employees' ? 'Company Saved!' : 'Corporate Takeover!'}
            </Text>
            
            <Text style={styles.completionSubtitle}>
              {gameWinner === 'employees' 
                ? 'The loyal employees have identified and eliminated all rogue threats. Goldman Sachs maintains its reputation for integrity and excellence.'
                : 'The rogue employees have successfully infiltrated and taken control of the organization. Corporate restructuring is now underway.'
              }
            </Text>

            {/* Game Summary */}
            <View style={styles.gameSummary}>
              <Text style={styles.summaryTitle}>Game Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Game Code:</Text>
                <Text style={styles.summaryValue}>{game?.game_code}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Players:</Text>
                <Text style={styles.summaryValue}>{players.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Winner:</Text>
                <Text style={[styles.summaryValue, { color: gameWinner === 'employees' ? '#8BB4D8' : '#dc2626' }]}>
                  {gameWinner === 'employees' ? 'Company Team' : 'Rogue Team'}
                </Text>
              </View>
            </View>

            {/* Final Player List */}
            <View style={styles.finalPlayersList}>
              <Text style={styles.finalPlayersTitle}>Final Player Status</Text>
              {players.map((player, index) => (
                <View key={player.id} style={styles.finalPlayerItem}>
                  <View style={styles.finalPlayerNumber}>
                    <Text style={styles.finalPlayerNumberText}>
                      {String(index + 1).padStart(2, "0")}
                    </Text>
                  </View>
                  <View style={styles.finalPlayerInfo}>
                    <Text style={styles.finalPlayerName}>{player.name}</Text>
                    <Text style={styles.finalPlayerRole}>
                      {player.role ? `${player.role.charAt(0).toUpperCase()}${player.role.slice(1)}` : 'No role'}
                    </Text>
                  </View>
                  <View style={[
                    styles.finalPlayerStatus,
                    { backgroundColor: player.is_alive ? '#10b981' : '#dc2626' }
                  ]}>
                    <Text style={styles.finalPlayerStatusText}>
                      {player.is_alive ? 'Alive' : 'Eliminated'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.completionActions}>
              <TouchableOpacity 
                style={styles.newGameButton} 
                onPress={() => {
                  // Reset all state and go back to pre-hosting screen
                  setGame(null);
                  setPlayers([]);
                  setGamePhase('lobby');
                  setGameWinner(null);
                  setCurrentScript(null);
                  setHostId('');
                  setQrCodeUrl('');
                }}
              >
                <Text style={styles.newGameButtonText}>Host Another Game</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.homeButton} 
                onPress={() => router.push('/')}
              >
                <Text style={styles.homeButtonText}>Return Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (gamePhase === 'in_progress') {
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
              onPress={() => router.push('/')}
            >
              <ArrowLeft size={20} color="#475569" strokeWidth={1.5} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Game in Progress</Text>
              <Text style={styles.subtitle}>Moderator Dashboard</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Game Info */}
          <View style={styles.gameInfoCard}>
            <Text style={styles.gameInfoTitle}>Game: {game?.game_code}</Text>
            <Text style={styles.gameInfoSubtitle}>{players.length} players participating</Text>
          </View>

          {/* Player List with Roles */}
          <View style={styles.playersCard}>
            <View style={styles.playersHeader}>
              <Text style={styles.playersTitle}>Player Status</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={async () => {
                  if (game) {
                    console.log('🔄 HOST: Manual refresh requested');
                    const { players: refreshedPlayers } = await getGamePlayers(game.id);
                    console.log('🔄 HOST: Manual refresh result:', refreshedPlayers.map(p => ({
                      name: p.name,
                      role: p.role,
                      is_alive: p.is_alive
                    })));
                    setPlayers(refreshedPlayers);
                  }
                }}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.participantsList}>
              {players.map((player, index) => (
                <View key={player.id} style={styles.playerItemInGame}>
                  <View style={styles.playerContent}>
                    <View style={styles.playerNumber}>
                      <Text style={styles.playerNumberText}>
                        {String(index + 1).padStart(2, "0")}
                      </Text>
                    </View>
                    <View style={styles.playerInfo}>
                      <View style={styles.playerNameRowHost}>
                        <Text style={styles.playerName}>{player.name}</Text>
                        {player.performance_bonus > 0 && (
                          <View style={styles.performanceBadgeHost}>
                            <Text style={styles.performanceBadgeTextHost}>
                              +{player.performance_bonus}% performance bonus
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.playerRole}>
                        {player.role ? `${player.role.charAt(0).toUpperCase()}${player.role.slice(1)}` : 'No role'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.playerActions}>
                    {player.is_alive ? (
                      <TouchableOpacity 
                        style={styles.eliminateButton}
                        onPress={() => {
                          console.log('Fire button pressed for:', player.name);
                          handleEliminatePlayer(player);
                        }}
                      >
                        <Text style={styles.eliminateButtonText}>Fire</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={styles.reviveButton}
                        onPress={() => {
                          console.log('Rehire button pressed for:', player.name);
                          handleRevivePlayer(player);
                        }}
                      >
                        <Text style={styles.reviveButtonText}>Rehire</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={[
                    styles.playerStatus, 
                    { backgroundColor: player.is_alive ? '#8BB4D8' : '#dc2626' }
                  ]} />
                </View>
              ))}
            </View>
          </View>

          {/* Moderator Script System */}
          {currentScript && (
            <View style={[
              styles.scriptCard,
              currentScript.phase === 'elimination' && styles.eliminationScriptCard
            ]}>
              <View style={styles.scriptHeader}>
                <Text style={styles.scriptTitle}>{currentScript.title}</Text>
                <View style={[
                  styles.phaseIndicator,
                  currentScript.phase === 'elimination' && styles.eliminationPhaseIndicator
                ]}>
                  <Text style={[
                    styles.phaseText,
                    currentScript.phase === 'elimination' && styles.eliminationPhaseText
                  ]}>
                    {currentScript.phase === 'elimination' ? 'ELIMINATION' : currentPhase.toUpperCase()}
                  </Text>
                </View>
              </View>
              <ScrollView style={styles.scriptContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.scriptText}>{currentScript.content}</Text>
              </ScrollView>
              {currentScript.phase === 'elimination' && (
                <View style={styles.eliminationNote}>
                  <Text style={styles.eliminationNoteText}>
                    💡 This script is automatically shown when you eliminate a player, or you can access it manually here.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Phase Controls */}
          {gamePhase === 'in_progress' && (
            <View style={styles.controlsCard}>
              <View style={styles.controlsHeader}>
                <Text style={styles.controlsTitle}>Game Controls</Text>
              </View>
              <View style={styles.phaseButtons}>
                <TouchableOpacity 
                  style={[styles.phaseButton, currentPhase === 'intro' && styles.phaseButtonActive]}
                  onPress={() => changePhase('intro')}
                >
                  <Text style={[styles.phaseButtonText, currentPhase === 'intro' && styles.phaseButtonTextActive]}>
                    Introduction
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.phaseButton, currentPhase === 'night' && styles.phaseButtonActive]}
                  onPress={() => changePhase('night')}
                >
                  <Text style={[styles.phaseButtonText, currentPhase === 'night' && styles.phaseButtonTextActive]}>
                    Night Phase
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.phaseButton, currentPhase === 'day' && styles.phaseButtonActive]}
                  onPress={() => changePhase('day')}
                >
                  <Text style={[styles.phaseButtonText, currentPhase === 'day' && styles.phaseButtonTextActive]}>
                    Day Phase
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.phaseButton}
                  onPress={() => {
                    // Show generic elimination script template
                    const eliminationScript = getScriptByPhase('elimination');
                    if (eliminationScript) {
                      setCurrentScript(eliminationScript);
                    }
                  }}
                >
                  <Text style={styles.phaseButtonText}>
                    Elimination Script
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.endGameButton} onPress={endGame}>
                <Text style={styles.endGameButtonText}>End Game</Text>
              </TouchableOpacity>
            </View>
          )}


        </ScrollView>
      </View>
    );
  }

  // Show lobby view
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
          onPress={() => router.push('/')}
        >
          <ArrowLeft size={20} color="#475569" strokeWidth={1.5} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Game Session</Text>
          <Text style={styles.subtitle}>Managing experience</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Game ID Section */}
      <View style={styles.gameIdCard}>
        <View style={styles.gameIdContent}>
          <View style={styles.qrIconContainer}>
            <Smartphone size={32} color="white" strokeWidth={1.5} />
          </View>
          <Text style={styles.gameIdLabel}>Session Identifier</Text>
          <View style={styles.gameIdContainer}>
            <Text style={styles.gameIdText}>{game.game_code}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={copyGameCode}>
              <Text style={styles.copyIcon}>📋</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* QR Code Display */}
      <View style={styles.qrCard}>
        <View style={styles.qrDisplay}>
          <View style={styles.qrCodeContainer}>
            {qrCodeUrl ? (
              <Image 
                source={{ uri: qrCodeUrl }} 
                style={styles.qrCodeImage}
                resizeMode="contain"
              />
            ) : (
              <QrCode size={96} color="#e2e8f0" strokeWidth={1} />
            )}
          </View>
          <Text style={styles.qrInstructions}>Participants scan to join session</Text>
        </View>
      </View>

      {/* Participants Section */}
      <View style={styles.participantsCard}>
        <View style={styles.participantsHeader}>
          <View style={styles.participantsTitleContainer}>
            <Users size={20} color="#475569" strokeWidth={1.5} style={{ marginRight: 12 }} />
            <Text style={styles.participantsTitle}>Participants</Text>
          </View>
          <View style={styles.participantsBadge}>
            <Text style={styles.participantsBadgeText}>{players.length}</Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={async () => {
              if (game) {
                console.log('🔄 HOST LOBBY: Manual refresh requested');
                const { players: refreshedPlayers } = await getGamePlayers(game.id);
                console.log('🔄 HOST LOBBY: Manual refresh result:', refreshedPlayers.map(p => ({
                  name: p.name,
                  id: p.id,
                  joined_at: p.joined_at
                })));
                setPlayers(refreshedPlayers);
              }
            }}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.participantsList}>
          {players.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>--</Text>
              </View>
              <Text style={styles.emptyText}>Awaiting participants...</Text>
            </View>
          ) : (
            players.map((player, index) => (
              <View key={player.id} style={styles.playerItem}>
                <View style={styles.playerContent}>
                  <View style={styles.playerNumber}>
                    <Text style={styles.playerNumberText}>
                      {String(index + 1).padStart(2, "0")}
                    </Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <View style={styles.playerNameRowHost}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      {player.performance_bonus > 0 && (
                        <View style={styles.performanceBadgeHost}>
                          <Text style={styles.performanceBadgeTextHost}>
                            +{player.performance_bonus}% performance bonus
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.playerJoinTime}>Joined {formatTimeAgo(player.joined_at)} ago</Text>
                  </View>
                </View>
                <View style={styles.playerStatus} />
              </View>
            ))
          )}
        </View>
      </View>

      {/* Debug Panel for Host */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Host Debug Info:</Text>
        <Text style={styles.debugText}>Game ID: {game?.id}</Text>
        <Text style={styles.debugText}>Game Code: {game?.game_code}</Text>
        <Text style={styles.debugText}>Players in State: {players.length}</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={async () => {
            if (game) {
              console.log('🔄 HOST DEBUG: Manual refresh requested');
              const { players: refreshedPlayers } = await getGamePlayers(game.id);
              console.log('🔄 HOST DEBUG: Database players found:', refreshedPlayers.length);
              refreshedPlayers.forEach((player, index) => {
                console.log(`Player ${index + 1}: ${player.name} (${player.id})`);
              });
              setPlayers(refreshedPlayers);
            }
          }}
        >
          <Text style={styles.refreshButtonText}>Force Refresh Players</Text>
        </TouchableOpacity>
      </View>

      {/* Start Session Button */}
      <TouchableOpacity
        style={[styles.startButton, players.length < 3 && styles.startButtonDisabled]}
        disabled={players.length < 3}
        onPress={handleStartGame}
      >
        <View style={styles.startButtonContent}>
          <Text style={styles.startButtonIcon}>▶️</Text>
          <Text style={styles.startButtonText}>Initiate Session</Text>
          {players.length < 3 && (
            <Text style={styles.startButtonNote}>
              ({3 - players.length} more required)
            </Text>
          )}
        </View>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Light background (slate-50)
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '300',
    color: '#475569',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '300',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '300',
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
  gameIdCard: {
    backgroundColor: '#1e293b', // slate-800
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Shadow for Android
    elevation: 8,
  },
  gameIdContent: {
    alignItems: 'center',
  },
  qrIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#8BB4D8', // gs-blue
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gameIdLabel: {
    fontSize: 14,
    fontWeight: '300',
    color: '#ffffff',
    opacity: 0.7,
    marginBottom: 8,
  },
  gameIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameIdText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#ffffff',
    letterSpacing: 2,
    marginRight: 12,
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  copyIcon: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.7,
  },
  qrCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    // Shadow for Android
    elevation: 4,
  },
  qrDisplay: {
    alignItems: 'center',
  },
  qrCodeContainer: {
    width: 192,
    height: 192,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    // Inner shadow effect
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  qrCodeImage: {
    width: 160,
    height: 160,
  },
  qrCodeIcon: {
    fontSize: 64,
    color: '#8BB4D8', // gs-blue
  },
  qrInstructions: {
    fontSize: 16,
    fontWeight: '300',
    color: '#475569', // slate-600
    textAlign: 'center',
  },
  participantsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 24,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    // Shadow for Android
    elevation: 4,
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
  },
  participantsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsIcon: {
    fontSize: 20,
    color: '#8BB4D8', // gs-blue
    marginRight: 12,
  },
  participantsTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#0f172a', // slate-900
  },
  participantsBadge: {
    backgroundColor: '#f1f5f9', // slate-100
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  participantsBadgeText: {
    fontSize: 14,
    fontWeight: '300',
    color: '#374151', // slate-700
  },
  participantsList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#8BB4D8', // gs-blue
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 32,
    color: '#ffffff',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#64748b', // slate-500
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9', // slate-100
  },
  playerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerNumber: {
    width: 40,
    height: 40,
    backgroundColor: '#8BB4D8', // gs-blue
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
    color: '#0f172a', // slate-900
    marginBottom: 2,
  },
  playerJoinTime: {
    fontSize: 12,
    fontWeight: '300',
    color: '#64748b', // slate-500
  },
  playerStatus: {
    width: 8,
    height: 8,
    backgroundColor: '#10b981', // emerald-400
    borderRadius: 4,
  },
  startButton: {
    backgroundColor: '#1e293b', // slate-800
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Shadow for Android
    elevation: 8,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startButtonIcon: {
    fontSize: 20,
    color: '#ffffff',
    marginRight: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '300',
    color: '#ffffff',
  },
  startButtonNote: {
    fontSize: 14,
    fontWeight: '300',
    color: '#ffffff',
    opacity: 0.75,
    marginLeft: 12,
  },
  
  // In-progress game styles
  gameInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    alignItems: 'center',
  },
  gameInfoTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#0f172a',
    marginBottom: 4,
  },
  gameInfoSubtitle: {
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
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  playersTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#0f172a',
  },
  playerItemInGame: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  playerRole: {
    fontSize: 12,
    fontWeight: '300',
    color: '#8BB4D8',
    textTransform: 'capitalize',
  },
  scriptCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  scriptTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#475569',
    marginBottom: 8,
  },
  scriptSubtitle: {
    fontSize: 14,
    fontWeight: '300',
    color: '#64748b',
  },
  playerNameRowHost: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceBadgeHost: {
    backgroundColor: '#8BB4D8',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  performanceBadgeTextHost: {
    fontSize: 9,
    fontWeight: '300',
    color: 'white',
  },
  
  // Player action buttons
  playerActions: {
    marginRight: 12,
  },
  eliminateButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  eliminateButtonText: {
    fontSize: 12,
    fontWeight: '300',
    color: 'white',
  },
  reviveButton: {
    backgroundColor: '#8BB4D8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  reviveButtonText: {
    fontSize: 12,
    fontWeight: '300',
    color: 'white',
  },
  
  // Moderator script styles
  scriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  phaseIndicator: {
    backgroundColor: '#8BB4D8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  phaseText: {
    fontSize: 12,
    fontWeight: '300',
    color: 'white',
    letterSpacing: 1,
  },
  scriptContent: {
    maxHeight: 300,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scriptText: {
    fontSize: 14,
    fontWeight: '300',
    color: '#374151',
    lineHeight: 20,
  },
  
  // Game controls
  controlsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    padding: 24,
  },
  controlsHeader: {
    marginBottom: 16,
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#0f172a',
  },
  phaseButtons: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  phaseButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  phaseButtonActive: {
    backgroundColor: '#8BB4D8',
    borderColor: '#8BB4D8',
  },
  phaseButtonText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#64748b',
  },
  phaseButtonTextActive: {
    color: 'white',
  },
  endGameButton: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  endGameButtonText: {
    fontSize: 16,
    fontWeight: '300',
    color: 'white',
  },
  
  // Victory screen
  victoryCard: {
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
  victoryTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
  },
  victorySubtitle: {
    fontSize: 16,
    fontWeight: '300',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  newGameButton: {
    backgroundColor: '#8BB4D8',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  newGameButtonText: {
    fontSize: 16,
    fontWeight: '300',
    color: 'white',
  },
  refreshButton: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#475569',
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#ffffff',
  },
  // Pre-hosting screen styles
  preHostCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  preHostIconContainer: {
    width: 96,
    height: 96,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  preHostTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },
  preHostDescription: {
    fontSize: 16,
    fontWeight: '300',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  preHostFeatures: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureBullet: {
    fontSize: 18,
    color: '#8BB4D8',
    marginRight: 12,
    width: 20,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '300',
    color: '#475569',
    flex: 1,
  },
  createGameButton: {
    backgroundColor: '#8BB4D8',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  createGameButtonText: {
    fontSize: 16,
    fontWeight: '300',
    color: 'white',
  },
  // Game completion screen styles
  gameCompletionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  completionIconContainer: {
    width: 96,
    height: 96,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignSelf: 'center',
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: 16,
    fontWeight: '300',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  gameSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '300',
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '300',
    color: '#0f172a',
  },
  finalPlayersList: {
    marginBottom: 32,
  },
  finalPlayersTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },
  finalPlayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  finalPlayerNumber: {
    width: 32,
    height: 32,
    backgroundColor: '#8BB4D8',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  finalPlayerNumberText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#ffffff',
  },
  finalPlayerInfo: {
    flex: 1,
  },
  finalPlayerName: {
    fontSize: 14,
    fontWeight: '300',
    color: '#0f172a',
    marginBottom: 2,
  },
  finalPlayerRole: {
    fontSize: 12,
    fontWeight: '300',
    color: '#64748b',
  },
  finalPlayerStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  finalPlayerStatusText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#ffffff',
  },
  completionActions: {
    gap: 12,
  },
  homeButton: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  homeButtonText: {
    fontSize: 14,
    fontWeight: '300',
    color: '#ffffff',
  },
  // Elimination script styles
  eliminationScriptCard: {
    borderColor: '#dc2626',
    borderWidth: 2,
  },
  eliminationPhaseIndicator: {
    backgroundColor: '#dc2626',
  },
  eliminationPhaseText: {
    color: '#ffffff',
  },
  eliminationNote: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  eliminationNoteText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#7f1d1d',
    textAlign: 'center',
  },
  // Debug panel styles (same as player screen)
  debugContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
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
}); 