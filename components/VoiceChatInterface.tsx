import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Image } from "expo-image";
import { Mic, MicOff, SkipForward, Pause, Play } from "lucide-react-native";
import FeedbackPanel from "./FeedbackPanel";

interface VoiceChatInterfaceProps {
  partnerName?: string;
  partnerAvatar?: string;
  scenario?: string;
  difficulty?: "easy" | "medium" | "hard";
  onEndSession?: () => void;
}

const VoiceChatInterface = ({
  partnerName = "Alex",
  partnerAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  scenario = "Coffee Shop",
  difficulty = "medium",
  onEndSession = () => {},
}: VoiceChatInterfaceProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState<
    Array<{ speaker: string; text: string }>
  >([]);
  const [audioVisualization, setAudioVisualization] = useState<number[]>([]);

  // Mock conversation data
  useEffect(() => {
    setTranscript([
      {
        speaker: partnerName,
        text: "Hi there! It's nice to meet you. What brings you to this coffee shop today?",
      },
      {
        speaker: "You",
        text: "I come here pretty often actually. They have the best lattes in town. How about you?",
      },
      {
        speaker: partnerName,
        text: "This is my first time here! I've heard great things about their pastries. Any recommendations?",
      },
    ]);

    // Simulate audio visualization
    const interval = setInterval(() => {
      if (isRecording && !isPaused) {
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
  }, [isRecording, isPaused, partnerName]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (isPaused) setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const skipTurn = () => {
    // Add a new response from the AI partner
    const newResponses = [
      "That sounds interesting! Tell me more about your hobbies.",
      "I love trying new restaurants. Do you have any favorites?",
      "What do you enjoy doing on weekends?",
    ];
    const randomResponse =
      newResponses[Math.floor(Math.random() * newResponses.length)];

    setTranscript([
      ...transcript,
      { speaker: partnerName, text: randomResponse },
    ]);
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
          onPress={onEndSession}
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
            <View className="w-2 h-2 rounded-full bg-green-500 mr-2"></View>
            <Text className="text-sm text-slate-500">Active</Text>
          </View>
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
            className={`w-2 mx-1 rounded-full ${isRecording && !isPaused ? "bg-blue-500" : "bg-gray-300"}`}
          />
        ))}
      </View>

      {/* Voice controls */}
      <View className="flex flex-row justify-around items-center bg-white p-3 rounded-lg shadow-sm">
        <TouchableOpacity
          className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center"
          onPress={togglePause}
          disabled={!isRecording}
        >
          {isPaused ? (
            <Play size={24} color={isRecording ? "#3b82f6" : "#9ca3af"} />
          ) : (
            <Pause size={24} color={isRecording ? "#3b82f6" : "#9ca3af"} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className={`w-20 h-20 rounded-full flex items-center justify-center ${isRecording ? "bg-red-500" : "bg-blue-500"}`}
          onPress={toggleRecording}
        >
          {isRecording ? (
            <MicOff size={32} color="white" />
          ) : (
            <Mic size={32} color="white" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center"
          onPress={skipTurn}
        >
          <SkipForward size={24} color="#4b5563" />
        </TouchableOpacity>
      </View>

      {/* Feedback panel */}
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
