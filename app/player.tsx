import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';

export default function PlayerPage() {
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 Join Game</Text>
      <Text style={styles.subtitle}>Enter your details to join an Office Mafia game</Text>
      
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Join Game</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Game ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter game ID or scan QR code"
              placeholderTextColor="#999"
              value={gameId}
              onChangeText={setGameId}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              value={playerName}
              onChangeText={setPlayerName}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.joinButton, (!gameId || !playerName) && styles.disabledButton]}
            disabled={!gameId || !playerName}
          >
            <Text style={styles.joinButtonText}>Join Game</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.cardSpacer} />
        
        <View style={styles.instructionsCard}>
          <Text style={styles.cardTitle}>How to Join</Text>
          <Text style={styles.instructionText}>1. Get the Game ID from the host</Text>
          <Text style={styles.instructionText}>2. Enter your name</Text>
          <Text style={styles.instructionText}>3. Wait for the game to start</Text>
          <Text style={styles.instructionText}>4. Follow the game instructions</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.push('/')}
      >
        <Text style={styles.backButtonText}>← Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 30,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  cardSpacer: {
    height: 20,
  },
  instructionsCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  joinButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 8,
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
}); 