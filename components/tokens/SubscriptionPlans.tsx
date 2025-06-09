import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Plan {
  id: string;
  name: string;
  price: string;
  tokens: number;
  period: string;
  popular?: boolean;
}

const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 'weekly',
    name: 'Weekly',
    price: '$19.99',
    tokens: 50,
    period: 'week',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$69.99',
    tokens: 200,
    period: 'month',
    popular: true,
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    price: '$189.99',
    tokens: 600,
    period: 'quarter',
  },
  {
    id: 'biannual',
    name: 'Bi-Annual',
    price: '$349.99',
    tokens: 1200,
    period: '6 months',
  },
];

interface SubscriptionPlansProps {
  currentPlan?: string;
  onSubscribe: (planId: string) => void;
}

export default function SubscriptionPlans({
  currentPlan,
  onSubscribe,
}: SubscriptionPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan || 'monthly');

  const handleSubscribe = () => {
    Alert.alert(
      'Subscribe',
      `Subscribe to ${selectedPlan} plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => onSubscribe(selectedPlan),
        },
      ]
    );
  };

  const handleOneTimePurchase = () => {
    Alert.alert(
      'One-Time Purchase',
      '50 permanent tokens for $24.99',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Purchase' },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="p-4">
        <Text className="text-2xl font-bold text-white mb-6">
          Choose Your Plan
        </Text>

        {/* One-time purchase */}
        <TouchableOpacity
          className="bg-gray-800 rounded-lg p-4 mb-4"
          onPress={handleOneTimePurchase}
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white font-semibold text-lg">
                One-Time Purchase
              </Text>
              <Text className="text-gray-400">50 permanent tokens</Text>
            </View>
            <Text className="text-purple-400 font-bold text-xl">$24.99</Text>
          </View>
        </TouchableOpacity>

        <Text className="text-gray-500 text-center my-4">OR SUBSCRIBE</Text>

        {/* Subscription plans */}
        {SUBSCRIPTION_PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            className={`rounded-lg p-4 mb-3 ${
              selectedPlan === plan.id
                ? 'bg-purple-900 border-2 border-purple-600'
                : 'bg-gray-800'
            }`}
            onPress={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <View className="absolute top-0 right-0 bg-purple-600 px-2 py-1 rounded-bl-lg">
                <Text className="text-white text-xs font-semibold">
                  MOST POPULAR
                </Text>
              </View>
            )}

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-white font-semibold text-lg">
                  {plan.name}
                </Text>
                <Text className="text-gray-400">
                  {plan.tokens} tokens/{plan.period}
                </Text>
              </View>
              <Text className="text-purple-400 font-bold text-xl">
                {plan.price}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          className="bg-purple-600 rounded-lg py-3 mt-4"
          onPress={handleSubscribe}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Subscribe Now
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 