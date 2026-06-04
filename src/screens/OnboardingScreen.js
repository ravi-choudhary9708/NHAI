import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../context/AppContext';
import { C } from '../constants/config';

export const OnboardingScreen = () => {
  const { setScreen } = useContext(AppContext);

  return (
    <View style={[styles.container, { backgroundColor: C.bg, padding: 32 }]}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Image source={require('../../assets/nhai.png')} style={styles.nhaiImage} resizeMode="contain" />
        <Text style={styles.onboardingTitle}>SatyaAuth</Text>
        <Text style={styles.onboardingSubtitle}>Secure Field Attendance for NHAI Workers, powered by Datalake 3.0</Text>
      </View>
      <TouchableOpacity style={styles.minimalBtn} onPress={async () => {
        await AsyncStorage.setItem('has_launched', 'true');
        setScreen('REGISTER');
      }}>
        <Text style={styles.minimalBtnText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  nhaiImage: { width: 80, height: 80, marginBottom: 24 },
  onboardingTitle: { fontSize: 40, fontWeight: '800', color: C.textPrimary, marginBottom: 12, letterSpacing: -1 },
  onboardingSubtitle: { fontSize: 16, color: C.textSecondary, lineHeight: 24 },
  minimalBtn: { backgroundColor: C.primary, width: '100%', paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
  minimalBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
