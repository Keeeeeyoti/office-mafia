import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Smartphone, QrCode, Users } from 'lucide-react-native';

const gameId = "GS-7429";
const players = [
  { id: 1, name: "Alexandra Chen", joinedAt: "2m", role: "pending" },
  { id: 2, name: "Marcus Thompson", joinedAt: "1m", role: "pending" },
  { id: 3, name: "Sarah Williams", joinedAt: "30s", role: "pending" },
];

export default function HostPage() {
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
            <Text style={styles.gameIdText}>{gameId}</Text>
            <TouchableOpacity style={styles.copyButton}>
              <Text style={styles.copyIcon}>📋</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* QR Code Display */}
      <View style={styles.qrCard}>
        <View style={styles.qrDisplay}>
          <View style={styles.qrCodeContainer}>
            <QrCode size={96} color="#e2e8f0" strokeWidth={1} />
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
        </View>
        
        <View style={styles.participantsList}>
          {players.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>👥</Text>
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
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerJoinTime}>Joined {player.joinedAt} ago</Text>
                  </View>
                </View>
                <View style={styles.playerStatus} />
              </View>
            ))
          )}
        </View>
      </View>

      {/* Start Session Button */}
      <TouchableOpacity
        style={[styles.startButton, players.length < 3 && styles.startButtonDisabled]}
        disabled={players.length < 3}
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
}); 