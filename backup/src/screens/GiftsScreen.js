import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Alert
} from 'react-native';
import { auth } from '../../config/firebase';
import { getUserProfile, updateUserStats, updateUserProfile } from '../services/firestore';
import { colors } from '../utils/colors';

const giftsList = [
  { id: '1', name: '🌹 Rosa', price: 10, charismaGain: 5, wealthCost: 10, icon: '🌹' },
  { id: '2', name: '🎂 Bolo', price: 50, charismaGain: 20, wealthCost: 50, icon: '🎂' },
  { id: '3', name: '💎 Diamante', price: 500, charismaGain: 100, wealthCost: 500, icon: '💎' },
  { id: '4', name: '🐱 Gato', price: 100, charismaGain: 30, wealthCost: 100, icon: '🐱' },
  { id: '5', name: '🚀 Foguete', price: 1000, charismaGain: 200, wealthCost: 1000, icon: '🚀' },
];

export default function GiftsScreen({ route }) {
  const [userProfile, setUserProfile] = useState(null);
  const [selectedUser, setSelectedUser] = useState(route?.params?.user || null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const result = await getUserProfile(auth.currentUser.uid);
    if (result.success) setUserProfile(result.data);
  };

  const sendGift = async (gift) => {
    if (!selectedUser) {
      Alert.alert('Erro', 'Selecione um usuário para enviar presente');
      return;
    }

    if (userProfile.wealth < gift.wealthCost) {
      Alert.alert('Saldo insuficiente', `Você precisa de ${gift.wealthCost} moedas`);
      return;
    }

    // Atualizar quem envia (perde riqueza)
    await updateUserStats(auth.currentUser.uid, {
      wealth: userProfile.wealth - gift.wealthCost
    });

    // Atualizar quem recebe (ganha carisma)
    await updateUserStats(selectedUser.uid, {
      charisma: (selectedUser.charisma || 0) + gift.charismaGain
    });

    // Registrar presente no histórico
    const giftHistory = userProfile.giftHistory || [];
    giftHistory.push({
      to: selectedUser.uid,
      gift: gift.name,
      date: new Date().toISOString()
    });
    await updateUserProfile(auth.currentUser.uid, { giftHistory });

    Alert.alert('Sucesso', `Você enviou ${gift.name} para ${selectedUser.nick}!`);
    loadProfile();
  };

  const renderGift = ({ item }) => (
    <TouchableOpacity style={styles.giftCard} onPress={() => sendGift(item)}>
      <Text style={styles.giftIcon}>{item.icon}</Text>
      <Text style={styles.giftName}>{item.name}</Text>
      <Text style={styles.giftPrice}>💰 {item.price}</Text>
      <Text style={styles.giftGain}>+{item.charismaGain} 💖</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loja de Presentes</Text>
      <Text style={styles.subtitle}>Envie presentes para seus amigos</Text>

      {selectedUser && (
        <View style={styles.selectedUser}>
          <Text style={styles.selectedUserText}>Enviando para: {selectedUser.nick}</Text>
          <TouchableOpacity onPress={() => setSelectedUser(null)}>
            <Text style={styles.clearUser}>✖️ Trocar</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={giftsList}
        keyExtractor={(item) => item.id}
        renderItem={renderGift}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />

      <View style={styles.balanceContainer}>
        <Text style={styles.balanceText}>💰 Seu saldo: {userProfile?.wealth || 0}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  giftCard: {
    backgroundColor: colors.card,
    borderRadius: 15,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  giftIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  giftName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  giftPrice: {
    color: colors.warning,
    fontSize: 14,
    marginTop: 5,
  },
  giftGain: {
    color: colors.success,
    fontSize: 12,
    marginTop: 5,
  },
  selectedUser: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  selectedUserText: {
    color: colors.text,
  },
  clearUser: {
    color: colors.primary,
  },
  balanceContainer: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  balanceText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
