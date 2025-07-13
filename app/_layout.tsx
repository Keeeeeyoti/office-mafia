import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Office Mafia' }} />
        <Stack.Screen name="host" options={{ title: 'Host Game' }} />
        <Stack.Screen name="player" options={{ title: 'Join Game' }} />
      </Stack>
    </>
  );
} 