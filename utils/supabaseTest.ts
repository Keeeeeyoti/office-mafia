import { supabase } from './supabaseClient';

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  // Check environment variables
  console.log('Environment variables:');
  console.log('SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY exists:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  console.log('SUPABASE_ANON_KEY length:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.length);
  
  try {
    // Test 1: Simple query
    console.log('📊 Test 1: Simple query');
    const { data, error } = await supabase
      .from('games')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Simple query failed:', error);
      return { success: false, error: error.message };
    } else {
      console.log('✅ Simple query successful:', data);
    }
    
    // Test 2: Insert test
    console.log('📊 Test 2: Insert test');
    const testHostId = `test_${Date.now()}`;
    const { data: insertData, error: insertError } = await supabase
      .from('games')
      .insert([
        {
          host_id: testHostId,
          status: 'waiting',
          current_phase: 'lobby',
        }
      ])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      return { success: false, error: insertError.message };
    } else {
      console.log('✅ Insert test successful:', insertData);
      
      // Clean up test data
      await supabase
        .from('games')
        .delete()
        .eq('id', insertData.id);
      console.log('🧹 Test data cleaned up');
    }
    
    return { success: true, message: 'All tests passed!' };
    
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    return { success: false, error: `Unexpected error: ${err}` };
  }
}

export async function debugSupabaseSetup() {
  console.log('🔧 Debugging Supabase setup...');
  
  // Check if URL and key are properly formatted
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('URL format check:', {
    exists: !!url,
    isString: typeof url === 'string',
    startsWithHttps: url?.startsWith('https://'),
    endsWithSupabaseCo: url?.endsWith('.supabase.co'),
    length: url?.length
  });
  
  console.log('Key format check:', {
    exists: !!key,
    isString: typeof key === 'string',
    startsWithEyJ: key?.startsWith('eyJ'),
    hasCorrectLength: key && key.length > 100,
    length: key?.length
  });
  
  if (!url || !url.startsWith('https://') || !url.endsWith('.supabase.co')) {
    console.error('❌ Invalid Supabase URL format. Should be: https://your-project.supabase.co');
  }
  
  if (!key || !key.startsWith('eyJ') || key.length < 100) {
    console.error('❌ Invalid Supabase anon key format. Should be a long JWT token starting with "eyJ"');
  }
  
  return { url, key };
} 