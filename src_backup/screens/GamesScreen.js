/**
 * ============================================
 * FALOU - TELA DE JOGOS
 * ============================================
 * ✅ VERSÃO MODERNIZADA:
 * 1. Design com gradientes e cards modernos
 * 2. Animações suaves
 * 3. Layout responsivo
 * 4. Categorias de jogos
 * 5. Salas de jogos com status
 * ============================================
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Alert, Animated, Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../utils/colors';

const { width } = Dimensions.get('window');

// Lista de jogos disponíveis
const GAMES_LIST = [
  { id: 1, name: 'LUDO', icon: 'dice-6', color: ['#6c63ff', '#4ecdc4'], players: '2-4', type: 'Tabuleiro' },
  { id: 2, name: 'Monster Crush', icon: 'android-studio', color: ['#ff6b6b', '#f093fb'], players: '1', type: 'Puzzle' },
  { id: 3, name: 'Carrom Pool', icon: 'circle', color: ['#4ecdc4', '#43e97b'], players: '2-4', type: 'Esporte' },
  { id: 4, name: 'Eliminação', icon: 'skull', color: ['#ffe66d', '#f5576c'], players: '2-8', type: 'Ação' },
  { id: 5, name: 'Dominoes', icon: 'domino-mask', color: ['#6c63ff', '#a855f7'], players: '2-4', type: 'Mesa' },
  { id: 6, name: 'DOMINOES', icon: 'domino-mask', color: ['#ff6b6b', '#f093fb'], players: '2-4', type: 'Mesa' },
  { id: 7, name: 'Jackaroo', icon: 'kangaroo', color: ['#4ecdc4', '#38f9d7'], players: '2-6', type: 'Cartas' },
  { id: 8, name: 'Xadrez', icon: 'chess-queen', color: ['#f093fb', '#f5576c'], players: '2', type: 'Estratégia' },
];

const CATEGORIES = ['Todos', 'Tabuleiro', 'Cartas', 'Puzzle', 'Ação', 'Esporte'];

export default function GamesScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [rooms, setRooms] = useState([]);
  
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCreateGame = () => {
    Alert.alert('🎮 Em breve', 'Criação de salas de jogos estará disponível em breve!');
  };

  const handleJoinGame = (game) => {
    Alert.alert('🎯 Entrar na sala', `Você está entrando na sala de ${game.name}`);
  };

  // Filtrar jogos por categoria
  const filteredGames = selectedCategory === 'Todos' 
    ? GAMES_LIST 
    : GAMES_LIST.filter(game => game.type === selectedCategory);

  const renderGameItem = ({ item, index }) => (
    <Animated.View 
      style={{ 
        opacity: fadeAnim, 
        transform: [{ scale: scaleAnim }],
        width: '48%',
        marginBottom: 12
      }}
    >
      <TouchableOpacity 
        style={styles.gameCard}
        onPress={() => handleJoinGame(item)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={item.color}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gameGradient}
        >
          <View style={styles.gameIconContainer}>
            <Icon name={item.icon} size={40} color="#fff" />
          </View>
          <Text style={styles.gameName}>{item.name}</Text>
          <View style={styles.gameBadge}>
            <Icon name="account-group" size={12} color="#fff" />
            <Text style={styles.gameBadgeText}>{item.players} jogadores</Text>
          </View>
          <View style={styles.gameTypeBadge}>
            <Text style={styles.gameTypeText}>{item.type}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderCategoryChip = ({ item }) => (
    <TouchableOpacity 
      style={[styles.categoryChip, selectedCategory === item && styles.activeCategoryChip]}
      onPress={() => setSelectedCategory(item)}
      activeOpacity={0.7}
    >
      {selectedCategory === item && (
        <Icon name="check" size={12} color={colors.text} style={{ marginRight: 4 }} />
      )}
      <Text style={[styles.categoryText, selectedCategory === item && styles.activeCategoryText]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderRoomCard = ({ item }) => (
    <TouchableOpacity style={styles.roomCard} onPress={() => handleJoinGame(item)}>
      <LinearGradient
        colors={[colors.card, colors.background]}
        style={styles.roomGradient}
      >
        <View style={styles.roomHeader}>
          <View style={styles.roomAvatar}>
            <Icon name="gamepad-variant" size={24} color={colors.primary} />
          </View>
          <View style={styles.roomInfo}>
            <Text style={styles.roomName}>{item.name}</Text>
            <View style={styles.roomDetails}>
              <Icon name="account-group" size={12} color={colors.textSecondary} />
              <Text style={styles.roomMembers}>{item.members} jogadores</Text>
              <View style={styles.roomStatusDot} />
              <Text style={styles.roomStatus}>Ao vivo</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color={colors.primary} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
      {/* Header com gradiente */}
      <LinearGradient
        colors={[colors.card, 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🎮 Hot Social Games</Text>
            <Text style={styles.headerSubtitle}>Jogue com amigos em tempo real</Text>
          </View>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateGame}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary, '#4ecdc4']}
              style={styles.createButtonGradient}
            >
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Criar Sala</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Categorias */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>🎯 Categorias</Text>
          <FlatList
            data={CATEGORIES}
            keyExtractor={(item) => item}
            renderItem={renderCategoryChip}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Lista de Jogos */}
        <View style={styles.gamesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Jogos Populares</Text>
            <Text style={styles.sectionCount}>{filteredGames.length} jogos</Text>
          </View>
          
          <FlatList
            data={filteredGames}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderGameItem}
            numColumns={2}
            columnWrapperStyle={styles.gamesRow}
            scrollEnabled={false}
          />
        </View>

        {/* Seção Salas de Jogos */}
        <View style={styles.roomsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎲 Salas de Jogos</Text>
            <TouchableOpacity onPress={handleCreateGame}>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {rooms.length > 0 ? (
            <FlatList
              data={rooms}
              keyExtractor={(item) => item.id}
              renderItem={renderRoomCard}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={[colors.card, 'transparent']}
                style={styles.emptyCard}
              >
                <Icon name="gamepad-variant-outline" size={60} color={colors.textSecondary} />
                <Text style={styles.emptyTitle}>Nenhuma sala ativa</Text>
                <Text style={styles.emptyText}>
                  Seja o primeiro a criar uma sala de jogo!
                </Text>
                <TouchableOpacity style={styles.emptyButton} onPress={handleCreateGame}>
                  <LinearGradient
                    colors={[colors.primary, '#4ecdc4']}
                    style={styles.emptyButtonGradient}
                  >
                    <Icon name="plus" size={18} color="#fff" />
                    <Text style={styles.emptyButtonText}>Criar Sala</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Banner promocional */}
        <LinearGradient
          colors={['#6c63ff', '#4ecdc4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.promoBanner}
        >
          <Icon name="trophy" size={32} color="#fff" />
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Torneio Semanal</Text>
            <Text style={styles.promoSubtitle}>Ganhe prêmios exclusivos!</Text>
          </View>
          <TouchableOpacity style={styles.promoButton}>
            <Text style={styles.promoButtonText}>Participar</Text>
            <Icon name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Header
  headerGradient: { paddingTop: 40, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text, letterSpacing: 1 },
  headerSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  
  // Botão criar
  createButton: { overflow: 'hidden', borderRadius: 25 },
  createButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  createButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  
  // Categorias
  categoriesSection: { paddingHorizontal: 20, marginTop: 16 },
  categoriesList: { gap: 12, paddingVertical: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  activeCategoryChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { color: colors.textSecondary, fontSize: 14 },
  activeCategoryText: { color: colors.text },
  
  // Seção Jogos
  gamesSection: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  sectionCount: { color: colors.textSecondary, fontSize: 12 },
  seeAllText: { color: colors.primary, fontSize: 13 },
  gamesRow: { justifyContent: 'space-between' },
  
  // Card do Jogo
  gameCard: { borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  gameGradient: { padding: 16, alignItems: 'center', gap: 8 },
  gameIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  gameName: { color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  gameBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  gameBadgeText: { color: '#fff', fontSize: 10 },
  gameTypeBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  gameTypeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  
  // Salas de Jogos
  roomsSection: { paddingHorizontal: 16, marginTop: 24 },
  roomCard: { marginBottom: 10, borderRadius: 16, overflow: 'hidden' },
  roomGradient: { padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 16 },
  roomHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roomAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(108, 99, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  roomInfo: { flex: 1 },
  roomName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  roomDetails: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  roomMembers: { color: colors.textSecondary, fontSize: 11 },
  roomStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ecdc4' },
  roomStatus: { color: '#4ecdc4', fontSize: 10, fontWeight: 'bold' },
  
  // Empty state
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  emptyCard: { alignItems: 'center', padding: 40, borderRadius: 24, width: '100%' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  emptyText: { color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' },
  emptyButton: { marginTop: 20, borderRadius: 25, overflow: 'hidden' },
  emptyButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  emptyButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  
  // Banner promocional
  promoBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 24, padding: 16, borderRadius: 20, gap: 16 },
  promoContent: { flex: 1 },
  promoTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  promoSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
  promoButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
  promoButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  
  bottomPadding: { height: 80 },
});