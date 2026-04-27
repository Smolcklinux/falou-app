import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';

export default function EventosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Eventos</Text>
      <Text style={styles.message}>Em breve</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  message: { color: colors.textSecondary, marginTop: 10 },
});