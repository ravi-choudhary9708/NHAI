import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppContext } from '../context/AppContext';
import { C } from '../constants/config';

export const SuccessScreen = () => {
  const { setScreen, workerProfile, punchAction, currentTime, loadTodayAttendance } = useContext(AppContext);

  return (
    <TouchableOpacity activeOpacity={1} style={[styles.container, { backgroundColor: C.success, padding: 32, justifyContent: 'center' }]} onPress={() => {
      loadTodayAttendance();
      setScreen('HOME');
    }}>
      <View style={{ alignItems: 'flex-start' }}>
        <View style={styles.successCircleOutline}>
          <Text style={styles.successIconOutline}>✓</Text>
        </View>
        <Text style={styles.hugeSuccessTitle}>
          {punchAction === 'punch_in' ? 'Punched In' : 'Punched Out'}
        </Text>
        <Text style={styles.successDetailText}>
          Aadhaar verified: {workerProfile?.name}
        </Text>
        <Text style={styles.successTimeText}>
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <View style={{ marginTop: 64 }}>
          <Text style={{ color: '#FFF', fontWeight: '600' }}>Tap anywhere to continue →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  successCircleOutline: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  successIconOutline: { color: '#FFF', fontSize: 32 },
  hugeSuccessTitle: { fontSize: 48, fontWeight: '700', color: '#FFF', letterSpacing: -1, marginBottom: 8 },
  successDetailText: { fontSize: 18, color: '#FFF', opacity: 0.9, marginBottom: 32 },
  successTimeText: { fontSize: 32, fontWeight: '500', color: '#FFF' },
});
