import { Stack } from "expo-router";
import { Platform } from "react-native";
import "../global.css";

export default function RootLayout() {
  const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || "";

  // Only try to use ElevenLabsProvider on native platforms
  if (Platform.OS !== "web") {
    try {
      // Use dynamic import with error handling
      const ElevenLabsModule = require("@elevenlabs/react-native");
      const ElevenLabsProvider = ElevenLabsModule?.ElevenLabsProvider;
      
      // Only render with provider if it exists
      if (ElevenLabsProvider) {
        return (
          <ElevenLabsProvider apiKey={apiKey}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
            </Stack>
          </ElevenLabsProvider>
        );
      }
    } catch (error) {
      console.warn("Failed to load ElevenLabs provider:", error);
    }
  }

  // Fallback for web or if provider fails to load
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}