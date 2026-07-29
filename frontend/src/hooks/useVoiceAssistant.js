import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useVoiceAssistant Hook
 * Provides Web Speech API Text-to-Speech for:
 * 1. Turn-by-turn driving directions (Turn Left, Turn Right, Continue Straight, Arrived)
 * 2. Battery condition & thermal hazard voice warnings
 */
export function useVoiceAssistant(telemetry, routePoints = [], currentRouteIndex = 0, isDriving = false) {
  const [isVoiceOn, setIsVoiceOn] = useState(true);
  const [lastSpokenMessage, setLastSpokenMessage] = useState('');
  const lastSocWarningRef = useRef(null);
  const lastTurnIndexRef = useRef(-1);

  // Helper function to speak text
  const speak = useCallback((text) => {
    if (!isVoiceOn || !('speechSynthesis' in window)) return;

    // Cancel ongoing speech to avoid queue cluttering
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0; // Normal rate
    utterance.pitch = 1.0; // Clear voice tone
    utterance.volume = 1.0; // Full volume

    // Try selecting an English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    setLastSpokenMessage(text);
    window.speechSynthesis.speak(utterance);
  }, [isVoiceOn]);

  // 1. Monitor Turn-by-Turn Directions when driving
  useEffect(() => {
    if (!isVoiceOn || !isDriving || routePoints.length < 2) return;

    const total = routePoints.length;
    const step = currentRouteIndex;

    // Trigger turn directions at specific percentages of the route
    if (step !== lastTurnIndexRef.current) {
      lastTurnIndexRef.current = step;

      const pct = Math.round((step / (total - 1)) * 100);

      if (pct === 5) {
        speak('Trip started. Continue straight on the recommended highway corridor.');
      } else if (pct === 25) {
        speak('In 200 meters, turn right onto the fast charging corridor.');
      } else if (pct === 50) {
        speak('In 300 meters, keep left to stay on the express bypass.');
      } else if (pct === 75) {
        speak('In 500 meters, turn right towards your destination approach.');
      } else if (pct === 98) {
        speak('Destination ahead on your left. Arriving in 100 meters.');
      } else if (pct === 100) {
        speak('Destination arrived! Park vehicle safely.');
      }
    }
  }, [currentRouteIndex, isDriving, routePoints, isVoiceOn, speak]);

  // 2. Monitor Battery & Thermal Warning Alerts
  useEffect(() => {
    if (!isVoiceOn || !telemetry) return;

    const soc = telemetry.soc ?? 80;
    const tempC = telemetry.temperatureC ?? 26;

    // Battery Critical Warning (< 15%)
    if (soc <= 15 && lastSocWarningRef.current !== 'critical') {
      lastSocWarningRef.current = 'critical';
      speak('Critical Warning! Battery level is at ' + Math.round(soc) + ' percent. Please navigate to the nearest charging station immediately.');
    } 
    // Battery Low Warning (15% - 25%)
    else if (soc > 15 && soc <= 25 && lastSocWarningRef.current !== 'low') {
      lastSocWarningRef.current = 'low';
      speak('Warning: Low battery level at ' + Math.round(soc) + ' percent. Fast charging stop recommended.');
    }
    // High Thermal Warning (> 42°C)
    else if (tempC > 42 && lastSocWarningRef.current !== 'thermal') {
      lastSocWarningRef.current = 'thermal';
      speak('High battery temperature warning. Thermal cooling loop activated.');
    }
    // Normal status reset
    else if (soc > 30 && tempC <= 38) {
      lastSocWarningRef.current = 'normal';
    }
  }, [telemetry, isVoiceOn, speak]);

  // Toggle voice assistant on/off
  const toggleVoice = () => {
    const nextState = !isVoiceOn;
    setIsVoiceOn(nextState);
    if (nextState) {
      speak('Voice Assistant activated. Turn-by-turn navigation and battery condition monitoring on.');
    } else {
      window.speechSynthesis.cancel();
    }
  };

  return {
    isVoiceOn,
    toggleVoice,
    speak,
    lastSpokenMessage,
  };
}
