import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../constants/config';

export const RegisterSuccessScreen = () => {
  return (
    <View style={[styles.container, styles.center, { backgroundColor: C.bg, padding: 32 }]}>
      <View style={styles.successCircle}>
        <Text style={styles.successIcon}>✓</Text>
      </View>
      <Text style={styles.successTitle}>Verified</Text>
      <Text style={styles.successSubtitle}>Registered with Datalake 3.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.success, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successIcon: { color: '#FFF', fontSize: 40, fontWeight: '300' },
  successTitle: { fontSize: 32, fontWeight: '700', color: C.textPrimary, marginBottom: 8 },
  successSubtitle: { fontSize: 16, color: C.textSecondary },
});
