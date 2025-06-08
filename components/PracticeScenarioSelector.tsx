import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { Coffee, Utensils, Users } from "lucide-react-native";

interface ScenarioProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  onSelect?: (id: string) => void;
}

interface PracticeScenarioSelectorProps {
  onScenarioSelect?: (scenarioId: string) => void;
  scenarios?: ScenarioProps[];
}

const defaultScenarios: ScenarioProps[] = [
  {
    id: "coffee-shop",
    title: "Coffee Shop",
    description:
      "Practice casual conversation in a relaxed coffee shop setting",
    icon: <Coffee size={24} color="#8B5CF6" />,
    image:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80",
  },
  {
    id: "dinner-date",
    title: "Dinner Date",
    description:
      "Master the art of dinner conversation in a restaurant setting",
    icon: <Utensils size={24} color="#EC4899" />,
    image:
      "https://images.unsplash.com/photo-1529417305485-480f579e7578?w=400&q=80",
  },
  {
    id: "casual-meetup",
    title: "Casual Meetup",
    description:
      "Practice conversation for a casual hangout with potential partners",
    icon: <Users size={24} color="#3B82F6" />,
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80",
  },
];

const ScenarioCard = ({
  title,
  description,
  icon,
  image,
  id,
  onSelect,
}: ScenarioProps) => {
  return (
    <TouchableOpacity
      className="bg-white rounded-xl overflow-hidden shadow-md mr-4 w-64 mb-2"
      onPress={() => onSelect && onSelect(id)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: image }}
        className="w-full h-32"
        resizeMode="cover"
      />
      <View className="p-4">
        <View className="flex-row items-center mb-2">
          <View className="mr-2">{icon}</View>
          <Text className="text-lg font-bold text-gray-800">{title}</Text>
        </View>
        <Text className="text-gray-600">{description}</Text>
      </View>
    </TouchableOpacity>
  );
};

const PracticeScenarioSelector = ({
  onScenarioSelect = () => {},
  scenarios = defaultScenarios,
}: PracticeScenarioSelectorProps) => {
  const router = useRouter();

  const handleScenarioSelect = (scenarioId: string) => {
    onScenarioSelect(scenarioId);
    // In a real implementation, this might navigate to the voice chat interface
    // router.push(`/practice/${scenarioId}`);
  };

  return (
    <View className="bg-gray-50 p-4 rounded-lg">
      <Text className="text-xl font-bold mb-2 text-gray-800">
        Choose a Practice Scenario
      </Text>
      <Text className="text-gray-600 mb-4">
        Select an environment to practice your dating conversation skills
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="pb-2"
      >
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            {...scenario}
            onSelect={handleScenarioSelect}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default PracticeScenarioSelector;
