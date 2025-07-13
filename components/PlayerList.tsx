import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Player } from '../utils/supabaseClient';

interface PlayerListProps {
  players: Player[];
  showRoles?: boolean;
}

export function PlayerList({ players, showRoles = false }: PlayerListProps) {
  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={[styles.playerCard, !item.is_alive && styles.deadPlayer]}>
      <Text style={styles.playerName}>{item.name}</Text>
      {showRoles && item.role && (
        <Text style={styles.playerRole}>{getRoleDisplay(item.role)}</Text>
      )}
      {!item.is_alive && (
        <Text style={styles.deadLabel}>💀 Eliminated</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Players ({players.length})</Text>
      <FlatList
        data={players}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function getRoleDisplay(role: string): string {
  switch (role) {
    case 'employee':
      return '👔 Employee';
    case 'rogue':
      return '🕵️ Rogue Employee';
    case 'audit':
      return '🔍 Audit';
    case 'hr':
      return '🏥 HR';
    default:
      return role;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  list: {
    flex: 1,
  },
  playerCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deadPlayer: {
    backgroundColor: '#1a1a1a',
    opacity: 0.6,
  },
  playerName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  playerRole: {
    fontSize: 14,
    color: '#cccccc',
  },
  deadLabel: {
    fontSize: 12,
    color: '#ff6b6b',
  },
}); 