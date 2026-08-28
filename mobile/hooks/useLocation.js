import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function useLocation() {
  const [location, setLocation] = useState({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
      heading: 0,
      speed: 0,
    },
  });
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription = null;

    async function requestAndTrackLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied. Using default EV coordinates.');
          setLoading(false);
          return;
        }

        const currentLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLoc);
        setLoading(false);

        // Start location updates
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLoc) => {
            setLocation(newLoc);
          }
        );
      } catch (err) {
        console.warn('[useLocation] Location request failed, fallback to default:', err.message);
        setErrorMsg('Could not obtain live GPS. Using fallback coordinates.');
        setLoading(false);
      }
    }

    requestAndTrackLocation();

    return () => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
    };
  }, []);

  return { location, errorMsg, loading };
}
