import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../constants/config';

export const AppBar = ({ title, onBack, rightText, onRight }) => (
  <View style={styles.appBar}>
    {onBack ? (
      <TouchableOpacity style={styles.appBarBtn} onPress={onBack}>
        <Text style={styles.appBarIcon}>←</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.appBarBtn} />
    )}
    <Text style={styles.appBarTitle}>{title}</Text>
    {onRight ? (
      <TouchableOpacity style={styles.appBarBtn} onPress={onRight}>
        <Text style={styles.appBarTextAction}>{rightText}</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.appBarBtn} />
    )}
  </View>
);

const styles = StyleSheet.create({
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, height: 60, marginTop: 40 },
  appBarBtn: { width: 60, height: '100%', justifyContent: 'center' },
  appBarIcon: { fontSize: 24, color: C.primary },
  appBarTitle: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
  appBarTextAction: { fontSize: 15, fontWeight: '500', color: C.textSecondary, textAlign: 'right' },
});
