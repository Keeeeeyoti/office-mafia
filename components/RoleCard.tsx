import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlayerRole } from '../utils/supabaseClient';

interface RoleCardProps {
  role: PlayerRole;
  playerName: string;
}

export function RoleCard({ role, playerName }: RoleCardProps) {
  if (!role) return null;

  const roleInfo = getRoleInfo(role);

  return (
    <View style={[styles.container, { backgroundColor: roleInfo.color }]}>
      <Text style={styles.greeting}>Welcome, {playerName}!</Text>
      <Text style={styles.roleIcon}>{roleInfo.icon}</Text>
      <Text style={styles.roleName}>{roleInfo.name}</Text>
      <Text style={styles.roleDescription}>{roleInfo.description}</Text>
      <Text style={styles.objective}>Objective: {roleInfo.objective}</Text>
    </View>
  );
}

function getRoleInfo(role: PlayerRole) {
  switch (role) {
    case 'employee':
      return {
        name: 'Employee',
        icon: '👔',
        description: 'You are a regular office worker trying to identify and eliminate the rogue employees.',
        objective: 'Vote out all rogue employees to win.',
        color: '#2563eb',
      };
    case 'rogue':
      return {
        name: 'Rogue Employee',
        icon: '🕵️',
        description: 'You secretly work to eliminate other employees. You know who the other rogues are.',
        objective: 'Eliminate employees until you equal or outnumber them.',
        color: '#dc2626',
      };
    case 'audit':
      return {
        name: 'Audit',
        icon: '🔍',
        description: 'You can investigate one player each night to discover if they are a rogue employee.',
        objective: 'Help identify rogues and vote them out.',
        color: '#7c3aed',
      };
    case 'hr':
      return {
        name: 'HR',
        icon: '🏥',
        description: 'You can protect one player from elimination each night.',
        objective: 'Keep employees alive and help eliminate rogues.',
        color: '#059669',
      };
    default:
      return {
        name: 'Unknown',
        icon: '❓',
        description: 'Unknown role',
        objective: 'Unknown',
        color: '#6b7280',
      };
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  greeting: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  roleName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  roleDescription: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 15,
    opacity: 0.9,
  },
  objective: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
  },
}); 