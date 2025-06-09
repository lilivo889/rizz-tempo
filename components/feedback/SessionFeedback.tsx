import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useDatabase';

interface SessionFeedbackProps {
  sessionData: {
    scenario_type: string;
    duration_seconds: number;
    session_id?: string;
  };
  onComplete: () => void;
}

export default function SessionFeedback({ sessionData, onComplete }: SessionFeedbackProps) {
  const { user } = useAuth();
  const [confidenceScore, setConfidenceScore] = useState(5);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const feedbackCategories = [
    {
      id: 'opening',
      label: 'Opening & Introduction',
      icon: 'hand-right-outline',
      tips: [
        'Started with a friendly greeting',
        'Made good eye contact',
        'Showed genuine interest',
      ],
    },
    {
      id: 'conversation',
      label: 'Conversation Flow',
      icon: 'chatbubbles-outline',
      tips: [
        'Asked open-ended questions',
        'Listened actively',
        'Shared relevant stories',
      ],
    },
    {
      id: 'confidence',
      label: 'Confidence & Body Language',
      icon: 'fitness-outline',
      tips: [
        'Maintained good posture',
        'Spoke clearly and at good pace',
        'Showed authentic personality',
      ],
    },
    {
      id: 'closing',
      label: 'Closing & Next Steps',
      icon: 'arrow-forward-circle-outline',
      tips: [
        'Ended conversation naturally',
        'Suggested concrete next steps',
        'Left positive impression',
      ],
    },
  ];

  const handleSaveFeedback = async () => {
    if (!user || !sessionData.session_id) return;

    setSaving(true);
    try {
      await supabase
        .from('practice_sessions')
        .update({
          confidence_score: confidenceScore,
          feedback: notes,
        })
        .eq('id', sessionData.session_id)
        .eq('user_id', user.id);

      onComplete();
    } catch (error) {
      console.error('Error saving feedback:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="p-4">
        {/* Session Summary */}
        <View className="bg-gray-800 rounded-lg p-4 mb-6">
          <Text className="text-xl font-bold text-white mb-2">
            Session Complete! 🎉
          </Text>
          <View className="flex-row justify-between">
            <Text className="text-gray-400">Scenario:</Text>
            <Text className="text-white">{sessionData.scenario_type}</Text>
          </View>
          <View className="flex-row justify-between mt-2">
            <Text className="text-gray-400">Duration:</Text>
            <Text className="text-white">{formatDuration(sessionData.duration_seconds)}</Text>
          </View>
        </View>

        {/* Confidence Rating */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-3">
            How confident did you feel?
          </Text>
          <View className="flex-row justify-between items-center">
            {[...Array(10)].map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setConfidenceScore(i + 1)}
              >
                <View
                  className={`w-8 h-8 rounded-full ${
                    i < confidenceScore ? 'bg-purple-600' : 'bg-gray-700'
                  } items-center justify-center`}
                >
                  <Text className="text-white text-xs">{i + 1}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Performance Tips */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-3">
            Performance Analysis
          </Text>
          {feedbackCategories.map((category) => (
            <View key={category.id} className="bg-gray-800 rounded-lg p-4 mb-3">
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name={category.icon as any}
                  size={24}
                  color="#A855F7"
                />
                <Text className="text-white font-semibold ml-2">
                  {category.label}
                </Text>
              </View>
              {category.tips.map((tip, index) => (
                <View key={index} className="flex-row items-start mt-2">
                  <Text className="text-purple-400 mr-2">•</Text>
                  <Text className="text-gray-300 flex-1">{tip}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Personal Notes */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-3">
            Personal Notes
          </Text>
          <TextInput
            className="bg-gray-800 text-white p-4 rounded-lg"
            placeholder="Add notes about your performance..."
            placeholderTextColor="#6B7280"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          className="bg-purple-600 py-3 rounded-lg mb-3"
          onPress={handleSaveFeedback}
          disabled={saving}
        >
          <Text className="text-white text-center font-semibold">
            Save & Continue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="py-3"
          onPress={onComplete}
        >
          <Text className="text-gray-400 text-center">
            Skip Feedback
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 