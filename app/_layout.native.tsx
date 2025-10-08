import React from "react";
import { Stack } from "expo-router";

// Provide a safe fallback provider when the native module isn't available (e.g. Expo Go)
const FallbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

let SafeElevenLabsProvider: React.ComponentType<any> = FallbackProvider;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("@elevenlabs/react-native");
  if (mod?.ElevenLabsProvider) {
    SafeElevenLabsProvider = mod.ElevenLabsProvider;
  }
} catch {}

export default function RootLayout() {
  const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || "";

  return (
    <SafeElevenLabsProvider apiKey={apiKey}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </SafeElevenLabsProvider>
  );
}