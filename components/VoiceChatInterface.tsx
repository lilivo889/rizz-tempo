import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { Image } from "expo-image";
import { Mic, MicOff, SkipForward, Pause, Play } from "lucide-react-native";
import { useConversation } from '@elevenlabs/react-native';
import FeedbackPanel from "./FeedbackPanel";

interface VoiceChatInterfaceProps {
  partnerName?: string;
  partnerAvatar?: string;
  scenario?: string;
  difficulty?: "easy" | "medium" | "hard";
  agentId?: string;
  onEndSession?: () => void;
}

const VoiceChatInterface = ({
  partnerName = "Alex",
  partnerAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  scenario = "Coffee Shop",
  difficulty = "medium",
  agentId,
  onEndSession = () => {},
}: VoiceChatInterfaceProps) => {
  const [transcript, setTranscript] = useState<
    Array<{ speaker: string; text: string }>
  >([
    { speaker: partnerName, text: "Hi! Ready to practice your conversation skills?" }
  ]);
  const [audioVisualization, setAudioVisualization] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to conversation');
      setIsConnected(true);
    },
    onDisconnect: () => {
      console.log('Disconnected from conversation');
      setIsConnected(false);
    },
    onMessage: (message) => {
      console.log('Message received:', message);
      if (message.type === 'user_transcript') {
        setTranscript(prev => [...prev, {
          speaker: "You",
          text: message.message
        }]);
      } else if (message.type === 'agent_response') {
        setTranscript(prev => [...prev, {
          speaker: partnerName,
          text: message.message
        }]);
      }
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      Alert.alert('Error', `Conversation error: ${error}`);
    },
  });

  // Simulate audio visualization
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected && !isMuted) {
        setAudioVisualization(
          Array(10)
            .fill(0)
            .map(() => Math.random() * 50 + 5),
        );
      } else {
        setAudioVisualization(Array(10).fill(5));
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isConnected, isMuted]);

  const startConversation = async () => {
    try {
      const finalAgentId = agentId || process.env.EXPO_PUBLIC_AGENT_ID;
      
      if (!finalAgentId) {
        Alert.alert('Error', 'Agent ID is not configured. Please set EXPO_PUBLIC_AGENT_ID in your environment variables.');
        return;
      }

      await conversation.startSession({
        agentId: finalAgentId,
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    }
  };

  const endConversation = async () => {
    try {
      await conversation.endSession();
      onEndSession();
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <View className="bg-slate-100 rounded-lg p-4 w-full h-[500px] flex flex-col">
      {/* Header with scenario info */}
      <View className="flex flex-row justify-between items-center mb-3 bg-white p-3 rounded-lg shadow-sm">
        <View>
          <Text className="text-lg font-bold text-slate-800">
            {scenario} Scenario
          </Text>
          <Text className="text-sm text-slate-500">
            Difficulty: {difficulty}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-red-500 px-3 py-1 rounded-full"
          onPress={endConversation}
          disabled={!isConnected}
        >
          <Text className="text-white font-medium">End Session</Text>
        </TouchableOpacity>
      </View>

      {/* Partner avatar and info */}
      <View className="flex flex-row items-center mb-4 bg-white p-3 rounded-lg shadow-sm">
        <Image
          source={{ uri: partnerAvatar }}
          className="w-16 h-16 rounded-full mr-3"
          contentFit="cover"
        />
        <View>
          <Text className="text-lg font-bold text-slate-800">
            {partnerName}
          </Text>
          <View className="flex flex-row items-center">
            <View className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></View>
            <Text className="text-sm text-slate-500">
              Status: {conversation.status}
            </Text>
          </View>
          <Text className="text-xs text-slate-400">
            {conversation.isSpeaking ? 'Speaking...' : 'Listening'}
          </Text>
        </View>
      </View>

      {/* Conversation transcript */}
      <ScrollView
        className="flex-1 bg-white rounded-lg p-3 mb-3 shadow-sm"
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        {transcript.map((message, index) => (
          <View
            key={index}
            className={`mb-3 p-3 rounded-lg ${message.speaker === "You" ? "bg-blue-100 self-end" : "bg-gray-100"}`}
          >
            <Text className="text-xs font-bold text-slate-500 mb-1">
              {message.speaker}
            </Text>
            <Text className="text-slate-800">{message.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Audio visualization */}
      <View className="h-12 bg-white rounded-lg p-2 mb-3 flex flex-row items-center justify-center shadow-sm">
        {audioVisualization.map((height, index) => (
          <View
            key={index}
            style={{ height: height }}
            className={`w-2 mx-1 rounded-full ${isConnected && !isMuted ? "bg-blue-500" : "bg-gray-300"}`}
          />
        ))}
      </View>

      {/* Voice controls */}
      <View className="flex flex-row justify-around items-center bg-white p-3 rounded-lg shadow-sm">
        <TouchableOpacity
          className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center"
          onPress={toggleMute}
          disabled={!isConnected}
        >
          {isMuted ? (
            <MicOff size={24} color={isConnected ? "#ef4444" : "#9ca3af"} />
          ) : (
            <Mic size={24} color={isConnected ? "#3b82f6" : "#9ca3af"} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className={`w-20 h-20 rounded-full flex items-center justify-center ${isConnected ? "bg-red-500" : "bg-blue-500"}`}
          onPress={isConnected ? endConversation : startConversation}
        >
          {isConnected ? (
            <Pause size={32} color="white" />
          ) : (
            <Play size={32} color="white" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center"
          disabled={!isConnected}
        >
          <SkipForward size={24} color={isConnected ? "#4b5563" : "#9ca3af"} />
        </TouchableOpacity>
      </View>

      {conversation.canSendFeedback && (
        <View className="flex flex-row justify-center gap-2 mt-2">
          <TouchableOpacity
            className="bg-gray-100 p-2 rounded-lg"
            onPress={() => conversation.sendFeedback(true)}
          >
            <Text>👍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-gray-100 p-2 rounded-lg"
            onPress={() => conversation.sendFeedback(false)}
          >
            <Text>👎</Text>
          </TouchableOpacity>
        </View>
      )}

      <FeedbackPanel
        toneScore={85}
        contentScore={72}
        flowScore={90}
        suggestions={[
          "Try asking more open-ended questions",
          "Good job maintaining a positive tone",
        ]}
      />
    </View>
  );
};

export default VoiceChatInterface;