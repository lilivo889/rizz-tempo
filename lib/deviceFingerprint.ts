import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@RizzTempo:deviceId';

export const getDeviceFingerprint = async (): Promise<string> => {
  try {
    // Check if we already have a stored device ID
    const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (storedId) {
      return storedId;
    }

    // Generate device fingerprint based on device characteristics
    const deviceInfo = {
      brand: Device.brand,
      manufacturer: Device.manufacturer,
      modelName: Device.modelName,
      modelId: Device.modelId,
      deviceYearClass: Device.deviceYearClass,
      totalMemory: Device.totalMemory,
      osName: Device.osName,
      osVersion: Device.osVersion,
      osBuildId: Device.osBuildId,
      platformApiLevel: Device.platformApiLevel,
      deviceName: Device.deviceName,
    };

    // Add application-specific info
    const appInfo = {
      applicationId: Application.applicationId,
      nativeApplicationVersion: Application.nativeApplicationVersion,
      nativeBuildVersion: Application.nativeBuildVersion,
    };

    // Combine all info
    const fingerprintData = {
      ...deviceInfo,
      ...appInfo,
      timestamp: Date.now(), // Add timestamp for uniqueness
    };

    // Generate hash
    const fingerprintString = JSON.stringify(fingerprintData);
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      fingerprintString
    );

    // Store for future use
    await AsyncStorage.setItem(DEVICE_ID_KEY, hash);

    return hash;
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    // Fallback to a random ID if fingerprinting fails
    const fallbackId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${Date.now()}-${Math.random()}`
    );
    await AsyncStorage.setItem(DEVICE_ID_KEY, fallbackId);
    return fallbackId;
  }
};

export const clearDeviceFingerprint = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
  } catch (error) {
    console.error('Error clearing device fingerprint:', error);
  }
}; 