import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GamePhase } from '../utils/supabaseClient';

interface PhaseBannerProps {
  phase: GamePhase;
  countdown?: number;
}

export function PhaseBanner({ phase, countdown }: PhaseBannerProps) {
  const phaseInfo = getPhaseInfo(phase);

  return (
    <View style={[styles.container, { backgroundColor: phaseInfo.color }]}>
      {phaseInfo.icon && <Text style={styles.phaseIcon}>{phaseInfo.icon}</Text>}
      <Text style={styles.phaseName}>{phaseInfo.name}</Text>
      <Text style={styles.phaseDescription}>{phaseInfo.description}</Text>
      {countdown && countdown > 0 && (
        <Text style={styles.countdown}>{countdown}s remaining</Text>
      )}
    </View>
  );
}

function getPhaseInfo(phase: GamePhase) {
  switch (phase) {
    case 'lobby':
      return {
        name: 'Lobby',
        icon: '',
        description: 'Waiting for players to join...',
        color: '#374151',
      };
    case 'night':
      return {
        name: 'Night Phase',
        icon: '',
        description: 'Special roles are taking action...',
        color: '#1f2937',
      };
    case 'day':
      return {
        name: 'Day Phase',
        icon: '',
        description: 'Discuss and decide who to vote out',
        color: '#fbbf24',
      };
    case 'voting':
      return {
        name: 'Voting Phase',
        icon: '',
        description: 'Time to vote for elimination',
        color: '#dc2626',
      };
    case 'end':
      return {
        name: 'Game Over',
        icon: '',
        description: 'The game has ended',
        color: '#7c3aed',
      };
    default:
      return {
        name: 'Unknown Phase',
        icon: '',
        description: 'Unknown game phase',
        color: '#6b7280',
      };
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  phaseIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  phaseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
    textAlign: 'center',
  },
  phaseDescription: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },
  countdown: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 10,
    fontWeight: '600',
  },
}); 