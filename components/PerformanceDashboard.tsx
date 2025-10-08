import React from "react";
import { View, Text, ScrollView, Pressable, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Feather } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

type MetricData = {
  label: string;
  value: number;
  change: number;
  icon: React.ReactNode;
};

type ChartData = {
  labels: string[];
  datasets: {
    data: number[];
  }[];
};

type Tip = {
  id: string;
  title: string;
  description: string;
};

type PerformanceDashboardProps = {
  metrics?: MetricData[];
  progressData?: ChartData;
  tips?: Tip[];
  onViewDetailedStats?: () => void;
};

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  metrics = [
    {
      label: "Conversation Score",
      value: 78,
      change: 5,
      icon: <Feather name="message-circle" size={20} color="#6366f1" />,
    },
    {
      label: "Engagement Rate",
      value: 82,
      change: 3,
      icon: <Feather name="thumbs-up" size={20} color="#8b5cf6" />,
    },
    {
      label: "Avg. Response Time",
      value: 3.2,
      change: -0.5,
      icon: <Feather name="clock" size={20} color="#ec4899" />,
    },
    {
      label: "Confidence Level",
      value: 65,
      change: 8,
      icon: <Feather name="trending-up" size={20} color="#10b981" />,
    },
  ],
  progressData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [65, 68, 72, 70, 75, 74, 78],
      },
    ],
  },
  tips = [
    {
      id: "1",
      title: "Ask open-ended questions",
      description:
        "Try asking questions that require more than a yes/no answer to keep the conversation flowing.",
    },
    {
      id: "2",
      title: "Practice active listening",
      description:
        "Reference details from earlier in the conversation to show you're paying attention.",
    },
    {
      id: "3",
      title: "Balance talking and listening",
      description:
        "Aim for roughly equal speaking time to maintain an engaging conversation.",
    },
  ],
  onViewDetailedStats = () => console.log("View detailed stats"),
}) => {
  return (
    <ScrollView className="flex-1 bg-white p-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-800 mb-1">
          Performance Dashboard
        </Text>
        <Text className="text-gray-500">
          Track your conversation skills progress
        </Text>
      </View>

      {/* Key Metrics */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-3">
          Key Metrics
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {metrics.map((metric, index) => (
            <View
              key={index}
              className="w-[48%] bg-gray-50 rounded-xl p-3 mb-3"
            >
              <View className="flex-row justify-between items-center mb-2">
                <View className="p-2 rounded-full bg-indigo-100">
                  {metric.icon}
                </View>
                <View
                  className={`flex-row items-center ${metric.change > 0 ? "bg-green-100" : "bg-red-100"} px-2 py-1 rounded-full`}
                >
                  <Text
                    className={`text-xs ${metric.change > 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {metric.change > 0 ? "+" : ""}
                    {metric.change}%
                  </Text>
                </View>
              </View>
              <Text className="text-gray-500 text-xs">{metric.label}</Text>
              <Text className="text-xl font-bold text-gray-800">
                {metric.value}
                {metric.label.includes("Time") ? "s" : "%"}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Progress Chart */}
      <View className="mb-6 bg-gray-50 p-4 rounded-xl">
        <Text className="text-lg font-semibold text-gray-800 mb-3">
          Weekly Progress
        </Text>
        <View className="h-48">
          <LineChart
            data={progressData}
            width={screenWidth - 80}
            height={180}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
      </View>

      {/* Coaching Tips */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-3">
          Personalized Tips
        </Text>
        {tips.map((tip) => (
          <View key={tip.id} className="bg-gray-50 rounded-xl p-4 mb-3">
            <Text className="text-base font-semibold text-gray-800 mb-1">
              {tip.title}
            </Text>
            <Text className="text-gray-500">{tip.description}</Text>
          </View>
        ))}
      </View>

      {/* View Detailed Stats Button */}
      <Pressable
        onPress={onViewDetailedStats}
        className="bg-indigo-600 rounded-xl py-3 px-4 flex-row justify-center items-center mb-6"
      >
        <Text className="text-white font-semibold mr-2">
          View Detailed Statistics
        </Text>
        <Feather name="arrow-up-right" size={18} color="#ffffff" />
      </Pressable>
    </ScrollView>
  );
};

export default PerformanceDashboard;