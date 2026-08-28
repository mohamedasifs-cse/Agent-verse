import { useEffect, useRef } from 'react';
import { useJourneyContext } from '../context/JourneyContext';
import { useLocation } from './useLocation';
import { calculateDistanceKm } from '../services/routeService';

export function useJourney() {
  const { location } = useLocation();
  const {
    activeTrip,
    bookedSlot,
    journeyStatus,
    arrivalRadiusMeters,
    markArrivedAtStation,
  } = useJourneyContext();

  const notificationSentRef = useRef(false);

  useEffect(() => {
    // If we have a booked station and active journey, check distance
    if (bookedSlot && bookedSlot.lat && bookedSlot.lon && location?.coords) {
      const currentLat = location.coords.latitude;
      const currentLon = location.coords.longitude;

      const distanceKm = calculateDistanceKm(
        currentLat,
        currentLon,
        bookedSlot.lat,
        bookedSlot.lon
      );

      const distanceMeters = distanceKm * 1000;

      // Check if driver has reached the configured radius
      if (distanceMeters <= arrivalRadiusMeters && !bookedSlot.isArrived) {
        markArrivedAtStation();

        if (!notificationSentRef.current) {
          notificationSentRef.current = true;
          triggerArrivalNotification(bookedSlot.stationName);
        }
      }
    }
  }, [location, bookedSlot, arrivalRadiusMeters]);

  async function triggerArrivalNotification(stationName) {
    try {
      const Notifications = require('expo-notifications');
      if (Notifications && Notifications.requestPermissionsAsync) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '⚡ Charging Station Reached!',
              body: `Your reserved slot at ${stationName || 'the charging station'} is ready. Tap to start Boost Up charging.`,
              data: { screen: 'charging/boost' },
            },
            trigger: null,
          });
        }
      }
    } catch (err) {
      console.warn('[useJourney] Local notification fallback:', err.message);
    }
  }

  return {
    location,
    activeTrip,
    bookedSlot,
    journeyStatus,
  };
}
