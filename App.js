import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppProvider, AppContext } from './src/context/AppContext';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { RegisterSuccessScreen } from './src/screens/RegisterSuccessScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { AttendanceScreen } from './src/screens/AttendanceScreen';
import { C } from './src/constants/config';

const AppContent = () => {
  const { screen } = useContext(AppContext);

  switch (screen) {
    case 'LOADING':
      return (
        <View style={[styles.container, styles.center, { backgroundColor: C.bg }]}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      );
    case 'ONBOARDING': return <OnboardingScreen />;
    case 'REGISTER': return <RegisterScreen />;
    case 'REGISTER_SUCCESS': return <RegisterSuccessScreen />;
    case 'LOGIN': return <LoginScreen />;
    case 'HOME': return <HomeScreen />;
    case 'CAMERA': return <CameraScreen />;
    case 'ATTENDANCE': return <AttendanceScreen />;
    default: return null;
  }
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
});