import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useVehicle } from '../context/VehicleContext';
import { useAuth } from '../context/AuthContext';

export default function VehicleConnectionWelcomeScreen() {
  const router = useRouter();
  const { selectedConfig, vehicleName } = useVehicle();
  const { user } = useAuth();

  const activeVehicleName = user?.vehicleName || selectedConfig?.name || vehicleName || 'Porsche Taycan EV';

  // Animation values for smooth progress bar and glowing telemetry
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const [timerText, setTimerText] = useState('ACCELERATING TELEMETRY (1S)...');

  useEffect(() => {
    // Smooth progress bar animation over 2 seconds
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();

    // Pulse animation for cyan glow badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Timer label update at 1s mark
    const subTimer = setTimeout(() => {
      setTimerText('CONNECTING MULTI-AGENT SWARM (0S)...');
    }, 1000);

    // Auto-navigate to existing dashboard after exactly 2 seconds
    const navTimer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2000);

    return () => {
      clearTimeout(subTimer);
      clearTimeout(navTimer);
    };
  }, []);

  const handleManualProceed = () => {
    router.replace('/(tabs)');
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Background ambient glowing spotlights */}
      <View style={styles.glowSpotlightTop} />
      <View style={styles.glowSpotlightBottom} />

      <View style={styles.contentContainer}>
        {/* Top: EV/Mobility glowing logo with lightning icon */}
        <View style={styles.logoWrapper}>
          <Animated.View style={[styles.logoGlowCircle, { opacity: pulseAnim }]} />
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          {/* Main Heading */}
          <Text style={styles.headingTitle}>Drive Smarter. Ride</Text>
          <Text style={styles.headingHighlight}>Greener.</Text>

          {/* Welcome back */}
          <Text style={styles.welcomeSubtitle}>Welcome back!</Text>

          {/* Connection Status Card */}
          <View style={styles.vehicleConnectionBadge}>
            <Text style={styles.connLabel}>Connected Vehicle:</Text>
            <View style={styles.connRow}>
              <Text style={styles.vehicleNameText}>{activeVehicleName}</Text>
              <View style={styles.verifiedChip}>
                <Text style={styles.verifiedText}>✓ PIN Verified</Text>
              </View>
            </View>
          </View>

          {/* Animated Telemetry Loading Bar */}
          <View style={styles.telemetryBarContainer}>
            <View style={styles.telemetryBarTrack}>
              <Animated.View style={[styles.telemetryBarFill, { width: progressWidth }]} />
            </View>
          </View>

          {/* Accelerating text */}
          <Text style={styles.acceleratingText}>{timerText}</Text>

          {/* Bottom Proceed Button */}
          <TouchableOpacity
            style={styles.proceedBtn}
            onPress={handleManualProceed}
            activeOpacity={0.8}
          >
            <Text style={styles.proceedBtnText}>PROCEED TO DASHBOARD NOW →</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footerNote}>
          EV Multi-Agent Operating System · Unified Intelligence
        </Text>
      </View>
    </SafeAreaView>
  );
}

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080805',
  },
  glowSpotlightTop: {
    position: 'absolute',
    top: -60,
    left: '20%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  glowSpotlightBottom: {
    position: 'absolute',
    bottom: -80,
    right: '10%',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(212, 212, 20, 0.1)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  logoGlowCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#00f0ff',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#d4d414',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00f0ff',
    shadowColor: '#d4d414',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 34,
    color: '#080805',
    fontWeight: '900',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#111110',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.35)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  headingTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headingHighlight: {
    color: '#22c55e',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: '#999994',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  vehicleConnectionBadge: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(212, 212, 20, 0.3)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  connLabel: {
    color: '#555550',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  connRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleNameText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
  },
  verifiedChip: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '900',
  },
  telemetryBarContainer: {
    width: '100%',
    marginBottom: 10,
  },
  telemetryBarTrack: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  telemetryBarFill: {
    height: '100%',
    backgroundColor: '#00f0ff',
    borderRadius: 5,
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  acceleratingText: {
    color: '#d4d414',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 24,
    textAlign: 'center',
  },
  proceedBtn: {
    width: '100%',
    backgroundColor: '#d4d414',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#d4d414',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  proceedBtnText: {
    color: '#080805',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footerNote: {
    color: '#555550',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 24,
  },
});
