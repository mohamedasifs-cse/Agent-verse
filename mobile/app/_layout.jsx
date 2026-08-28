import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { VehicleProvider } from '../context/VehicleContext';
import { JourneyProvider } from '../context/JourneyContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <VehicleProvider>
          <JourneyProvider>
            <StatusBar style="light" backgroundColor="#080805" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: '#080805' },
                headerTintColor: '#DFFF00',
                headerTitleStyle: { fontWeight: '800' },
                contentStyle: { backgroundColor: '#080805' },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="welcome" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ title: 'Register EV Fleet' }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="vehicle/select" options={{ title: 'Select Vehicle (Car vs Bike)' }} />
              <Stack.Screen name="booking/station" options={{ title: 'Station Details' }} />
              <Stack.Screen name="booking/slot" options={{ title: 'Select Charging Slot' }} />
              <Stack.Screen name="booking/confirmation" options={{ title: 'Booking Confirmed' }} />
              <Stack.Screen name="charging/boost" options={{ title: 'BOOST UP Simulation' }} />
              <Stack.Screen name="agent/intelligence" options={{ title: '12 Agent Swarm Intelligence' }} />
            </Stack>
          </JourneyProvider>
        </VehicleProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
