import React, { useState, useRef, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, NativeModules, Keyboard } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../context/AppContext';
import { AppBar } from '../components/AppBar';
import { C, REGISTER_FRAMES, BLINK_SPIKE_THRESHOLD, BLINK_RETURN_THRESHOLD } from '../constants/config';
import { averageEmbeddings, l2Normalize } from '../utils/math';
import { logToServer } from '../utils/logger';

const { FaceAuthNative } = NativeModules;

export const RegisterScreen = () => {
  const { setScreen, setWorkerProfile } = useContext(AppContext);
  const [permission, requestPermission] = useCameraPermissions();
  
  const [nameInput, setNameInput] = useState('');
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [status, setStatus] = useState('Scanning Face Data...');
  const registeringRef = useRef(false);
  const cameraRef = useRef(null);

  const registerSelfie = async () => {
    Keyboard.dismiss();
    setErrorMsg('');
    if (!nameInput.trim() || !aadhaarInput.trim() || !pinInput.trim()) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    if (aadhaarInput.length !== 12) {
      setErrorMsg('Aadhaar Number must be exactly 12 digits.');
      return;
    }

    if (pinInput.length !== 4) {
      setErrorMsg('Security PIN must be exactly 4 digits.');
      return;
    }

    if (!permission?.granted) {
      const perm = await requestPermission();
      if (!perm.granted) {
        alert('Camera permission is required to register.');
        return;
      }
    }

    if (isRegistering || registeringRef.current) return;
    setIsRegistering(true);
    registeringRef.current = true;
    setCaptureCount(0);
    setStatus('Analyzing Face for Liveness...');

    setTimeout(async () => {
      try {
        if (!cameraRef.current) {
          setIsRegistering(false);
          registeringRef.current = false;
          alert('Camera failed to initialize');
          return;
        }

        let blinkDetected = false;
        let baselineScore = null;
        let highScoreSeen = false;
        let spikeFrameCount = 0;
        let attempts = 0;
        let noFaceCount = 0;
        const recentFaceUris = [];
        const MAX_RECENT = REGISTER_FRAMES;

        while (registeringRef.current && attempts < 40) {
          attempts++;
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.20, skipProcessing: true });
          if (!registeringRef.current) break;

          const res = await FaceAuthNative.processFrame(photo.uri);
          
          if (res.status === 'NO_FACE') {
            noFaceCount++;
            setStatus('No face detected');
            if (noFaceCount >= 4) {
              setStatus('Stopped: Non-living or No Face');
              await logToServer('SPOOF', 'Registration rejected: Non-living or no face detected.');
              registeringRef.current = false;
              setIsRegistering(false);
              return;
            }
          } else if (res.status === 'FACE_DETECTED') {
            noFaceCount = 0;
            recentFaceUris.push(photo.uri);
            if (recentFaceUris.length > MAX_RECENT) recentFaceUris.shift();
            setCaptureCount(recentFaceUris.length);

            if (baselineScore === null) {
              baselineScore = res.blinkScore;
              setStatus('Active Challenge: Blink to Register');
            } else {
              const ratio = (res.blinkScore - baselineScore) / baselineScore;
              if (!highScoreSeen) {
                baselineScore = baselineScore * 0.6 + res.blinkScore * 0.4;
                if (ratio > BLINK_SPIKE_THRESHOLD) {
                  highScoreSeen = true;
                  spikeFrameCount = 0;
                } else {
                  setStatus('Active Challenge: Blink to Register');
                }
              } else {
                spikeFrameCount++;
                if (spikeFrameCount > 5) {
                  highScoreSeen = false;
                  baselineScore = res.blinkScore;
                } else if (ratio < BLINK_RETURN_THRESHOLD) {
                  blinkDetected = true;
                }
              }
            }
          }

          if (blinkDetected && recentFaceUris.length >= REGISTER_FRAMES) {
            setStatus('Liveness verified. Saving template...');
            
            const embeddings = await Promise.all(
              recentFaceUris.map(async (uri) => {
                const raw = await FaceAuthNative.getEmbedding(uri);
                return l2Normalize(raw);
              })
            );

            const template = averageEmbeddings(embeddings);
            const profile = {
              name: nameInput.trim(),
              aadhaar: aadhaarInput.trim(),
              pin: pinInput.trim(),
              embedding: template,
              registeredAt: new Date().toISOString(),
            };
            await AsyncStorage.setItem('worker_profile', JSON.stringify(profile));
            setWorkerProfile(profile);
            
            setIsRegistering(false);
            registeringRef.current = false;
            setCaptureCount(0);
            
            await logToServer('REGISTER', {
              name: profile.name,
              aadhaar: profile.aadhaar,
              message: `New user registered securely with liveness: ${profile.name} (${profile.aadhaar})`
            });
            
            setScreen('REGISTER_SUCCESS');
            setTimeout(() => {
              setScreen('LOGIN');
            }, 2000);
            return;
          }
        }

        if (registeringRef.current) {
          setStatus('Spoof detected or Timeout');
          await logToServer('SPOOF', 'Registration spoof detected or Timeout reached.');
          registeringRef.current = false;
          setIsRegistering(false);
        }
      } catch (err) {
        console.error(err);
        alert('Registration failed – please try again');
        setIsRegistering(false);
        registeringRef.current = false;
        setCaptureCount(0);
      }
    }, 800);
  };

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <AppBar title="Register" onBack={() => setScreen('ONBOARDING')} />
      <View style={{ padding: 32 }}>
        <Text style={styles.screenHeader}>Datalake 3.0 Enrollment</Text>
        
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.minimalInput}
          placeholder="e.g. Rahul Sharma"
          placeholderTextColor={C.textSecondary}
          value={nameInput}
          onChangeText={setNameInput}
        />
        
        <Text style={styles.inputLabel}>Aadhaar Number</Text>
        <TextInput
          style={styles.minimalInput}
          placeholder="12-digit Aadhaar"
          placeholderTextColor={C.textSecondary}
          value={aadhaarInput}
          onChangeText={text => setAadhaarInput(text.replace(/[^0-9]/g, '').slice(0, 12))}
          keyboardType="numeric"
        />

        <Text style={styles.inputLabel}>Security PIN</Text>
        <TextInput
          style={styles.minimalInput}
          placeholder="4-digit PIN"
          placeholderTextColor={C.textSecondary}
          value={pinInput}
          onChangeText={text => setPinInput(text.replace(/[^0-9]/g, '').slice(0, 4))}
          secureTextEntry
          keyboardType="numeric"
        />

        {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        <TouchableOpacity style={[styles.minimalBtn, { marginTop: 16 }]} onPress={registerSelfie}>
          <Text style={styles.minimalBtnText}>Proceed to Face Scan</Text>
        </TouchableOpacity>
      </View>

      {isRegistering && (
        <View style={StyleSheet.absoluteFill}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />
          <View style={styles.overlay}>
            <View style={styles.scanAreaMinimal} />
            <View style={styles.counterBadgeMinimal}>
              <Text style={styles.counterBadgeText}>{captureCount}/{REGISTER_FRAMES}</Text>
            </View>
            <Text style={styles.statusTextMinimal}>{status}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenHeader: { fontSize: 28, fontWeight: '700', color: C.textPrimary, marginBottom: 32, letterSpacing: -0.5 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  minimalInput: { width: '100%', borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 12, fontSize: 18, color: C.textPrimary, marginBottom: 24 },
  errorText: { color: C.danger, textAlign: 'center', marginBottom: 16, fontWeight: '600' },
  minimalBtn: { backgroundColor: C.primary, width: '100%', paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
  minimalBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  scanAreaMinimal: { width: 280, height: 280, borderRadius: 140, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  statusTextMinimal: { color: '#FFF', fontSize: 16, fontWeight: '500', textAlign: 'center', marginTop: 32, paddingHorizontal: 32 },
  counterBadgeMinimal: { position: 'absolute', top: '15%', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  counterBadgeText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
