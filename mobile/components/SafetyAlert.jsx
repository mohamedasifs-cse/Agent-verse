import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SafetyAlert({
  type = 'warning', // 'warning' | 'danger' | 'info'
  title = 'DRIVER SAFETY ALERT',
  message,
}) {
  if (!message) return null;

  return (
    <View style={[styles.container, type === 'danger' ? styles.containerDanger : styles.containerWarning]}>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>{type === 'danger' ? '🚨' : '⚠️'}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, type === 'danger' ? styles.titleDanger : styles.titleWarning]}>
          {title}
        </Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  containerWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  containerDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  iconBox: {
    marginRight: 12,
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  titleWarning: { color: '#F59E0B' },
  titleDanger: { color: '#EF4444' },
  message: {
    color: '#F4F4F5',
    fontSize: 12,
    lineHeight: 17,
  },
});
