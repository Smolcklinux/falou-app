/**
 * ============================================
 * FALOU - TELA PRINCIPAL (SALA)
 * ============================================
 * ✅ CORREÇÕES REALIZADAS:
 * 1. Corrigido botão de busca (lupa) que não abria
 * 2. Design moderno com gradientes
 * 3. Menu superior com ícones
 * 4. Busca funcionando com modal
 * ============================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, RefreshControl, ActivityIndicator, FlatList,
  TextInput, Modal, Dimensions, Animated,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getPopularRooms, getNewRooms, searchUsers, searchRooms } from '../services/firestore/index';
import { colors } from '../utils/colors';

const { width, height } = Dimensions.get('window');

export default function PopularScreen({ navigation }) {
  const [popularRooms, setPopularRooms] = useState([]);
  const [newRooms, setNewRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Menu superior ativo
  const [activeTopTab, setActiveTopTab] = useState('popular');
  const [activeRoomTab, setActiveRoomTab] = useState('popular');
  
  // ✅ Estados da busca
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState({ rooms: [], users: [] });
  const [searching, setSearching] = useState(false);
  
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const searchScaleAnim = useRef(new Animated.Value(0)).current;

  // Banners
  const [banners, setBanners] = useState([
    { id: 1, title: '🌟 Recompensa Semanal', subtitle: 'Aventura en vela 2026', color: ['#6c63ff', '#4ecdc4'], icon: 'sail-boat' },
    { id: 2, title: '🎁 Monthly Recharge', subtitle: 'Ganhe bônus especiais', color: ['#f093fb', '#f5576c'], icon: 'gift' },
    { id: 3, title: '🎉 6th Anniversary', subtitle: 'Beach Club Event', color: ['#4facfe', '#00f2fe'], icon: 'party-popper' },
    { id: 4, title: '💎 Wishing Fountain', subtitle: 'Medal Collect', color: ['#43e97b', '#38f9d7'], icon: 'fountain-pen' },
  ]);

  useEffect(() => {
    loadData();
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

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadPopularRooms(), loadNewRooms()]);
    setLoading(false);
    setRefreshing(false);
  };

  const loadPopularRooms = async () => {
    const result = await getPopularRooms(30);
    if (result.success) setPopularRooms(result.data);
  };

  const loadNewRooms = async () => {
    const result = await getNewRooms();
    if (result.success) setNewRooms(result.data);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ✅ Função de busca corrigida
  const handleSearch = async () => {
    if (!searchText.trim()) {
      Alert.alert('🔍 Atenção', 'Digite um nome para buscar');
      return;
    }
    
    setSearching(true);
    const term = searchText.trim();
    
    try {
      const roomsResult = await searchRooms(term);
      const usersResult = await searchUsers(term);
      
      setSearchResults({ 
        rooms: roomsResult.success ? roomsResult.data : [],
        users: usersResult.success ? usersResult.data : []
      });
    } catch (error) {
      console.error('Erro na busca:', error);
      Alert.alert('Erro', 'Falha ao buscar. Tente novamente.');
    }
    
    setSearching(false);
    
    // Animação dos resultados
    Animated.spring(searchScaleAnim, {
      toValue: 1,
      friction: 7,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  // ✅ Abrir modal de busca
  const openSearchModal = () => {
    setSearchModalVisible(true);
    setSearchText('');
    setSearchResults({ rooms: [], users: [] });
    searchScaleAnim.setValue(0);
  };

  // ✅ Fechar modal de busca
  const closeSearchModal = () => {
    setSearchModalVisible(false);
    setSearchText('');
    setSearchResults({ rooms: [], users: [] });
  };

  const enterRoom = (room) => {
    navigation.navigate('VoiceRoom', { 
      roomId: room.id, 
      roomData: room 
    });
  };

  const goToUserProfile = (user) => {
    closeSearchModal();
    navigation.navigate('UserProfile', { 
      userId: user.uid, 
      userNick: user.nick,
      userAvatar: user.avatarUrl 
    });
  };

  const handleTopMenuPress = (tab) => {
    setActiveTopTab(tab);
    if (tab === 'meu') {
      navigation.navigate('Meu');
    } else if (tab === 'descobrir') {
      navigation.navigate('Descobrir');
    } else if (tab === 'eventos') {
      navigation.navigate('Eventos');
    }
  };

  // Banner com gradiente
  const renderBanner = ({ item, index }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => Alert.alert(item.title, item.subtitle)}
    >
      <LinearGradient
        colors={item.color}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bannerCard}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerIconContainer}>
            <Icon name={item.icon} size={32} color="#fff" />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>{item.title}</Text>
            <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
          </View>
        </View>
        <View style={styles.bannerBadge}>
          <Text style={styles.bannerBadgeText}>NEW</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Card de sala
  const renderRoomCard = ({ item, index }) => {
    const onlineCount = item.members?.length || 0;
    const isTopThree = index < 3;
    
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity 
          style={[styles.roomCard, isTopThree && styles.topRoomCard]}
          onPress={() => enterRoom(item)}
          activeOpacity={0.8}
        >
          <View style={[styles.rankBadge, isTopThree && styles.topRankBadge]}>
            {index === 0 && <Icon name="crown" size={20} color="#FFD700" />}
            {index === 1 && <Icon name="medal" size={20} color="#C0C0C0" />}
            {index === 2 && <Icon name="medal" size={20} color="#CD7F32" />}
            {index > 2 && <Text style={styles.rankNumber}>{index + 1}</Text>}
          </View>

          <View style={styles.roomAvatarContainer}>
            {item.coverImage ? (
              <Image source={{ uri: item.coverImage }} style={styles.roomAvatar} />
            ) : item.ownerAvatar ? (
              <Image source={{ uri: item.ownerAvatar }} style={styles.roomAvatar} />
            ) : (
              <LinearGradient
                colors={['#6c63ff', '#4ecdc4']}
                style={styles.roomAvatarGradient}
              >
                <Icon name="microphone-variant" size={28} color="#fff" />
              </LinearGradient>
            )}
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{onlineCount}</Text>
            </View>
          </View>

          <View style={styles.roomInfo}>
            <Text style={styles.roomName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.roomOwnerContainer}>
              <Icon name="account" size={12} color={colors.textSecondary} />
              <Text style={styles.roomOwner}>{item.ownerNick}</Text>
            </View>
            <View style={styles.roomTags}>
              <View style={styles.tag}>
                <Icon name="fire" size={10} color="#FFD700" />
                <Text style={styles.tagText}>{item.popularity || 0}</Text>
              </View>
              <View style={styles.tag}>
                <Icon name="chat" size={10} color={colors.primary} />
                <Text style={styles.tagText}>Ao vivo</Text>
              </View>
            </View>
          </View>

          <Icon name="chevron-right" size={24} color={colors.primary} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderNewRoomCard = ({ item }) => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity style={styles.roomCard} onPress={() => enterRoom(item)} activeOpacity={0.8}>
        <View style={styles.newBadgeContainer}>
          <LinearGradient colors={['#4ecdc4', '#44a08d']} style={styles.newBadgeGradient}>
            <Text style={styles.newBadgeText}>NOVO</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.roomAvatarContainer}>
          {item.coverImage ? (
            <Image source={{ uri: item.coverImage }} style={styles.roomAvatar} />
          ) : item.ownerAvatar ? (
            <Image source={{ uri: item.ownerAvatar }} style={styles.roomAvatar} />
          ) : (
            <LinearGradient colors={['#43e97b', '#38f9d7']} style={styles.roomAvatarGradient}>
              <Icon name="microphone-variant" size={28} color="#fff" />
            </LinearGradient>
          )}
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{item.members?.length || 0}</Text>
          </View>
        </View>

        <View style={styles.roomInfo}>
          <Text style={styles.roomName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.roomOwnerContainer}>
            <Icon name="account" size={12} color={colors.textSecondary} />
            <Text style={styles.roomOwner}>{item.ownerNick}</Text>
          </View>
        </View>

        <Icon name="chevron-right" size={24} color={colors.primary} />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSearchResult = ({ item, type }) => (
    <TouchableOpacity 
      style={styles.searchResultCard} 
      onPress={() => type === 'room' ? enterRoom(item) : goToUserProfile(item)}
      activeOpacity={0.7}
    >
      <View style={styles.searchResultAvatar}>
        {type === 'room' ? (
          <LinearGradient colors={['#6c63ff', '#4ecdc4']} style={styles.searchResultGradient}>
            <Icon name="microphone-variant" size={24} color="#fff" />
          </LinearGradient>
        ) : item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.searchAvatarImage} />
        ) : (
          <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.searchResultGradient}>
            <Icon name="account" size={24} color="#fff" />
          </LinearGradient>
        )}
      </View>
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>
          {type === 'room' ? item.name : item.nick}
        </Text>
        <Text style={styles.searchResultSub}>
          {type === 'room' 
            ? `${item.members?.length || 0} online • ${item.id?.slice(-6)}` 
            : `ID: ${item.numericId} • Nível ${item.level}`}
        </Text>
      </View>
      <Icon name="arrow-right-circle" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando salas...</Text>
      </View>
    );
  }

  const currentRooms = activeRoomTab === 'popular' ? popularRooms : newRooms;
  const isEmpty = currentRooms.length === 0;

  return (
    <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
      {/* Header com gradiente */}
      <LinearGradient
        colors={[colors.card, 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>FALOU</Text>
            <Text style={styles.headerSubtitle}>Salas de voz ao vivo</Text>
          </View>
          {/* ✅ Botão de busca corrigido */}
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={openSearchModal}
            activeOpacity={0.7}
          >
            <Icon name="magnify" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Menu Superior */}
        <View style={styles.topMenu}>
          {[
            { id: 'meu', label: 'Meu', icon: 'account' },
            { id: 'popular', label: 'Popular', icon: 'fire' },
            { id: 'descobrir', label: 'Descobrir', icon: 'compass' },
            { id: 'eventos', label: 'Eventos', icon: 'calendar-star' },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.topMenuItem, activeTopTab === item.id && styles.activeTopMenuItem]}
              onPress={() => handleTopMenuPress(item.id)}
            >
              <Icon 
                name={item.icon} 
                size={18} 
                color={activeTopTab === item.id ? colors.primary : colors.textSecondary} 
              />
              <Text style={[styles.topMenuText, activeTopTab === item.id && styles.activeTopMenuText]}>
                {item.label}
              </Text>
              {activeTopTab === item.id && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Carrossel de Banners */}
        <View style={styles.bannerSection}>
          <FlatList
            data={banners}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderBanner}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToAlignment="center"
            snapToInterval={width - 80}
            decelerationRate="fast"
            contentContainerStyle={styles.bannerList}
          />
        </View>

        {/* Submenu de filtro */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>
            {activeRoomTab === 'popular' ? '🔥 Mais populares' : '✨ Novidades'}
          </Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterChip, activeRoomTab === 'popular' && styles.activeFilterChip]}
              onPress={() => setActiveRoomTab('popular')}
            >
              <Icon name="fire" size={14} color={activeRoomTab === 'popular' ? colors.text : colors.textSecondary} />
              <Text style={[styles.filterChipText, activeRoomTab === 'popular' && styles.activeFilterChipText]}>
                Popular
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeRoomTab === 'novo' && styles.activeFilterChip]}
              onPress={() => setActiveRoomTab('novo')}
            >
              <Icon name="new-box" size={14} color={activeRoomTab === 'novo' ? colors.text : colors.textSecondary} />
              <Text style={[styles.filterChipText, activeRoomTab === 'novo' && styles.activeFilterChipText]}>
                Novo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de Salas */}
        {!isEmpty ? (
          <View style={styles.roomsList}>
            {activeRoomTab === 'popular' 
              ? popularRooms.map((room, idx) => (
                  <View key={room.id}>
                    {renderRoomCard({ item: room, index: idx })}
                  </View>
                ))
              : newRooms.map((room) => (
                  <View key={room.id}>
                    {renderNewRoomCard({ item: room })}
                  </View>
                ))
            }
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={[colors.card, 'transparent']}
              style={styles.emptyCard}
            >
              <Icon name={activeRoomTab === 'popular' ? "fire-off" : "new-box"} size={60} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>
                {activeRoomTab === 'popular' ? 'Nenhuma sala popular' : 'Nenhuma sala nova'}
              </Text>
              <Text style={styles.emptyText}>
                {activeRoomTab === 'popular' 
                  ? 'As salas mais populares aparecerão aqui' 
                  : 'Novas salas criadas aparecerão aqui'}
              </Text>
            </LinearGradient>
          </View>
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* ✅ Modal de Busca CORRIGIDO */}
      <Modal 
        visible={searchModalVisible} 
        animationType="fade" 
        transparent={true}
        onRequestClose={closeSearchModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={closeSearchModal}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContentWrapper}>
            <LinearGradient colors={[colors.card, colors.background]} style={styles.modalGradient}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🔍 Buscar</Text>
                <TouchableOpacity 
                  style={styles.modalCloseBtn}
                  onPress={closeSearchModal}
                >
                  <Icon name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchInputWrapper}>
                <Icon name="magnify" size={20} color={colors.primary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar salas ou usuários..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchText}
                  onChangeText={setSearchText}
                  onSubmitEditing={handleSearch}
                  autoFocus
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchText('')}>
                    <Icon name="close-circle" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {searching ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.searchLoader} />
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {searchResults.rooms.length > 0 && (
                    <View style={styles.searchSection}>
                      <View style={styles.searchSectionHeader}>
                        <Icon name="microphone-variant" size={18} color={colors.primary} />
                        <Text style={styles.searchSectionTitle}>Salas encontradas</Text>
                        <Text style={styles.searchSectionCount}>{searchResults.rooms.length}</Text>
                      </View>
                      {searchResults.rooms.map((room) => (
                        <View key={room.id}>
                          {renderSearchResult({ item: room, type: 'room' })}
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {searchResults.users.length > 0 && (
                    <View style={styles.searchSection}>
                      <View style={styles.searchSectionHeader}>
                        <Icon name="account-group" size={18} color={colors.primary} />
                        <Text style={styles.searchSectionTitle}>Usuários encontrados</Text>
                        <Text style={styles.searchSectionCount}>{searchResults.users.length}</Text>
                      </View>
                      {searchResults.users.map((user) => (
                        <View key={user.uid}>
                          {renderSearchResult({ item: user, type: 'user' })}
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {searchText.length > 0 && !searching && 
                   searchResults.rooms.length === 0 && searchResults.users.length === 0 && (
                    <View style={styles.noResultsContainer}>
                      <Icon name="emoticon-sad-outline" size={60} color={colors.textSecondary} />
                      <Text style={styles.noResultsTitle}>Nada encontrado</Text>
                      <Text style={styles.noResultsText}>
                        Não encontramos nada para "{searchText}"
                      </Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, marginTop: 16, fontSize: 14 },
  
  // Header
  headerGradient: { paddingTop: 40, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: colors.text, letterSpacing: 1 },
  headerSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  searchButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(108, 99, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
  
  // Menu Superior
  topMenu: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, gap: 8 },
  topMenuItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 25, position: 'relative' },
  activeTopMenuItem: { backgroundColor: 'rgba(108, 99, 255, 0.15)' },
  topMenuText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  activeTopMenuText: { color: colors.primary },
  activeIndicator: { position: 'absolute', bottom: -2, width: 20, height: 3, backgroundColor: colors.primary, borderRadius: 2 },
  
  // Banners
  bannerSection: { marginVertical: 16 },
  bannerList: { paddingHorizontal: 20, gap: 16 },
  bannerCard: { width: width - 80, borderRadius: 20, padding: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  bannerContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bannerIconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  bannerTextContainer: { flex: 1 },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
  bannerBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FF6B6B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  bannerBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  // Filtros
  filterContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginVertical: 16 },
  filterTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  filterButtons: { flexDirection: 'row', gap: 12 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.card, borderRadius: 20 },
  activeFilterChip: { backgroundColor: colors.primary },
  filterChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  activeFilterChipText: { color: colors.text },
  
  // Salas
  roomsList: { paddingHorizontal: 16 },
  roomCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  topRoomCard: { borderLeftWidth: 3, borderLeftColor: '#FFD700' },
  rankBadge: { width: 36, alignItems: 'center', marginRight: 8 },
  topRankBadge: { marginRight: 4 },
  rankNumber: { color: colors.textSecondary, fontSize: 14, fontWeight: 'bold' },
  roomAvatarContainer: { position: 'relative', marginRight: 12 },
  roomAvatar: { width: 56, height: 56, borderRadius: 28 },
  roomAvatarGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  onlineBadge: { position: 'absolute', bottom: -2, right: -2, flexDirection: 'row', alignItems: 'center', backgroundColor: '#4ecdc4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  onlineText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  roomInfo: { flex: 1 },
  roomName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  roomOwnerContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  roomOwner: { color: colors.textSecondary, fontSize: 12 },
  roomTags: { flexDirection: 'row', gap: 8, marginTop: 6 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(108, 99, 255, 0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  tagText: { color: colors.textSecondary, fontSize: 10 },
  newBadgeContainer: { position: 'absolute', top: -8, left: -8, zIndex: 1 },
  newBadgeGradient: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  newBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  // Empty state
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginTop: 40 },
  emptyCard: { alignItems: 'center', padding: 40, borderRadius: 24, width: '100%' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  emptyText: { color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' },
  bottomPadding: { height: 80 },
  
  // Modal de Busca
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContentWrapper: { maxHeight: '85%' },
  modalGradient: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  modalCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  searchInput: { flex: 1, color: colors.text, paddingVertical: 14, fontSize: 16 },
  searchLoader: { marginTop: 40 },
  searchSection: { marginBottom: 20 },
  searchSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  searchSectionTitle: { color: colors.primary, fontSize: 15, fontWeight: 'bold', flex: 1 },
  searchSectionCount: { color: colors.textSecondary, fontSize: 12 },
  searchResultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 12, marginBottom: 8, gap: 12 },
  searchResultAvatar: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  searchResultGradient: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  searchAvatarImage: { width: 48, height: 48, borderRadius: 24 },
  searchResultInfo: { flex: 1 },
  searchResultName: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  searchResultSub: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  noResultsContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  noResultsTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  noResultsText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
});