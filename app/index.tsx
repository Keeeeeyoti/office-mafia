import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { Building2, Users, UserPlus, Database, Trash2 } from 'lucide-react-native';
import { cleanupOldGames } from '../utils/gameHelpers';

export default function HomePage() {
  const [isTestingDB, setIsTestingDB] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const handleTestDatabase = async () => {
    if (isTestingDB) return;
    
    setIsTestingDB(true);
    console.log('🧪 Starting Supabase database test...');
    
    try {
      // Test 1: Check environment variables
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('✅ Environment variables:', {
        url: supabaseUrl ? 'Found' : 'Missing',
        key: supabaseKey ? 'Found' : 'Missing'
      });
      
      if (!supabaseUrl || !supabaseKey) {
        Alert.alert('❌ Error', 'Environment variables missing. Check your .env file.');
        return;
      }

      // Create Supabase client
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test 2: Try to connect to database
      console.log('🔍 Testing database connection...');
      const { error: connectionError } = await supabase
        .from('games')
        .select('id')
        .limit(1);
      
      if (connectionError) {
        console.error('❌ Connection failed:', connectionError.message);
        Alert.alert(
          '❌ Database Connection Failed', 
          `Error: ${connectionError.message}\n\nMake sure your database schema is set up correctly.`
        );
        return;
      }
      
      console.log('✅ Database connection successful!');
      
      // Test 3: Try to create a test game
      console.log('🧪 Testing game creation...');
      const testHostId = crypto.randomUUID();
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert([{ host_id: testHostId }])
        .select()
        .single();
      
      if (gameError) {
        console.error('❌ Game creation failed:', gameError.message);
        Alert.alert('❌ Test Failed', `Could not create test game: ${gameError.message}`);
        return;
      }
      
      console.log('✅ Test game created successfully!');
      console.log('🎮 Game ID:', gameData.id);
      console.log('🔢 Game Code:', gameData.game_code);
      
      // Test 4: Clean up test data
      console.log('🧹 Cleaning up test data...');
      await supabase.from('games').delete().eq('id', gameData.id);
      console.log('✅ Test data cleaned up');
      
      // Success!
      Alert.alert(
        '🎉 Database Test Successful!', 
        `✅ Connection works\n✅ Can create games\n✅ Game code: ${gameData.game_code}\n\nYour Supabase setup is working correctly!`
      );
      
    } catch (error) {
      console.error('❌ Test error:', error);
      Alert.alert('❌ Test Error', `Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsTestingDB(false);
    }
  };

  const handleCleanupGames = async () => {
    if (isCleaningUp) return;
    
    setIsCleaningUp(true);
    console.log('🧹 Starting manual game cleanup...');
    
    try {
      const { result, error } = await cleanupOldGames();
      
      if (error) {
        Alert.alert('❌ Cleanup Failed', `Error: ${error}`);
        return;
      }
      
      Alert.alert(
        '🧹 Cleanup Complete!', 
        `${result}\n\nOld waiting games have been marked as abandoned and very old games have been deleted.`
      );
      
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      Alert.alert('❌ Cleanup Error', `Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.maxWidthContainer}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoContainer}>
              <Building2 size={40} color="white" strokeWidth={1.5} />
            </View>
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Office Mafia</Text>
            <View style={styles.divider} />
            <Text style={styles.subtitle}>Select your experience</Text>
          </View>
        </View>

        {/* Action Cards */}
        <View style={styles.cardsSection}>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.cardButton}
              onPress={() => router.push('/host')}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardIcon}>
                  <Users size={28} color="white" strokeWidth={1.5} />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Host</Text>
                  <Text style={styles.cardSubtitle}>Create and orchestrate the game session</Text>
                </View>
                <View style={styles.cardIndicator} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.cardButton}
              onPress={() => router.push('/player')}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardIcon}>
                  <UserPlus size={28} color="white" strokeWidth={1.5} />
                </View>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Player</Text>
                  <Text style={styles.cardSubtitle}>Join an existing game session</Text>
                </View>
                <View style={styles.cardIndicator} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Debug Section */}
        <View style={styles.debugSection}>
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>DEVELOPMENT TOOLS</Text>
          </View>
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={handleTestDatabase}
            disabled={isTestingDB}
          >
            <Database 
              size={16} 
              color="#475569"
              strokeWidth={1.5}
              style={{ marginRight: 12 }}
            />
            <Text style={styles.debugButtonText}>
              {isTestingDB ? 'Testing Database...' : 'Database Connection Test'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.debugButton, { marginTop: 12 }]}
            onPress={handleCleanupGames}
            disabled={isCleaningUp}
          >
            <Trash2 
              size={16} 
              color="#dc2626"
              strokeWidth={1.5}
              style={{ marginRight: 12 }}
            />
            <Text style={[styles.debugButtonText, { color: '#dc2626' }]}>
              {isCleaningUp ? 'Cleaning Up...' : 'Cleanup Old Games (15+ min)'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main container - matches: min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-6
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // slate-50 (gradient simplified to solid)
  },
  // Container - matches: w-full max-w-lg space-y-12
  maxWidthContainer: {
    width: '100%',
    maxWidth: 512, // max-w-lg = 512px
  },
  // Header section - matches: text-center space-y-6
  headerSection: {
    alignItems: 'center',
    marginBottom: 48, // space-y-12 = 48px between sections
  },
  // Logo wrapper - matches: flex justify-center
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 24, // space-y-6 = 24px
  },
  // Logo container - matches: w-20 h-20 bg-gs-blue rounded-3xl flex items-center justify-center shadow-xl
  logoContainer: {
    width: 80, // w-20 = 80px
    height: 80, // h-20 = 80px
    backgroundColor: '#8BB4D8', // bg-gs-blue
    borderRadius: 24, // rounded-3xl = 24px
    alignItems: 'center',
    justifyContent: 'center',
    // shadow-xl
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
  },
  // Title section - matches: space-y-3
  titleSection: {
    alignItems: 'center',
  },
  // Title - matches: text-4xl font-extralight text-slate-900 tracking-wide
  title: {
    fontSize: 36, // text-4xl = 36px
    fontWeight: '200', // font-extralight
    color: '#0f172a', // text-slate-900
    letterSpacing: 1, // tracking-wide
    textAlign: 'center',
    marginBottom: 12, // space-y-3 = 12px
  },
  // Divider - matches: w-16 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mx-auto
  divider: {
    width: 64, // w-16 = 64px
    height: 1, // h-px = 1px
    backgroundColor: '#cbd5e1', // slate-300 (gradient simplified)
    marginBottom: 12, // space-y-3 = 12px
  },
  // Subtitle - matches: text-slate-600 font-light text-lg
  subtitle: {
    fontSize: 18, // text-lg = 18px
    fontWeight: '300', // font-light
    color: '#475569', // text-slate-600
    textAlign: 'center',
  },
  // Cards section - matches: space-y-6
  cardsSection: {
    marginBottom: 48, // space-y-12 = 48px
  },
  // Card - matches: border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // bg-white/80
    borderRadius: 16, // rounded-2xl = 16px
    marginBottom: 24, // space-y-6 = 24px
    // shadow-lg
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  // Card button - matches: w-full h-auto p-8 justify-start hover:bg-slate-50/50 rounded-2xl group
  cardButton: {
    width: '100%',
    padding: 32, // p-8 = 32px
    borderRadius: 16, // rounded-2xl = 16px
  },
  // Card content - matches: flex items-center space-x-6 w-full
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  // Card icon - matches: w-16 h-16 bg-gs-blue rounded-2xl flex items-center justify-center group-hover:bg-gs-blue-600 transition-all duration-300
  cardIcon: {
    width: 64, // w-16 = 64px
    height: 64, // h-16 = 64px
    backgroundColor: '#8BB4D8', // bg-gs-blue
    borderRadius: 16, // rounded-2xl = 16px
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24, // space-x-6 = 24px
  },
  // Card text container - matches: text-left flex-1
  cardTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  // Card title - matches: text-xl font-light text-slate-900 mb-1
  cardTitle: {
    fontSize: 20, // text-xl = 20px
    fontWeight: '300', // font-light
    color: '#0f172a', // text-slate-900
    marginBottom: 4, // mb-1 = 4px
  },
  // Card subtitle - matches: text-slate-600 font-light leading-relaxed
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '300', // font-light
    color: '#475569', // text-slate-600
    lineHeight: 20, // leading-relaxed
  },
  // Card indicator - matches: w-2 h-2 rounded-full bg-slate-300 group-hover:bg-slate-400 transition-colors duration-300
  cardIndicator: {
    width: 8, // w-2 = 8px
    height: 8, // h-2 = 8px
    borderRadius: 4, // rounded-full
    backgroundColor: '#cbd5e1', // bg-slate-300
    marginLeft: 24, // space-x-6 = 24px
  },
  // Debug section - matches: pt-8 border-t border-slate-200/60
  debugSection: {
    paddingTop: 32, // pt-8 = 32px
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.6)', // border-slate-200/60
  },
  // Debug header - matches: text-center mb-6
  debugHeader: {
    alignItems: 'center',
    marginBottom: 24, // mb-6 = 24px
  },
  // Debug title - matches: text-xs text-slate-500 font-light tracking-wide uppercase
  debugTitle: {
    fontSize: 10, // text-xs = 10px
    color: '#64748b', // text-slate-500
    fontWeight: '300', // font-light
    letterSpacing: 1.5, // tracking-wide
    textTransform: 'uppercase',
  },
  // Debug button - matches: w-full border border-slate-200/60 hover:bg-slate-50/50 text-slate-600 bg-transparent h-12 rounded-xl font-light
  debugButton: {
    width: '100%',
    height: 48, // h-12 = 48px
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)', // border-slate-200/60
    backgroundColor: 'transparent',
    borderRadius: 12, // rounded-xl = 12px
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Debug button text - matches: text-slate-600 font-light
  debugButtonText: {
    color: '#475569', // text-slate-600
    fontSize: 14,
    fontWeight: '300', // font-light
  },
  
  // ScrollView styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
}); 