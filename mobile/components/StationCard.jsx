import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function StationCard({ station, onBookPress, isRecommended = false }) {
  const isAvailable = (station.available || 0) > 0;

  return (
    <View style={[styles.card, isRecommended ? styles.recommendedCard : null]}>
      {isRecommended && (
        <View style={styles.recBanner}>
          <Text style={styles.recBannerText}>⚡ BEST CHARGER RECOMMENDATION</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.infoLeft}>
          <Text style={styles.name}>{station.name}</Text>
          <Text style={styles.distance}>📍 {station.distanceKm || 2.5} km away</Text>
        </View>

        <View style={styles.powerBadge}>
          <Text style={styles.powerText}>{station.powerKw || 150} kW</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailBox}>
          <Text style={styles.label}>Availability</Text>
          <Text style={[styles.val, isAvailable ? styles.valGreen : styles.valRed]}>
            {station.available || 4} / {station.total || 6} Free
          </Text>
        </View>

        <View style={styles.detailBox}>
          <Text style={styles.label}>Connectors</Text>
          <Text style={styles.val}>
            {Array.isArray(station.connectors)
              ? station.connectors.join(', ')
              : station.connectors || 'CCS2, Type 2'}
          </Text>
        </View>

        <View style={styles.detailBox}>
          <Text style={styles.label}>Price</Text>
          <Text style={styles.valYellow}>{station.pricePerKwh || '$0.35/kWh'}</Text>
        </View>
      </View>

      {station.reasoning && (
        <View style={styles.reasonBox}>
          <Text style={styles.reasonText}>💡 {station.reasoning}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.bookBtn, !isAvailable ? styles.disabledBtn : null]}
        disabled={!isAvailable}
        onPress={() => onBookPress && onBookPress(station)}
      >
        <Text style={styles.bookBtnText}>
          {isAvailable ? 'SELECT & BOOK SLOT ➔' : 'SLOTS FULL'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  recommendedCard: {
    borderColor: '#DFFF00',
    borderWidth: 1.5,
    shadowColor: '#DFFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  recBanner: {
    backgroundColor: 'rgba(223, 255, 0, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  recBannerText: {
    color: '#DFFF00',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLeft: {
    flex: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  distance: {
    color: '#A1A1AA',
    fontSize: 12,
    marginTop: 2,
  },
  powerBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: '#00F0FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  powerText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '900',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  detailBox: {
    flex: 1,
  },
  label: {
    color: '#71717A',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  val: {
    color: '#E4E4E7',
    fontSize: 11,
    fontWeight: '700',
  },
  valGreen: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '800',
  },
  valRed: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  valYellow: {
    color: '#DFFF00',
    fontSize: 11,
    fontWeight: '800',
  },
  reasonBox: {
    backgroundColor: 'rgba(223, 255, 0, 0.06)',
    borderLeftWidth: 3,
    borderLeftColor: '#DFFF00',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  reasonText: {
    color: '#F4F4F5',
    fontSize: 11,
    lineHeight: 16,
  },
  bookBtn: {
    backgroundColor: '#DFFF00',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#27272A',
  },
  bookBtnText: {
    color: '#080805',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
