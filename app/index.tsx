import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { createClient } from '@supabase/supabase-js';

export default function HomePage() {
  const [isTestingDB, setIsTestingDB] = useState(false);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎩 Office Mafia</Text>
      <Text style={styles.subtitle}>Choose your role</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.hostButton]}
          onPress={() => router.push('/host')}
        >
          <Text style={styles.buttonText}>🎯 Host Game</Text>
          <Text style={styles.buttonSubtext}>Create and manage a game</Text>
        </TouchableOpacity>
        
        <View style={styles.buttonSpacer} />
        
        <TouchableOpacity 
          style={[styles.button, styles.playerButton]}
          onPress={() => router.push('/player')}
        >
          <Text style={styles.buttonText}>👥 Join Game</Text>
          <Text style={styles.buttonSubtext}>Scan QR code to join</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.testInstructions}>
          💡 Open browser console (F12) to see detailed test results
        </Text>
        <TouchableOpacity 
          style={[styles.testButton, isTestingDB && styles.testButtonDisabled]} 
          onPress={handleTestDatabase}
          disabled={isTestingDB}
        >
          <Text style={styles.testButtonText}>
            {isTestingDB ? '🔄 Testing Database...' : '🧪 Test Database Connection'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#cccccc',
    marginBottom: 50,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 40,
  },
  button: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  buttonSpacer: {
    height: 20,
  },
  hostButton: {
    backgroundColor: '#dc2626',
  },
  playerButton: {
    backgroundColor: '#2563eb',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  testSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  testInstructions: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 10,
    opacity: 0.7,
  },
  testButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    opacity: 0.9,
  },
  testButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
}); 