import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function LoadingState({ message = 'Connecting to EV Multi-Agent Backend…' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#DFFF00" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
});
