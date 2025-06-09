import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { getDeviceFingerprint } from '../../lib/deviceFingerprint';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!phone) {
          Alert.alert('Error', 'Phone number is required');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              phone_number: phone,
            },
          },
        });

        if (error) throw error;
        if (data.user) {
          await handlePostAuth(data.user.id);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (data.user) {
          await handlePostAuth(data.user.id);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePostAuth = async (userId: string) => {
    try {
      const deviceFingerprint = await getDeviceFingerprint();

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) {
        await supabase.from('profiles').insert({
          id: userId,
          device_fingerprints: [deviceFingerprint],
        });

        const { data: bonusResult } = await supabase.rpc('grant_registration_bonus', {
          p_user_id: userId,
          p_device_fingerprint: deviceFingerprint,
        });

        if (bonusResult?.success) {
          Alert.alert('Welcome!', 'You received 6 free tokens!');
        }
      }

      onAuthSuccess();
    } catch (error) {
      console.error('Post-auth error:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 px-6 justify-center">
            <Text className="text-4xl font-bold text-white mb-8">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </Text>

            <TextInput
              className="bg-gray-800 text-white px-4 py-3 rounded-lg mb-3"
              placeholder="Email"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              className="bg-gray-800 text-white px-4 py-3 rounded-lg mb-3"
              placeholder="Password"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {mode === 'signup' && (
              <TextInput
                className="bg-gray-800 text-white px-4 py-3 rounded-lg mb-3"
                placeholder="Phone Number"
                placeholderTextColor="#6B7280"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            )}

            <TouchableOpacity
              className="bg-purple-600 py-3 rounded-lg mb-4"
              onPress={handleEmailAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold">
                  {mode === 'signin' ? 'Sign In' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              <Text className="text-purple-400 text-center">
                {mode === 'signin'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 