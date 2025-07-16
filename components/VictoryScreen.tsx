import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Trophy, Briefcase, XCircle } from 'lucide-react-native';

interface VictoryScreenProps {
  winner: 'employees' | 'rogue';
  playerRole: string;
  onPlayAgain: () => void;
}

export default function VictoryScreen({ winner, playerRole, onPlayAgain }: VictoryScreenProps) {
  const isPlayerWinner = 
    (winner === 'employees' && ['employee', 'audit', 'hr'].includes(playerRole)) ||
    (winner === 'rogue' && playerRole === 'rogue');

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        {/* Result Icon */}
        <View style={[
          styles.iconContainer,
          { backgroundColor: isPlayerWinner ? '#8BB4D8' : '#dc2626' }
        ]}>
          {isPlayerWinner ? (
            <Trophy size={48} color="white" strokeWidth={1.5} />
          ) : (
            <XCircle size={48} color="white" strokeWidth={1.5} />
          )}
        </View>

        {/* Main Result */}
        <Text style={styles.resultTitle}>
          {isPlayerWinner ? 'Victory!' : 'Eliminated'}
        </Text>
        
        <Text style={styles.resultSubtitle}>
          {isPlayerWinner 
            ? 'Your team has successfully saved the company!'
            : 'You have been permanently reassigned to external opportunities'
          }
        </Text>

        {/* Game Outcome */}
        <View style={styles.outcomeContainer}>
          <Text style={styles.outcomeTitle}>
            {winner === 'employees' ? 'Company Saved!' : 'Corporate Takeover!'}
          </Text>
          <Text style={styles.outcomeDescription}>
            {winner === 'employees'
              ? 'The loyal employees have identified and eliminated all rogue threats. Goldman Sachs maintains its reputation for integrity and excellence.'
              : 'The rogue employees have successfully infiltrated and taken control of the organization. Corporate restructuring is now underway.'
            }
          </Text>
        </View>

        {/* Performance Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Your Role:</Text>
            <Text style={styles.summaryValue}>
              {playerRole === 'employee' ? 'Employee' :
               playerRole === 'rogue' ? 'Rogue Employee' :
               playerRole === 'audit' ? 'Audit Department' :
               playerRole === 'hr' ? 'HR Department' : 
               playerRole}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Team:</Text>
            <Text style={styles.summaryValue}>
              {['employee', 'audit', 'hr'].includes(playerRole) ? 'Goldman Sachs Employees' : 'Rogue Infiltrators'}
            </Text>
          </View>
        </View>

        {/* Corporate Message */}
        <View style={styles.messageContainer}>
          <Briefcase size={20} color="#8BB4D8" strokeWidth={1.5} />
          <Text style={styles.messageText}>
            {isPlayerWinner 
              ? 'Thank you for your dedication to maintaining corporate excellence. Your performance review reflects outstanding teamwork and strategic thinking.'
              : 'While your tenure with us has ended, we appreciate your participation in this team-building exercise. Best of luck in your future endeavors.'
            }
          </Text>
        </View>

        {/* Play Again Button */}
        <TouchableOpacity style={styles.playAgainButton} onPress={onPlayAgain}>
          <Text style={styles.playAgainText}>Join New Game</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>
          *This has been a Goldman Sachs team-building exercise
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: '100%',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 16,
    fontWeight: '300',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  outcomeContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  outcomeTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  outcomeDescription: {
    fontSize: 14,
    fontWeight: '300',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: '100%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  messageContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  messageText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#0c4a6e',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  playAgainButton: {
    backgroundColor: '#8BB4D8',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  playAgainText: {
    fontSize: 16,
    fontWeight: '300',
    color: 'white',
  },
  footer: {
    fontSize: 10,
    fontWeight: '300',
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 