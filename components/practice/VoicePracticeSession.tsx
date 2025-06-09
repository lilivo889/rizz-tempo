import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useDatabase';

interface VoicePracticeSessionProps {
  scenario: {
    id: string;
    title: string;
    prompt: string;
  };
  onComplete: (sessionData: any) => void;
  onCancel: () => void;
}

export default function VoicePracticeSession({
  scenario,
  onComplete,
  onCancel,
}: VoicePracticeSessionProps) {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [tokensConsumed, setTokensConsumed] = useState(0);
  const [currentTokens, setCurrentTokens] = useState({ permanent: 0, resettable: 0 });
  const [loading, setLoading] = useState(true);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const TOKENS_PER_SECOND = 0.02778;

  useEffect(() => {
    fetchCurrentTokens();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchCurrentTokens = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('user_tokens')
        .select('permanent_tokens, resettable_tokens')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setCurrentTokens({
          permanent: data.permanent_tokens,
          resettable: data.resettable_tokens,
        });
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    const totalTokens = currentTokens.permanent + currentTokens.resettable;
    if (totalTokens < 1) {
      Alert.alert('Insufficient Tokens', 'You need tokens to start a session.');
      return;
    }

    setIsActive(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);
      setTokensConsumed(elapsed * TOKENS_PER_SECOND);
    }, 100);
  };

  const pauseSession = () => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resumeSession = () => {
    setIsPaused(false);
    startTimeRef.current = Date.now() - (elapsedTime * 1000);
    
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);
      setTokensConsumed(elapsed * TOKENS_PER_SECOND);
    }, 100);
  };

  const endSession = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsActive(false);
    setIsPaused(false);

    if (user && elapsedTime > 0) {
      try {
        const { data: result } = await supabase.rpc('consume_tokens', {
          p_user_id: user.id,
          p_seconds: elapsedTime,
        });

        if (result?.success) {
          const sessionData = {
            scenario_type: scenario.title,
            duration_seconds: Math.round(elapsedTime),
          };

          await supabase.from('practice_sessions').insert({
            user_id: user.id,
            ...sessionData,
          });

          onComplete(sessionData);
        }
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTokens = currentTokens.permanent + currentTokens.resettable - tokensConsumed;

  if (loading) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900 p-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-white mb-2">
          {scenario.title}
        </Text>
        <Text className="text-gray-400">{scenario.prompt}</Text>
      </View>

      <View className="bg-gray-800 rounded-lg p-4 mb-6">
        <View className="flex-row justify-between">
          <Text className="text-gray-400">Tokens Remaining</Text>
          <Text className="text-white font-semibold">
            {remainingTokens.toFixed(2)}
          </Text>
        </View>
      </View>

      <View className="bg-purple-900 rounded-lg p-6 mb-6 items-center">
        <Text className="text-4xl font-bold text-white mb-2">
          {formatTime(elapsedTime)}
        </Text>
        <Text className="text-purple-300">
          {tokensConsumed.toFixed(3)} tokens used
        </Text>
      </View>

      {isActive && !isPaused && (
        <View className="items-center mb-6">
          <View className="bg-purple-600 rounded-full p-4">
            <Ionicons name="mic" size={48} color="white" />
          </View>
          <Text className="text-white mt-2">Listening...</Text>
        </View>
      )}

      <View className="flex-row justify-center">
        {!isActive ? (
          <TouchableOpacity
            className="bg-purple-600 px-8 py-3 rounded-lg"
            onPress={startSession}
          >
            <Text className="text-white font-semibold">Start Session</Text>
          </TouchableOpacity>
        ) : (
          <>
            {!isPaused ? (
              <TouchableOpacity
                className="bg-yellow-600 px-6 py-3 rounded-lg mr-2"
                onPress={pauseSession}
              >
                <Text className="text-white font-semibold">Pause</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="bg-green-600 px-6 py-3 rounded-lg mr-2"
                onPress={resumeSession}
              >
                <Text className="text-white font-semibold">Resume</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="bg-red-600 px-6 py-3 rounded-lg"
              onPress={endSession}
            >
              <Text className="text-white font-semibold">End</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {!isActive && (
        <TouchableOpacity className="mt-4" onPress={onCancel}>
          <Text className="text-gray-400 text-center">Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
} 