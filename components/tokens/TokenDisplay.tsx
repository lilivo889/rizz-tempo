import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TokenDisplayProps {
  permanentTokens: number;
  resettableTokens: number;
  onPurchasePress?: () => void;
}

export default function TokenDisplay({
  permanentTokens,
  resettableTokens,
  onPurchasePress,
}: TokenDisplayProps) {
  const totalTokens = permanentTokens + resettableTokens;

  return (
    <View className="bg-gray-800 rounded-lg p-4 mx-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons name="flash" size={24} color="#A855F7" />
          <Text className="text-white text-lg font-semibold ml-2">
            Token Balance
          </Text>
        </View>
        <Text className="text-2xl font-bold text-purple-400">
          {totalTokens.toFixed(2)}
        </Text>
      </View>

      <View className="space-y-2">
        <View className="flex-row justify-between">
          <Text className="text-gray-400">Permanent</Text>
          <Text className="text-white">{permanentTokens.toFixed(2)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-gray-400">Resettable</Text>
          <Text className="text-white">{resettableTokens.toFixed(2)}</Text>
        </View>
      </View>

      {onPurchasePress && (
        <TouchableOpacity
          className="bg-purple-600 rounded-lg py-2 mt-3"
          onPress={onPurchasePress}
        >
          <Text className="text-white text-center font-semibold">
            Get More Tokens
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
} 