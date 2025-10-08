import { Stack } from "expo-router";
import { ElevenLabsProvider } from "@elevenlabs/react-native";

export default function RootLayout() {
  const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || "";

  return (
    <ElevenLabsProvider apiKey={apiKey}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </ElevenLabsProvider>
  );
}
