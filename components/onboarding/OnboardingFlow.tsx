import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useDatabase';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', description: 'New to dating' },
  { id: 'intermediate', label: 'Intermediate', description: 'Some experience' },
  { id: 'advanced', label: 'Advanced', description: 'Very confident' },
];

const DATING_GOALS = [
  { id: 'casual', label: 'Casual Dating' },
  { id: 'serious', label: 'Serious Relationships' },
  { id: 'confidence', label: 'Building Confidence' },
  { id: 'social', label: 'Social Skills' },
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [datingGoals, setDatingGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  };

  const toggleGoal = (goalId: string) => {
    setDatingGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const completeOnboarding = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await supabase
        .from('profiles')
        .update({
          experience_level: experienceLevel,
          dating_goals: datingGoals,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      onComplete();
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return experienceLevel !== '';
    if (step === 2) return datingGoals.length > 0;
    return true;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-1 px-6">
        {step === 0 && (
          <View className="flex-1 justify-center">
            <Text className="text-4xl font-bold text-white mb-4">
              Welcome to Rizz Tempo!
            </Text>
            <Text className="text-lg text-gray-300 mb-8">
              Practice conversations with AI to build confidence.
            </Text>
            <Text className="text-purple-400 mb-8">
              You've received 6 free tokens to get started!
            </Text>
          </View>
        )}

        {step === 1 && (
          <View className="flex-1 pt-20">
            <Text className="text-3xl font-bold text-white mb-8">
              What's your experience level?
            </Text>
            {EXPERIENCE_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                className={`p-4 rounded-lg mb-3 ${
                  experienceLevel === level.id
                    ? 'bg-purple-600'
                    : 'bg-gray-800'
                }`}
                onPress={() => setExperienceLevel(level.id)}
              >
                <Text className="text-white font-semibold">
                  {level.label}
                </Text>
                <Text className="text-gray-300 text-sm">
                  {level.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 2 && (
          <View className="flex-1 pt-20">
            <Text className="text-3xl font-bold text-white mb-8">
              What are your goals?
            </Text>
            {DATING_GOALS.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                className={`p-4 rounded-lg mb-3 ${
                  datingGoals.includes(goal.id)
                    ? 'bg-purple-600'
                    : 'bg-gray-800'
                }`}
                onPress={() => toggleGoal(goal.id)}
              >
                <Text className="text-white font-semibold">
                  {goal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          className={`py-3 rounded-lg mb-6 ${
            canProceed() ? 'bg-purple-600' : 'bg-gray-700'
          }`}
          onPress={handleNext}
          disabled={!canProceed() || loading}
        >
          <Text className="text-white text-center font-semibold">
            {step === 2 ? 'Get Started' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
} 