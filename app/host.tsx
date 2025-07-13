import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function HostPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 Host Game</Text>
      <Text style={styles.subtitle}>Create and manage your Office Mafia game</Text>
      
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Game Setup</Text>
          <Text style={styles.cardText}>
            Ready to host your Office Mafia game? Click below to create a new session.
          </Text>
          
          <TouchableOpacity style={styles.createButton}>
            <Text style={styles.createButtonText}>Create New Game</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.cardSpacer} />
        
        <View style={styles.instructionsCard}>
          <Text style={styles.cardTitle}>How to Host</Text>
          <Text style={styles.instructionText}>1. Create a new game session</Text>
          <Text style={styles.instructionText}>2. Share the QR code with players</Text>
          <Text style={styles.instructionText}>3. Wait for players to join</Text>
          <Text style={styles.instructionText}>4. Start the game when ready</Text>
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
  cardText: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  createButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  createButtonText: {
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