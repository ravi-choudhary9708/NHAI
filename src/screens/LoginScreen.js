import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppContext } from '../context/AppContext';
import { AppBar } from '../components/AppBar';
import { C } from '../constants/config';
import { logToServer } from '../utils/logger';

export const LoginScreen = () => {
  const { setScreen, workerProfile, handleLogout } = useContext(AppContext);
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = async () => {
    if (!workerProfile) return;
    if (loginPin === workerProfile.pin) {
      setLoginError('');
      await logToServer('LOGIN', `User ${workerProfile.name} successfully logged in.`);
      setScreen('HOME');
    } else {
      setLoginPin('');
      setLoginError('Incorrect PIN');
      await logToServer('LOGIN_FAILED', `Failed login attempt for ${workerProfile.name}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <AppBar title="Unlock App" onRight={handleLogout} rightText="Reset" />
      <View style={{ padding: 32, alignItems: 'center' }}>
        <Text style={styles.greetingText}>Welcome, {workerProfile?.name?.split(' ')[0]}</Text>
        <Text style={styles.subGreetingText}>Aadhaar: •••• •••• {workerProfile?.aadhaar?.slice(-4) || 'XXXX'}</Text>

        <View style={styles.pinDotsContainer}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={[styles.pinDotMinimal, loginPin.length > i && styles.pinDotMinimalFilled]} />
          ))}
        </View>

        {!!loginError && <Text style={styles.errorText}>{loginError}</Text>}

        <View style={styles.keypadContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k, idx) => (
            <TouchableOpacity key={idx} style={styles.keypadBtnMinimal} onPress={() => {
              if (k === '') return;
              if (k === '⌫') {
                setLoginPin(prev => prev.slice(0, -1));
              } else if (loginPin.length < 4) {
                setLoginPin(prev => prev + k);
              }
            }} disabled={k === ''}>
              <Text style={styles.keypadBtnTextMinimal}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.minimalBtn, { width: '100%' }]} onPress={handleLogin}>
          <Text style={styles.minimalBtnText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  greetingText: { fontSize: 32, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.5 },
  subGreetingText: { fontSize: 15, color: C.textSecondary, marginTop: 4 },
  pinDotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginVertical: 32 },
  pinDotMinimal: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.border },
  pinDotMinimalFilled: { backgroundColor: C.primary },
  keypadContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: 280, gap: 16, marginBottom: 32 },
  keypadBtnMinimal: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  keypadBtnTextMinimal: { fontSize: 28, fontWeight: '400', color: C.textPrimary },
  errorText: { color: C.danger, textAlign: 'center', marginBottom: 16, fontWeight: '600' },
  minimalBtn: { backgroundColor: C.primary, width: '100%', paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
  minimalBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
