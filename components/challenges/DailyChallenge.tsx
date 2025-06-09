import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useDatabase';

interface DailyChallengeProps {
  onStartChallenge: (challenge: any) => void;
}

export default function DailyChallenge({ onStartChallenge }: DailyChallengeProps) {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDailyChallenge();
      fetchUserStreak();
    }
  }, [user]);

  const fetchDailyChallenge = async () => {
    try {
      // Get today's challenge
      const today = new Date().toISOString().split('T')[0];
      const { data: challengeData } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('challenge_date', today)
        .eq('is_active', true)
        .single();

      if (challengeData) {
        setChallenge(challengeData);
        
        // Check if user has completed it
        if (user) {
          const { data: completion } = await supabase
            .from('user_challenge_completions')
            .select('completed')
            .eq('user_id', user.id)
            .eq('challenge_id', challengeData.id)
            .single();

          setCompleted(completion?.completed || false);
        }
      }
    } catch (error) {
      console.error('Error fetching challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStreak = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setStreak(data.current_streak);
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    }
  };

  const handleStartChallenge = () => {
    if (!challenge) return;
    
    if (completed) {
      Alert.alert('Already Completed', 'You have already completed today\'s challenge!');
      return;
    }

    onStartChallenge(challenge);
  };

  if (loading) {
    return (
      <View className="bg-gray-800 rounded-lg p-4 mx-4">
        <ActivityIndicator color="#A855F7" />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View className="bg-gray-800 rounded-lg p-4 mx-4">
        <Text className="text-gray-400 text-center">
          No challenge available today
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-gray-800 rounded-lg p-4 mx-4">
      {/* Header with streak */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Ionicons name="flame" size={24} color="#F59E0B" />
          <Text className="text-white font-semibold ml-2">
            Daily Challenge
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="flame" size={20} color="#F59E0B" />
          <Text className="text-amber-500 font-bold ml-1">
            {streak} day streak
          </Text>
        </View>
      </View>

      {/* Challenge details */}
      <Text className="text-white text-lg font-semibold mb-2">
        {challenge.title}
      </Text>
      <Text className="text-gray-400 mb-3">
        {challenge.description}
      </Text>

      {/* Difficulty indicator */}
      <View className="flex-row items-center mb-4">
        <Text className="text-gray-400 mr-2">Difficulty:</Text>
        {[...Array(5)].map((_, i) => (
          <Ionicons
            key={i}
            name="star"
            size={16}
            color={i < challenge.difficulty_level ? '#A855F7' : '#374151'}
          />
        ))}
      </View>

      {/* Reward */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-gray-400">Reward:</Text>
        <View className="flex-row items-center">
          <Ionicons name="flash" size={16} color="#A855F7" />
          <Text className="text-purple-400 font-semibold ml-1">
            +{challenge.bonus_tokens} tokens
          </Text>
        </View>
      </View>

      {/* Action button */}
      <TouchableOpacity
        className={`py-3 rounded-lg ${
          completed ? 'bg-green-600' : 'bg-purple-600'
        }`}
        onPress={handleStartChallenge}
        disabled={completed}
      >
        <Text className="text-white text-center font-semibold">
          {completed ? '✓ Completed' : 'Start Challenge'}
        </Text>
      </TouchableOpacity>
    </View>
  );
} 