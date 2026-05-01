/**
 * ============================================
 * FALOU - TELA DESCOBRIR
 * ============================================
 * ✅ CORREÇÕES REALIZADAS (BUG #2):
 * 1. Removido import de funções inexistentes (getDiscoverRooms, getRoomsByCountry)
 * 2. Usando getActiveRooms (função existente no firestore)
 * 3. Adicionado Alert para funcionalidades em desenvolvimento
 * 4. Adicionado filtro por país (simulado)
 * 5. Melhorada navegação para salas de voz
 * ============================================
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, RefreshControl, ActivityIndicator, FlatList, Alert  // ✅ ADD: Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getActiveRooms, getRecentRooms } from '../services/firestore/index'; // ✅ FIX: usar funções existentes
import { colors } from '../utils/colors';

// Lista de países disponíveis
const COUNTRIES = [
  'Todos', 'Angola', 'Argentina', 'Bolivia', 'Brasil', 'Chile',
  'Colombia', 'Costa Rica', 'República Dominicana', 'Ecuador', 'Portugal'
];

export default function DescobrirScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('Todos');
  const [activeTab, setActiveTab] = useState('todos');

  useEffect(() => {
    loadRooms();
  }, [selectedCountry]);

  /**
   * ✅ Carrega as salas ativas do Firestore
   */
  const loadRooms = async () => {
    setLoading(true);
    // ✅ Usar função existente getActiveRooms
    const result = await getActiveRooms();
    if (result.success) {
      let filteredRooms = result.data;
      
      // ✅ Filtrar por país se necessário (implementar depois com dados reais)
      if (selectedCountry !== 'Todos') {
        // Por enquanto, simular filtro (quando os países forem adicionados nas salas)
        filteredRooms = result.data.filter(room => room.country === selectedCountry);
      }
      setRooms(filteredRooms);
    } else {
      console.error('Erro ao carregar salas:', result.error);
      Alert.alert('Erro', 'Não foi possível carregar as salas');
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRooms();
  };

  /**
   * ✅ Entrar na sala de voz
   */
  const enterRoom = (room) => {
    navigation.navigate('VoiceRoom', { 
      roomId: room.id, 
      roomData: room 
    });
  };

  /**
   * ✅ Selecionar país do filtro
   */
  const selectCountry = (country) => {
    setSelectedCountry(country);
  };

  /**
   * ✅ Renderizar chip de país
   */
  const renderCountryChip = ({ item }) => (
    <TouchableOpacity 
      style={[styles.countryChip, selectedCountry === item && styles.countryChipActive]}
      onPress={() => selectCountry(item)}
    >
      <Text style={[styles.countryChipText, selectedCountry === item && styles.countryChipTextActive]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  /**
   * ✅ Renderizar card da sala
   */
  const renderRoomCard = ({ item }) => (
    <View style={styles.roomCard}>
      <View style={styles.roomHeader}>
        <View style={styles.roomAvatar}>
          {item.ownerAvatar ? (
            <Image source={{ uri: item.ownerAvatar }} style={styles.avatarImage} />
          ) : (
            <Icon name="account" size={30} color={colors.primary} />
          )}
        </View>
        <View style={styles.roomTitleInfo}>
          <Text style={styles.roomName}>{item.name}</Text>
          <Text style={styles.roomOwner}>{item.ownerNick}</Text>
        </View>
        <View style={styles.roomLevel}>
          <Icon name="star" size={14} color={colors.warning} />
          <Text style={styles.levelText}>NÍVEL {item.level || 1}</Text>
        </View>
      </View>

      {/* Informações do evento (se houver) */}
      {item.eventDate && (
        <View style={styles.eventInfo}>
          <Icon name="calendar" size={14} color={colors.primary} />
          <Text style={styles.eventText}>{item.eventDate}</Text>
        </View>
      )}

      {/* Prêmios (se houver) */}
      {item.prizes && (
        <View style={styles.prizesContainer}>
          <Text style={styles.prizesTitle}>🏆 PRÊMIOS A ENTREGAR</Text>
          <Text style={styles.prizesText}>{item.prizes}</Text>
        </View>
      )}

      {/* Botão Bate-papo */}
      <TouchableOpacity style={styles.chatButton} onPress={() => enterRoom(item)}>
        <Icon name="chat" size={18} color={colors.text} />
        <Text style={styles.chatButtonText}>Bate-papo</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Descobrir</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Seção Rank / Celebridade */}
        <View style={styles.rankSection}>
          <Text style={styles.sectionTitle}>Rank</Text>
          <TouchableOpacity 
            style={styles.celebrityCard} 
            onPress={() => Alert.alert('Rank', 'Funcionalidade em desenvolvimento!')}
          >
            <Icon name="crown" size={24} color={colors.warning} />
            <Text style={styles.celebrityText}>Celebridade</Text>
            <Icon name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Seção Recomendadas por país */}
        <View style={styles.countrySection}>
          <Text style={styles.sectionTitle}>Recomendadas por país</Text>
          <FlatList
            data={COUNTRIES}
            keyExtractor={(item) => item}
            renderItem={renderCountryChip}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.countriesList}
          />
        </View>

        {/* Submenu Todos/Favoritos */}
        <View style={styles.subMenu}>
          <TouchableOpacity 
            style={[styles.subMenuItem, activeTab === 'todos' && styles.activeSubMenuItem]}
            onPress={() => setActiveTab('todos')}
          >
            <Text style={[styles.subMenuText, activeTab === 'todos' && styles.activeSubMenuText]}>
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.subMenuItem, activeTab === 'favoritos' && styles.activeSubMenuItem]}
            onPress={() => {
              setActiveTab('favoritos');
              Alert.alert('Favoritos', 'Funcionalidade em desenvolvimento!');
            }}
          >
            <Text style={[styles.subMenuText, activeTab === 'favoritos' && styles.activeSubMenuText]}>
              Favoritos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Salas */}
        <View style={styles.roomsList}>
          {rooms.length > 0 ? (
            rooms.map((room) => (
              <View key={room.id}>
                {renderRoomCard({ item: room })}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="microphone-variant-off" size={50} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Nenhuma sala encontrada</Text>
              <Text style={styles.emptySubtext}>
                {selectedCountry !== 'Todos' 
                  ? `Não há salas no país ${selectedCountry} no momento` 
                  : 'Crie uma sala para começar!'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  rankSection: { paddingHorizontal: 20, marginVertical: 10 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  celebrityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 15, gap: 12 },
  celebrityText: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '500' },
  countrySection: { paddingHorizontal: 20, marginVertical: 10 },
  countriesList: { gap: 8, paddingRight: 20 },
  countryChip: { backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  countryChipActive: { backgroundColor: colors.primary },
  countryChipText: { color: colors.textSecondary, fontSize: 14 },
  countryChipTextActive: { color: colors.text },
  subMenu: { flexDirection: 'row', backgroundColor: colors.card, marginHorizontal: 20, marginVertical: 10, borderRadius: 30, padding: 4 },
  subMenuItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 25 },
  activeSubMenuItem: { backgroundColor: colors.primary },
  subMenuText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  activeSubMenuText: { color: colors.text },
  roomsList: { paddingHorizontal: 16, paddingBottom: 30 },
  roomCard: { backgroundColor: colors.card, borderRadius: 16, padding: 15, marginBottom: 15 },
  roomHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roomAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 50, height: 50, borderRadius: 25 },
  roomTitleInfo: { flex: 1 },
  roomName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  roomOwner: { color: colors.primary, fontSize: 12, marginTop: 2 },
  roomLevel: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
  levelText: { color: colors.textSecondary, fontSize: 11 },
  eventInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  eventText: { color: colors.primary, fontSize: 12 },
  prizesContainer: { marginTop: 10, padding: 10, backgroundColor: colors.background, borderRadius: 10 },
  prizesTitle: { color: colors.warning, fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  prizesText: { color: colors.textSecondary, fontSize: 11 },
  chatButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginTop: 12, paddingVertical: 10, borderRadius: 25, gap: 8 },
  chatButtonText: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 12 },
  emptyText: { color: colors.textSecondary, fontSize: 16, textAlign: 'center' },
  emptySubtext: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
});