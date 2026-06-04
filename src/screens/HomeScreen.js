import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal } from 'react-native';
import { AppContext } from '../context/AppContext';
import { AppBar } from '../components/AppBar';
import { C } from '../constants/config';

export const HomeScreen = () => {
  const { 
    setScreen, 
    workerProfile, 
    todayPunchIn, 
    todayPunchOut, 
    pendingSyncCount, 
    currentTime, 
    setPunchAction, 
    syncRecords,
    showResult,
    setShowResult,
    punchAction
  } = useContext(AppContext);

  useEffect(() => {
    if (showResult === 'success') {
      const timer = setTimeout(() => {
        setShowResult(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showResult]);

  const isPunchedIn = todayPunchIn && !todayPunchOut;
  const isPunchedOut = !!todayPunchOut;

  const formatTime = (d) => {
    if (!d) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (ms) => {
    const totalMins = Math.floor(ms / 60000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}h ${m}m`;
  };

  let elapsed = '';
  if (isPunchedIn) {
    elapsed = formatDuration(currentTime.getTime() - todayPunchIn.getTime());
  }

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <AppBar title="Dashboard" onRight={() => {
        setScreen('LOGIN');
      }} rightText="Lock" />
      <View style={{ paddingHorizontal: 32, paddingTop: 16 }}>
        <View style={styles.homeHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../assets/app_icon.png')} style={styles.homeLogoImage} resizeMode="contain" />
            <View>
              <Text style={styles.greetingText}>Hello, {workerProfile?.name?.split(' ')[0]}</Text>
              <Text style={styles.dateText}>{currentTime.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</Text>
            </View>
          </View>
          {pendingSyncCount > 0 && (
            <View style={styles.syncBadgeMinimal}>
              <Text style={styles.syncBadgeTextMinimal}>{pendingSyncCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.statusCardMinimal}>
          {!todayPunchIn && <Text style={styles.statusCardText}>Ready to punch in</Text>}
          {isPunchedIn && (
            <View>
              <Text style={styles.statusCardText}>Punched in at {formatTime(todayPunchIn)}</Text>
              <Text style={styles.elapsedText}>{elapsed}</Text>
            </View>
          )}
          {isPunchedOut && <Text style={styles.statusCardText}>Shift completed · Total: {formatDuration(todayPunchOut.getTime() - todayPunchIn.getTime())}</Text>}
        </View>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {!todayPunchIn ? (
          <TouchableOpacity style={[styles.actionCircle, { backgroundColor: C.primary }]} onPress={() => {
            setPunchAction('punch_in');
            setScreen('CAMERA');
          }}>
            <Text style={styles.actionCircleTitle}>PUNCH IN</Text>
          </TouchableOpacity>
        ) : isPunchedIn ? (
          <TouchableOpacity style={[styles.actionCircle, { backgroundColor: C.primary }]} onPress={() => {
            setPunchAction('punch_out');
            setScreen('CAMERA');
          }}>
            <Text style={styles.actionCircleTitle}>PUNCH OUT</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.actionCircle, { backgroundColor: C.border }]}>
            <Text style={[styles.actionCircleTitle, { color: C.textSecondary }]}>DONE</Text>
          </View>
        )}
      </View>

      <View style={{ padding: 32, gap: 16 }}>
        {pendingSyncCount > 0 && (
          <TouchableOpacity style={[styles.minimalBtnOutline]} onPress={syncRecords}>
            <Text style={styles.minimalBtnTextOutline}>Sync Logs to Server</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.minimalBtnOutline, pendingSyncCount === 0 && { backgroundColor: C.primary }]} onPress={() => setScreen('ATTENDANCE')}>
          <Text style={[styles.minimalBtnTextOutline, pendingSyncCount === 0 && { color: '#FFF' }]}>View History</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showResult === 'success'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowResult(null)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.successCircle}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.hugeSuccessTitle}>
              {punchAction === 'punch_in' ? 'Punched In' : 'Punched Out'}
            </Text>
            <Text style={styles.successDetailText}>
              Verified: {workerProfile?.name?.split(' ')[0]}
            </Text>
            <Text style={styles.successTimeText}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  homeLogoImage: { width: 50, height: 50, marginRight: 16 },
  homeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greetingText: { fontSize: 32, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.5 },
  dateText: { fontSize: 15, color: C.textSecondary, marginTop: 4 },
  syncBadgeMinimal: { backgroundColor: C.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  syncBadgeTextMinimal: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  statusCardMinimal: { borderLeftWidth: 3, borderLeftColor: C.success, paddingLeft: 16, marginVertical: 16 },
  statusCardText: { color: C.textSecondary, fontSize: 14, fontWeight: '500', marginBottom: 4 },
  elapsedText: { fontSize: 28, fontWeight: '600', color: C.textPrimary, letterSpacing: -0.5 },
  actionCircle: { width: 180, height: 180, borderRadius: 90, justifyContent: 'center', alignItems: 'center' },
  actionCircleTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  minimalBtnOutline: { borderWidth: 1, borderColor: C.border, width: '100%', paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
  minimalBtnTextOutline: { color: C.textPrimary, fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: C.success, width: '85%', borderRadius: 24, padding: 32, alignItems: 'center', position: 'relative' },
  modalCloseBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 12 },
  modalCloseText: { color: '#FFF', fontSize: 24, fontWeight: '700' },
  successCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successIcon: { color: '#FFF', fontSize: 32 },
  hugeSuccessTitle: { fontSize: 32, fontWeight: '700', color: '#FFF', letterSpacing: -0.5, marginBottom: 8, textAlign: 'center' },
  successDetailText: { fontSize: 16, color: '#FFF', opacity: 0.9, marginBottom: 24, textAlign: 'center' },
  successTimeText: { fontSize: 28, fontWeight: '600', color: '#FFF' },
});
