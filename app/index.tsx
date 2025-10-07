import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { Bell, Settings, ChevronRight, ArrowLeft } from "lucide-react-native";

import PracticeScenarioSelector from "../components/PracticeScenarioSelector";
import PerformanceDashboard from "../components/PerformanceDashboard";
import VoiceChatInterface from "../components/VoiceChatInterface";

export default function MainDashboard() {
  const [activeTab, setActiveTab] = useState("practice");
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const userName = "Alex";
  const lastSessionDate = "Yesterday";

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
  };

  const handleEndSession = () => {
    setSelectedScenario(null);
  };

  const getScenarioDetails = (scenarioId: string) => {
    const scenarios: Record<string, { name: string; partner: string; avatar: string }> = {
      "coffee-shop": {
        name: "Coffee Shop",
        partner: "Emma",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma"
      },
      "dinner-date": {
        name: "Dinner Date",
        partner: "Sophie",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie"
      },
      "casual-meetup": {
        name: "Casual Meetup",
        partner: "Alex",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
      }
    };
    return scenarios[scenarioId] || scenarios["coffee-shop"];
  };

  return (
    <SafeAreaView className="flex-1 bg-indigo-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row justify-between items-center px-4 pt-2 pb-4 bg-white">
        <View className="flex-row items-center">
          {selectedScenario && (
            <TouchableOpacity 
              className="mr-3 p-2"
              onPress={handleEndSession}
            >
              <ArrowLeft size={24} color="#4338ca" />
            </TouchableOpacity>
          )}
          <View>
            <Text className="text-2xl font-bold text-indigo-900">
              Dating Coach AI
            </Text>
            <Text className="text-gray-600">Welcome back, {userName}</Text>
          </View>
        </View>
        <View className="flex-row">
          <TouchableOpacity className="p-2 mr-2">
            <Bell size={24} color="#4338ca" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2">
            <Settings size={24} color="#4338ca" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Show Voice Chat if scenario selected */}
      {selectedScenario ? (
        <ScrollView className="flex-1 p-4">
          <VoiceChatInterface
            scenario={getScenarioDetails(selectedScenario).name}
            partnerName={getScenarioDetails(selectedScenario).partner}
            partnerAvatar={getScenarioDetails(selectedScenario).avatar}
            onEndSession={handleEndSession}
          />
        </ScrollView>
      ) : (
        <>
          {/* Tab Navigation */}
          <View className="flex-row bg-white border-b border-gray-200">
            <TouchableOpacity
              className={`flex-1 py-3 ${activeTab === "practice" ? "border-b-2 border-indigo-600" : ""}`}
              onPress={() => setActiveTab("practice")}
            >
              <Text
                className={`text-center font-medium ${activeTab === "practice" ? "text-indigo-600" : "text-gray-600"}`}
              >
                Practice
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 ${activeTab === "performance" ? "border-b-2 border-indigo-600" : ""}`}
              onPress={() => setActiveTab("performance")}
            >
              <Text
                className={`text-center font-medium ${activeTab === "performance" ? "text-indigo-600" : "text-gray-600"}`}
              >
                Performance
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1">
            {activeTab === "practice" ? (
              <View className="p-4">
                {/* Last Session Summary */}
                <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                  <Text className="text-lg font-semibold text-gray-800">
                    Last Session
                  </Text>
                  <Text className="text-gray-600 mb-2">
                    {lastSessionDate} · Coffee Shop Scenario
                  </Text>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-indigo-100 mr-3 overflow-hidden">
                        <Image
                          source="https://api.dicebear.com/7.x/avataaars/svg?seed=Emma"
                          style={{ width: 40, height: 40 }}
                        />
                      </View>
                      <View>
                        <Text className="font-medium">Emma</Text>
                        <Text className="text-xs text-gray-500">
                          Friendly & Outgoing
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      className="flex-row items-center"
                      onPress={() => handleScenarioSelect("coffee-shop")}
                    >
                      <Text className="text-indigo-600 mr-1">Continue</Text>
                      <ChevronRight size={16} color="#4f46e5" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Practice Scenarios */}
                <Text className="text-xl font-bold text-gray-800 mb-4">
                  Choose a Scenario
                </Text>
                <PracticeScenarioSelector onScenarioSelect={handleScenarioSelect} />
              </View>
            ) : (
              <View className="p-4">
                <Text className="text-xl font-bold text-gray-800 mb-4">
                  Your Progress
                </Text>
                <PerformanceDashboard />
              </View>
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}