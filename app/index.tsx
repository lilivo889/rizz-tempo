import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useProfile, usePracticeSessions, useConversationScenarios } from '../hooks/useDatabase';
import { supabase } from '../lib/supabase';
import TokenDisplay from '../components/tokens/TokenDisplay';
import DailyChallenge from '../components/challenges/DailyChallenge';
import VoicePracticeSession from '../components/practice/VoicePracticeSession';
import SessionFeedback from '../components/feedback/SessionFeedback';
import SubscriptionPlans from '../components/tokens/SubscriptionPlans';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id);
  const { sessions } = usePracticeSessions(user?.id);
  const { scenarios } = useConversationScenarios();
  
  const [currentView, setCurrentView] = useState<'home' | 'practice' | 'feedback' | 'subscription'>('home');
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [tokens, setTokens] = useState({ permanent: 0, resettable: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTokens();
    }
  }, [user]);

  const fetchTokens = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('user_tokens')
        .select('permanent_tokens, resettable_tokens')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setTokens({
          permanent: data.permanent_tokens || 0,
          resettable: data.resettable_tokens || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTokens();
    setRefreshing(false);
  };

  const handleStartPractice = (scenario: any) => {
    setSelectedScenario(scenario);
    setCurrentView('practice');
  };

  const handleSessionComplete = (data: any) => {
    setSessionData(data);
    setCurrentView('feedback');
    fetchTokens(); // Refresh token balance
  };

  const handleFeedbackComplete = () => {
    setCurrentView('home');
    setSelectedScenario(null);
    setSessionData(null);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (currentView === 'practice' && selectedScenario) {
    return (
      <VoicePracticeSession
        scenario={selectedScenario}
        onComplete={handleSessionComplete}
        onCancel={() => setCurrentView('home')}
      />
    );
  }

  if (currentView === 'feedback' && sessionData) {
    return (
      <SessionFeedback
        sessionData={sessionData}
        onComplete={handleFeedbackComplete}
      />
    );
  }

  if (currentView === 'subscription') {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <View className="flex-row items-center p-4 border-b border-gray-800">
          <TouchableOpacity onPress={() => setCurrentView('home')}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold ml-4">
            Subscription Plans
          </Text>
        </View>
        <SubscriptionPlans
          onSubscribe={(planId) => {
            console.log('Subscribe to:', planId);
            setCurrentView('home');
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#A855F7"
          />
        }
      >
        {/* Header */}
        <View className="flex-row justify-between items-center p-4">
          <View>
            <Text className="text-2xl font-bold text-white">
              Hi {profile?.username || 'there'}! 👋
            </Text>
            <Text className="text-gray-400">
              Ready to practice today?
            </Text>
          </View>
          <TouchableOpacity onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Token Display */}
        <TokenDisplay
          permanentTokens={tokens.permanent}
          resettableTokens={tokens.resettable}
          onPurchasePress={() => setCurrentView('subscription')}
        />

        {/* Daily Challenge */}
        <View className="mt-6">
          <DailyChallenge onStartChallenge={handleStartPractice} />
        </View>

        {/* Practice Scenarios */}
        <View className="mt-6 px-4">
          <Text className="text-xl font-bold text-white mb-4">
            Practice Scenarios
          </Text>
          {scenarios.map((scenario: any) => (
            <TouchableOpacity
              key={scenario.id}
              className="bg-gray-800 rounded-lg p-4 mb-3"
              onPress={() => handleStartPractice(scenario)}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-white font-semibold text-lg">
                    {scenario.title}
                  </Text>
                  <Text className="text-gray-400 mt-1">
                    {scenario.description}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <Text className="text-gray-500 text-sm">Difficulty: </Text>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name="star"
                        size={12}
                        color={i < scenario.difficulty_level ? '#A855F7' : '#374151'}
                      />
                    ))}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <View className="mt-6 px-4 mb-8">
            <Text className="text-xl font-bold text-white mb-4">
              Recent Sessions
            </Text>
            {sessions.slice(0, 3).map((session: any) => (
              <View
                key={session.id}
                className="bg-gray-800 rounded-lg p-4 mb-3"
              >
                <Text className="text-white font-semibold">
                  {session.scenario_type}
                </Text>
                <View className="flex-row justify-between mt-2">
                  <Text className="text-gray-400">
                    {new Date(session.created_at).toLocaleDateString()}
                  </Text>
                  <Text className="text-purple-400">
                    {Math.floor(session.duration_seconds / 60)}m {session.duration_seconds % 60}s
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
