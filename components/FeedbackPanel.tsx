import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";

interface FeedbackMetric {
  category: string;
  score: number;
  feedback: string;
}

interface FeedbackPanelProps {
  toneScore?: number;
  contentScore?: number;
  flowScore?: number;
  overallScore?: number;
  suggestions?: string[];
  isVisible?: boolean;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  toneScore = 75,
  contentScore = 60,
  flowScore = 85,
  overallScore = 73,
  suggestions = [
    "Try asking about their interests more directly",
    "Share a brief personal story related to the topic",
    "Use more varied conversation starters",
  ],
  isVisible = true,
}) => {
  if (!isVisible) return null;

  const metrics: FeedbackMetric[] = [
    {
      category: "Tone",
      score: toneScore,
      feedback: "Your tone is friendly and engaging. Try adding more enthusiasm.",
    },
    {
      category: "Content",
      score: contentScore,
      feedback: "Good topics, but try asking more open-ended questions.",
    },
    {
      category: "Flow",
      score: flowScore,
      feedback: "Great job responding to previous points in the conversation.",
    },
  ];

  const getIcon = (category: string) => {
    switch (category) {
      case "Tone":
        return <Feather name="message-circle" size={20} color="#6366f1" />;
      case "Content":
        return <Feather name="bar-chart-2" size={20} color="#8b5cf6" />;
      case "Flow":
        return <Feather name="mic" size={20} color="#10b981" />;
      default:
        return <Feather name="message-circle" size={20} color="#6366f1" />;
    }
  };

  return (
    <View className="bg-white p-4 rounded-lg shadow-md w-full">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-gray-800">
          Conversation Feedback
        </Text>
        <View className="bg-indigo-100 px-3 py-1 rounded-full">
          <Text className="text-indigo-700 font-bold">{overallScore}/100</Text>
        </View>
      </View>

      <ScrollView className="max-h-40">
        {metrics.map((metric, index) => (
          <View key={index} className="mb-3">
            <View className="flex-row justify-between items-center mb-1">
              <View className="flex-row items-center">
                {getIcon(metric.category)}
                <Text className="ml-2 font-medium text-gray-700">
                  {metric.category}
                </Text>
              </View>
              <View className="flex-row items-center">
                {metric.score < 60 ? (
                  <Feather name="thumbs-down" size={16} color="#ef4444" />
                ) : (
                  <Feather name="thumbs-up" size={16} color="#10b981" />
                )}
                <Text className="ml-1 text-sm font-medium">{metric.score}%</Text>
              </View>
            </View>
            <View className="bg-gray-200 h-2 rounded-full w-full overflow-hidden">
              <View
                className={`h-full rounded-full ${metric.score < 60 ? "bg-red-500" : metric.score < 80 ? "bg-yellow-500" : "bg-green-500"}`}
                style={{ width: `${metric.score}%` }}
              />
            </View>
            <Text className="text-xs text-gray-600 mt-1">
              {metric.feedback}
            </Text>
          </View>
        ))}

        <View className="mt-4">
          <Text className="font-bold text-gray-800 mb-2">
            Suggestions to Improve:
          </Text>
          {suggestions.map((suggestion, index) => (
            <View key={index} className="flex-row items-start mb-1">
              <Text className="text-gray-600 text-xs mr-1">•</Text>
              <Text className="text-xs text-gray-600 flex-1">{suggestion}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

FeedbackPanel.displayName = 'FeedbackPanel';

export default FeedbackPanel;