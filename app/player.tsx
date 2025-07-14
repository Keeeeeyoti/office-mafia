import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Camera, Smartphone, User } from 'lucide-react-native';

export default function PlayerPage() {
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');

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
                <Text style={styles.activateCameraText}>Activate Camera</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Alternative Entry</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Manual Entry */}
      <View style={styles.manualEntryCard}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Session Identifier</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter session ID (e.g., GS-7429)"
            placeholderTextColor="#94a3b8" // slate-400
            value={gameId}
            onChangeText={setGameId}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#94a3b8" // slate-400
            value={playerName}
            onChangeText={setPlayerName}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.joinButton, (!gameId || !playerName) && styles.joinButtonDisabled]}
          disabled={!gameId || !playerName}
        >
          <View style={styles.joinButtonContent}>
            <User size={16} color="white" strokeWidth={1.5} style={{ marginRight: 12 }} />
            <Text style={styles.joinButtonText}>Join Session</Text>
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
  qrScannerCard: {
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
    color: '#0f172a', // slate-900
  },
  qrScannerContent: {
    padding: 24,
    paddingTop: 0,
  },
  qrScannerDisplay: {
    backgroundColor: '#f8fafc', // slate-50
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
  },
  phoneIcon: {
    width: 96,
    height: 96,
    backgroundColor: '#8BB4D8', // gs-blue
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  qrScannerText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#475569', // slate-600
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  activateCameraButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
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
    color: '#475569', // slate-600
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0', // slate-200
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#64748b', // slate-500
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc', // slate-50
  },
  manualEntryCard: {
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
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '300',
    color: '#374151', // slate-700
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
    color: '#0f172a', // slate-900
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '300',
  },
  joinButton: {
    backgroundColor: '#1e293b', // slate-800
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
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
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinButtonIcon: {
    fontSize: 20,
    color: '#ffffff',
    marginRight: 12,
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
    color: '#64748b', // slate-500
    textAlign: 'center',
    letterSpacing: 0.5,
  },
}); 