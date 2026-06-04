import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, NativeModules } from 'react-native';
import { SYNC_SERVER } from '../constants/config';
import { logToServer } from '../utils/logger';
import * as Location from 'expo-location';

const { FaceAuthNative } = NativeModules;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [screen, setScreen] = useState('LOADING');
  const [workerProfile, setWorkerProfile] = useState(null);
  const [punchAction, setPunchAction] = useState(null);
  const [showResult, setShowResult] = useState(null);
  const [todayPunchIn, setTodayPunchIn] = useState(null);
  const [todayPunchOut, setTodayPunchOut] = useState(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceLog, setAttendanceLog] = useState([]);

  useEffect(() => {
    FaceAuthNative.initModels().catch(console.error);
  }, []);

  useEffect(() => {
    const init = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
      }

      const launched = await AsyncStorage.getItem('has_launched');
      const profileRaw = await AsyncStorage.getItem('worker_profile');

      if (!launched) {
        setScreen('ONBOARDING');
        return;
      }

      if (profileRaw) {
        const profile = JSON.parse(profileRaw);
        setWorkerProfile(profile);
        setScreen('LOGIN');
      } else {
        setScreen('REGISTER');
      }
    };
    init().catch(console.error);
  }, []);

  useEffect(() => {
    if (screen === 'HOME') {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [screen]);

  useEffect(() => {
    if (screen === 'HOME' || screen === 'ATTENDANCE') {
      loadTodayAttendance();
    }
  }, [screen]);

  const loadTodayAttendance = async () => {
    const raw = await AsyncStorage.getItem('attendance_log');
    const log = raw ? JSON.parse(raw) : [];
    setAttendanceLog(log);

    const todayKey = new Date().toISOString().slice(0, 10);
    const today = log.filter(r => r.timestamp.startsWith(todayKey));
    const punchIn = today.find(r => r.type === 'punch_in');
    const punchOut = today.find(r => r.type === 'punch_out');

    if (punchIn) setTodayPunchIn(new Date(punchIn.timestamp));
    if (punchOut) setTodayPunchOut(new Date(punchOut.timestamp));

    const pending = log.filter(r => !r.synced).length;
    setPendingSyncCount(pending);
  };

  const syncRecords = async () => {
    const raw = await AsyncStorage.getItem('attendance_log');
    const log = raw ? JSON.parse(raw) : [];
    const unsynced = log.filter(r => !r.synced);
    if (unsynced.length === 0) {
      Alert.alert('Sync Status', 'All records are already synced to Datalake 3.0!');
      return;
    }

    try {
      await logToServer('SYNC', `Initiating sync for ${unsynced.length} records (Aadhaar: ${workerProfile.aadhaar})`);
      const res = await fetch(`${SYNC_SERVER}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: workerProfile.aadhaar, records: unsynced }),
      });
      if (res.ok) {
        const syncedIds = new Set(unsynced.map(r => r.id));
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const updated = log
          .map(r => syncedIds.has(r.id) ? { ...r, synced: true } : r)
          .filter(r => new Date(r.timestamp).getTime() > thirtyDaysAgo || !r.synced);
        await AsyncStorage.setItem('attendance_log', JSON.stringify(updated));
        setAttendanceLog(updated);
        setPendingSyncCount(0);
        await logToServer('SYNC', 'Sync successful.');
        Alert.alert('Sync Status', `Successfully synced ${unsynced.length} records!`);
      } else {
        Alert.alert('Sync Failed', 'Received an error from the sync server.');
      }
    } catch {
      await logToServer('SYNC_ERROR', 'Offline or failed to reach sync server.');
      Alert.alert('Sync Failed', 'Network offline or unable to reach sync server. Make sure your PC server is running and the IP address is correct.');
    }
  };

  const handlePunchResult = async (matched) => {
    if (!matched) return;

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const existing = await AsyncStorage.getItem('attendance_log');
    const log = existing ? JSON.parse(existing) : [];

    const todayRecords = log.filter(r => r.timestamp.startsWith(todayKey));
    const hasPunchIn = todayRecords.some(r => r.type === 'punch_in');

    const type = hasPunchIn ? 'punch_out' : 'punch_in';

    if (type === 'punch_in') {
      setTodayPunchIn(now);
    } else {
      setTodayPunchOut(now);
    }

    setPunchAction(type);
    setShowResult('success');
    setScreen('HOME');
    
    // Fetch GPS and save to DB asynchronously so it doesn't block UI transition
    (async () => {
      let location = null;
      try {
        location = await Location.getLastKnownPositionAsync();
        if (!location) {
          location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
        }
      } catch (err) {
        console.warn('Location fetch failed', err);
      }
      const lat = location?.coords?.latitude || 'Unknown';
      const lon = location?.coords?.longitude || 'Unknown';

      const record = {
        id: `${todayKey}-${type}-${Date.now()}`,
        type,
        timestamp: now.toISOString(),
        employeeId: workerProfile.aadhaar,
        name: workerProfile.name,
        latitude: lat,
        longitude: lon,
        synced: false,
      };

      log.push(record);
      await AsyncStorage.setItem('attendance_log', JSON.stringify(log));
      setPendingSyncCount(prev => prev + 1);

      await logToServer('ATTENDANCE', {
        action: type === 'punch_in' ? 'Punch In' : 'Punch Out',
        name: workerProfile.name,
        aadhaar: workerProfile.aadhaar,
        latitude: lat,
        longitude: lon,
        message: `User ${workerProfile.name} successfully punched ${type === 'punch_in' ? 'in' : 'out'} at ${lat}, ${lon}`
      });
    })();
  };

  const handleLogout = async () => {
    await logToServer('LOGOUT', `User ${workerProfile?.name} logged out / wiped data.`);
    await AsyncStorage.removeItem('worker_profile');
    setWorkerProfile(null);
    setScreen('REGISTER');
  };

  return (
    <AppContext.Provider value={{
      screen, setScreen,
      workerProfile, setWorkerProfile,
      punchAction, setPunchAction,
      showResult, setShowResult,
      todayPunchIn, setTodayPunchIn,
      todayPunchOut, setTodayPunchOut,
      pendingSyncCount, setPendingSyncCount,
      currentTime, setCurrentTime,
      attendanceLog, setAttendanceLog,
      loadTodayAttendance, syncRecords, handlePunchResult, handleLogout
    }}>
      {children}
    </AppContext.Provider>
  );
};
