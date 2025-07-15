import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User, Shield, Search, Heart } from 'lucide-react-native';

// Office-themed role data
export interface RoleInfo {
  id: string;
  name: string;
  team: 'good' | 'evil';
  description: string;
  objective: string;
  abilities?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export const ROLE_DATA: Record<string, RoleInfo> = {
  employee: {
    id: 'employee',
    name: 'Employee',
    team: 'good',
    description: 'You are a dedicated office worker trying to save the company from corruption.',
    objective: 'Eliminate all Rogue Employees to save the company! 1 GS!',
    icon: <User size={24} color="white" strokeWidth={1.5} />,
    color: '#8BB4D8', // gs-blue
    bgColor: '#ffffff'
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue Employee',
    team: 'evil',
    description: 'You are secretly working to sabotage the company from within.',
    objective: 'Eliminate enough Employees to take control of the company!',
    abilities: 'Work together with other Rogue Employees to sabotage one employee per night.',
    icon: <User size={24} color="white" strokeWidth={1.5} />,
    color: '#dc2626',
    bgColor: '#ffffff'
  },
  audit: {
    id: 'audit',
    name: 'Audit Department',
    team: 'good',
    description: 'You have access to employee records and can investigate suspicious activity.',
    objective: 'Use your investigative skills to identify Rogue Employees!',
    abilities: 'Each night, you can investigate one employee to learn if they are trustworthy.',
    icon: <Search size={24} color="white" strokeWidth={1.5} />,
    color: '#475569', // slate-600
    bgColor: '#ffffff'
  },
  hr: {
    id: 'hr',
    name: 'HR Department',
    team: 'good',
    description: 'You protect employees from being wrongfully terminated.',
    objective: 'Use your authority to protect valuable team members!',
    abilities: 'Each night, you can protect one employee from elimination.',
    icon: <Heart size={24} color="white" strokeWidth={1.5} />,
    color: '#6366f1', // indigo-500
    bgColor: '#ffffff'
  }
};

interface RoleCardProps {
  role: string;
  playerName: string;
  performanceBonus?: number;
}

export default function RoleCard({ role, playerName, performanceBonus }: RoleCardProps) {
  const roleInfo = ROLE_DATA[role];
  
  if (!roleInfo) {
    return (
      <View style={styles.errorCard}>
        <Text style={styles.errorText}>Unknown role: {role}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: roleInfo.color }]}>
          {roleInfo.icon}
        </View>
        <View style={styles.headerText}>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>Welcome, {playerName}</Text>
            {performanceBonus && performanceBonus > 0 && (
              <View style={styles.bonusBadge}>
                <Text style={styles.bonusBadgeText}>+{performanceBonus}% performance bonus</Text>
              </View>
            )}
          </View>
          <Text style={styles.roleName}>{roleInfo.name}</Text>
        </View>
      </View>

      {/* Team Badge */}
      <View style={styles.teamContainer}>
        <View style={[
          styles.teamBadge, 
          { backgroundColor: roleInfo.team === 'good' ? '#8BB4D8' : '#dc2626' }
        ]}>
          <Text style={styles.teamText}>
            {roleInfo.team === 'good' ? 'Company Team' : 'Rogue Team'}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{roleInfo.description}</Text>

      {/* Objective */}
      <View style={styles.objectiveContainer}>
        <Text style={styles.objectiveLabel}>Objective</Text>
        <Text style={styles.objective}>{roleInfo.objective}</Text>
      </View>

      {/* Abilities (if any) */}
      {roleInfo.abilities && (
        <View style={styles.abilitiesContainer}>
          <Text style={styles.abilitiesLabel}>Special Abilities</Text>
          <Text style={styles.abilities}>{roleInfo.abilities}</Text>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Keep your role secret and listen to the moderator for further instructions.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  errorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#dc2626',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '300',
    color: '#64748b',
    marginBottom: 4,
  },
  roleName: {
    fontSize: 24,
    fontWeight: '300',
    color: '#0f172a',
  },
  teamContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  teamBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  teamText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '300',
  },
  description: {
    fontSize: 16,
    fontWeight: '300',
    color: '#475569',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  objectiveContainer: {
    marginBottom: 20,
  },
  objectiveLabel: {
    fontSize: 14,
    fontWeight: '300',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  objective: {
    fontSize: 15,
    fontWeight: '300',
    color: '#0f172a',
    lineHeight: 22,
  },
  abilitiesContainer: {
    marginBottom: 24,
  },
  abilitiesLabel: {
    fontSize: 14,
    fontWeight: '300',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  abilities: {
    fontSize: 15,
    fontWeight: '300',
    color: '#475569',
    lineHeight: 22,
  },
  instructions: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  instructionsText: {
    fontSize: 14,
    fontWeight: '300',
    color: '#64748b',
    lineHeight: 20,
    textAlign: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bonusBadge: {
    backgroundColor: '#8BB4D8',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  bonusBadgeText: {
    fontSize: 10,
    fontWeight: '300',
    color: 'white',
  },
}); 