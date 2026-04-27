/**
 * ============================================
 * FALOU - TELA DE MENSAGENS E AMIGOS
 * ============================================
 * ✅ VERSÃO MODERNIZADA COMPLETA:
 * 1. Design com gradientes e cards elegantes
 * 2. Animações suaves na entrada
 * 3. Header com gradiente e subtítulo
 * 4. Cards de chat com status visual
 * 5. Aba Amigos com design aprimorado
 * 6. Busca com indicador de loading e resultados
 * 7. Solicitações de amizade com cards
 * 8. Empty states com gradiente
 * ============================================
 * Funcionalidades:
 * - Aba Mensagem: lista de chats recentes
 * - Aba Amigos: lista de amigos (quem você segue e te segue de volta)
 * - Buscar usuários por nome ou ID
 * - Solicitações de amizade
 * - Ver perfil do amigo
 * - Iniciar chat com amigo
 * ============================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, TextInput, Alert, RefreshControl, ActivityIndicator,
  Animated, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../../config/firebase';
import { 
  getUserProfile, getChats, searchUsers, 
  getFriendRequests, acceptFriendRequest,
  getFriends, checkIsFollowing, followUser, unfollowUser
} from '../services/firestore/index';
import { colors } from '../utils/colors';

export default function FriendsScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('mensagem');
  const [chats, setChats] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followingStatus, setFollowingStatus] = useState({});
  
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadData();
    animateEntrance();
  }, [activeTab]);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  const loadData = async () => {
    setLoading(true);
    const profile = await getUserProfile(auth.currentUser.uid);
    if (profile.success) setUserProfile(profile.data);
    
    if (activeTab === 'mensagem') {
      await loadChats();
    } else if (activeTab === 'amigo') {
      await loadFriends();
      await loadFriendRequests();
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  const loadChats = async () => {
    const result = await getChats(auth.currentUser.uid);
    if (result.success) setChats(result.data);
  };

  const loadFriends = async () => {
    const result = await getFriends(auth.currentUser.uid);
    if (result.success) {
      const mutualFriends = [];
      for (const friend of result.data) {
        const isFollowingBack = await checkIsFollowing(friend.uid, auth.currentUser.uid);
        if (isFollowingBack) mutualFriends.push(friend);
      }
      setFriends(mutualFriends);
    }
  };

  const loadFriendRequests = async () => {
    const result = await getFriendRequests(auth.currentUser.uid);
    if (result.success) setFriendRequests(result.data);
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setSearching(true);
    const result = await searchUsers(searchText);
    if (result.success) {
      const filtered = result.data.filter(u => u.uid !== auth.currentUser.uid);
      setSearchResults(filtered);
      
      const statusMap = {};
      for (const user of filtered) {
        const isFollowing = await checkIsFollowing(auth.currentUser.uid, user.uid);
        statusMap[user.uid] = isFollowing;
      }
      setFollowingStatus(statusMap);
    }
    setSearching(false);
  };

  const handleFollowToggle = async (targetUser) => {
    const isFollowing = followingStatus[targetUser.uid];
    
    if (isFollowing) {
      const result = await unfollowUser(auth.currentUser.uid, targetUser.uid);
      if (result.success) {
        setFollowingStatus(prev => ({ ...prev, [targetUser.uid]: false }));
        setFriends(prev => prev.filter(f => f.uid !== targetUser.uid));
        Alert.alert('Sucesso', `Você deixou de seguir ${targetUser.nick}`);
      } else {
        Alert.alert('Erro', result.error);
      }
    } else {
      const result = await followUser(auth.currentUser.uid, targetUser.uid);
      if (result.success) {
        setFollowingStatus(prev => ({ ...prev, [targetUser.uid]: true }));
        Alert.alert('Sucesso', `Você está seguindo ${targetUser.nick}`);
      } else {
        Alert.alert('Erro', result.error);
      }
    }
  };

  const handleAcceptRequest = async (requestId, fromUserId) => {
    const result = await acceptFriendRequest(requestId, auth.currentUser.uid, fromUserId);
    if (result.success) {
      Alert.alert('Sucesso', 'Amigo adicionado!');
      await loadFriendRequests();
      await loadFriends();
    } else {
      Alert.alert('Erro', result.error);
    }
  };

  const openChat = (user) => {
    navigation.navigate('Chat', { 
      userId: user.uid, 
      userNick: user.nick, 
      userAvatar: user.avatarUrl,
      userStatus: user.status || 'online'
    });
  };

  const viewProfile = (user) => {
    navigation.navigate('UserProfile', { 
      userId: user.uid, 
      userNick: user.nick,
      userAvatar: user.avatarUrl,
      userGender: user.gender
    });
  };

  // Renderizador do chat modernizado
  const renderChatItem = ({ item }) => (
    <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item)} activeOpacity={0.7}>
      <LinearGradient colors={[colors.card, colors.background]} style={styles.chatCard}>
        <View style={styles.chatAvatar}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <LinearGradient colors={['#6c63ff', '#4ecdc4']} style={styles.avatarGradient}>
              <Icon name="account" size={24} color="#fff" />
            </LinearGradient>
          )}
          {item.status === 'online' && <View style={styles.onlineBadge} />}
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{item.nick}</Text>
            <Text style={styles.chatTime}>{item.lastMessageTime}</Text>
          </View>
          <View style={styles.chatFooter}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage || '💬 Clique para conversar'}
            </Text>
            {item.unreadCount > 0 && (
              <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </LinearGradient>
            )}
          </View>
        </View>
        <Icon name="chevron-right" size={20} color={colors.textSecondary} />
      </LinearGradient>
    </TouchableOpacity>
  );

  // Renderizador do amigo modernizado
  const renderFriendItem = ({ item }) => (
    <TouchableOpacity style={styles.friendItem} onPress={() => viewProfile(item)} activeOpacity={0.7}>
      <LinearGradient colors={[colors.card, colors.background]} style={styles.friendCard}>
        <View style={styles.friendAvatar}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatarImageSmall} />
          ) : (
            <LinearGradient colors={['#6c63ff', '#4ecdc4']} style={styles.avatarGradientSmall}>
              <Icon name="account" size={20} color="#fff" />
            </LinearGradient>
          )}
          {item.status === 'online' && <View style={styles.onlineBadgeSmall} />}
        </View>
        <View style={styles.friendInfo}>
          <View style={styles.friendHeader}>
            <Text style={styles.friendName}>{item.nick}</Text>
            {item.gender === 'masculino' && <Icon name="gender-male" size={14} color="#6c63ff" />}
            {item.gender === 'feminino' && <Icon name="gender-female" size={14} color="#ff6b6b" />}
          </View>
          <View style={styles.friendStatusContainer}>
            <View style={[styles.statusDot, item.status === 'online' && styles.statusOnline]} />
            <Text style={styles.friendStatus}>
              {item.status === 'online' ? 'Online' : 'Visto há pouco'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.messageButton} onPress={() => openChat(item)}>
          <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.1)']} style={styles.messageButtonGradient}>
            <Icon name="chat" size={20} color={colors.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Renderizador da solicitação de amizade modernizado
  const renderRequestItem = ({ item }) => (
    <TouchableOpacity style={styles.requestItem} onPress={() => viewProfile(item)} activeOpacity={0.7}>
      <LinearGradient colors={[colors.card, colors.background]} style={styles.requestCard}>
        <View style={styles.requestAvatar}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatarImageSmall} />
          ) : (
            <LinearGradient colors={['#ff6b6b', '#f093fb']} style={styles.avatarGradientSmall}>
              <Icon name="account" size={20} color="#fff" />
            </LinearGradient>
          )}
        </View>
        <View style={styles.requestInfo}>
          <View style={styles.requestHeader}>
            <Text style={styles.requestName}>{item.nick}</Text>
            {item.gender === 'masculino' && <Icon name="gender-male" size={12} color="#6c63ff" />}
            {item.gender === 'feminino' && <Icon name="gender-female" size={12} color="#ff6b6b" />}
          </View>
          <Text style={styles.requestMessage}>✨ Quer ser seu amigo</Text>
        </View>
        <TouchableOpacity 
          style={styles.acceptButton} 
          onPress={() => handleAcceptRequest(item.requestId, item.uid)}
        >
          <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.acceptButtonGradient}>
            <Icon name="check" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Renderizador do resultado da busca modernizado
  const renderSearchResult = ({ item }) => {
    const isFollowing = followingStatus[item.uid];
    return (
      <TouchableOpacity style={styles.searchResultItem} onPress={() => viewProfile(item)} activeOpacity={0.7}>
        <LinearGradient colors={[colors.card, colors.background]} style={styles.searchResultCard}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.searchAvatar} />
          ) : (
            <LinearGradient colors={['#6c63ff', '#4ecdc4']} style={styles.searchAvatarGradient}>
              <Icon name="account" size={22} color="#fff" />
            </LinearGradient>
          )}
          <View style={styles.searchResultInfo}>
            <Text style={styles.searchResultName}>{item.nick}</Text>
            <Text style={styles.searchResultId}>ID: {item.numericId}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={() => handleFollowToggle(item)}
          >
            <LinearGradient
              colors={isFollowing ? ['#4ecdc4', '#44a08d'] : [colors.primary, '#4ecdc4']}
              style={styles.followButtonGradient}
            >
              <Text style={styles.followButtonText}>
                {isFollowing ? '✓ Seguindo' : '+ Seguir'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
      {/* Header com gradiente */}
      <LinearGradient colors={[colors.card, 'transparent']} style={styles.headerGradient}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Mensagem</Text>
            <Text style={styles.headerSubtitle}>Conecte-se com amigos</Text>
          </View>
          <TouchableOpacity style={styles.searchHeaderButton}>
            <Icon name="account-plus" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Top Menu */}
      <View style={styles.topMenu}>
        <TouchableOpacity 
          style={[styles.topMenuItem, activeTab === 'mensagem' && styles.activeTopMenuItem]}
          onPress={() => setActiveTab('mensagem')}
        >
          <Icon name="chat" size={16} color={activeTab === 'mensagem' ? colors.text : colors.textSecondary} />
          <Text style={[styles.topMenuText, activeTab === 'mensagem' && styles.activeTopMenuText]}>
            Conversas
          </Text>
          {chats.length > 0 && (
            <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{chats.length}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.topMenuItem, activeTab === 'amigo' && styles.activeTopMenuItem]}
          onPress={() => setActiveTab('amigo')}
        >
          <Icon name="account-group" size={16} color={activeTab === 'amigo' ? colors.text : colors.textSecondary} />
          <Text style={[styles.topMenuText, activeTab === 'amigo' && styles.activeTopMenuText]}>
            Amigos
          </Text>
          {friends.length > 0 && (
            <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{friends.length}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'mensagem' ? (
        // ========== ABA MENSAGEM ==========
        chats.length > 0 ? (
          <Animated.FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            renderItem={renderChatItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.chatList}
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          />
        ) : (
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient colors={[colors.card, 'transparent']} style={styles.emptyCard}>
              <Icon name="chat-outline" size={60} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Nenhuma conversa</Text>
              <Text style={styles.emptyText}>
                Comece a conversar com seus amigos!
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('Sala')}>
                <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.emptyButtonGradient}>
                  <Text style={styles.emptyButtonText}>Explorar salas</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )
      ) : (
        // ========== ABA AMIGOS ==========
        <Animated.ScrollView 
          style={[styles.friendsContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {/* Barra de pesquisa */}
          <LinearGradient colors={[colors.card, colors.background]} style={styles.searchContainer}>
            <Icon name="magnify" size={20} color={colors.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar amigos ou ID..."
              placeholderTextColor={colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Icon name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </LinearGradient>

          {/* Resultados da busca */}
          {searchText.length > 0 && (
            <View style={styles.searchResults}>
              <Text style={styles.searchResultsTitle}>
                {searching ? '🔍 Buscando...' : '📋 Resultados da busca'}
              </Text>
              {searching ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.searchLoader} />
              ) : searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.uid}
                  renderItem={renderSearchResult}
                  scrollEnabled={false}
                />
              ) : (
                <LinearGradient colors={[colors.card, 'transparent']} style={styles.noResultsCard}>
                  <Icon name="emoticon-sad-outline" size={40} color={colors.textSecondary} />
                  <Text style={styles.noResultsText}>Nenhum usuário encontrado</Text>
                </LinearGradient>
              )}
            </View>
          )}

          {/* Solicitações de amizade */}
          {friendRequests.length > 0 && (
            <View style={styles.requestsSection}>
              <View style={styles.requestsHeader}>
                <Text style={styles.sectionTitle}>🎁 Solicitações de amizade</Text>
                <TouchableOpacity onPress={() => {}}>
                  <Text style={styles.clearText}>Ver todos</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={friendRequests.slice(0, 3)}
                keyExtractor={(item) => item.requestId}
                renderItem={renderRequestItem}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Lista de amigos mútuos */}
          <View style={styles.friendsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👥 Seus amigos ({friends.length})</Text>
              <TouchableOpacity onPress={onRefresh}>
                <Icon name="refresh" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
            {friends.length > 0 ? (
              <FlatList
                data={friends}
                keyExtractor={(item) => item.uid}
                renderItem={renderFriendItem}
                scrollEnabled={false}
              />
            ) : (
              <LinearGradient colors={[colors.card, 'transparent']} style={styles.emptyFriendsCard}>
                <Icon name="account-group" size={50} color={colors.textSecondary} />
                <Text style={styles.emptyFriendsText}>Você ainda não tem amigos</Text>
                <Text style={styles.emptyFriendsSubtext}>
                  Siga outros usuários para começar
                </Text>
                <TouchableOpacity style={styles.findFriendsButton} onPress={() => navigation.navigate('Descobrir')}>
                  <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.findFriendsButtonGradient}>
                    <Icon name="magnify" size={18} color="#fff" />
                    <Text style={styles.findFriendsButtonText}>Encontrar amigos</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </Animated.ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, marginTop: 16, fontSize: 14 },
  bottomPadding: { height: 40 },
  
  // Header
  headerGradient: { paddingTop: 40, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text, letterSpacing: 1 },
  headerSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  searchHeaderButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  
  // Top Menu
  topMenu: { flexDirection: 'row', backgroundColor: 'rgba(22,33,62,0.8)', marginHorizontal: 20, marginVertical: 16, borderRadius: 30, padding: 4 },
  topMenuItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 25 },
  activeTopMenuItem: { backgroundColor: colors.primary },
  topMenuText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  activeTopMenuText: { color: colors.text },
  badgeCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 6 },
  badgeCountText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  // Chat List
  chatList: { paddingHorizontal: 16, paddingBottom: 20 },
  chatItem: { marginBottom: 12 },
  chatCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  chatAvatar: { position: 'relative', marginRight: 14 },
  avatarImage: { width: 55, height: 55, borderRadius: 27.5 },
  avatarGradient: { width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center' },
  onlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#4ecdc4', borderWidth: 2, borderColor: colors.card },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  chatName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  chatTime: { color: colors.textSecondary, fontSize: 10 },
  chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { color: colors.textSecondary, fontSize: 13, flex: 1, marginRight: 10 },
  unreadBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 15 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  
  // Amigos
  friendsContainer: { flex: 1, paddingHorizontal: 16 },
  friendItem: { marginBottom: 12 },
  friendCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  friendAvatar: { position: 'relative', marginRight: 12 },
  avatarImageSmall: { width: 48, height: 48, borderRadius: 24 },
  avatarGradientSmall: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  onlineBadgeSmall: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4ecdc4', borderWidth: 2, borderColor: colors.card },
  friendInfo: { flex: 1 },
  friendHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  friendName: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  friendStatusContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textSecondary },
  statusOnline: { backgroundColor: '#4ecdc4' },
  friendStatus: { color: colors.textSecondary, fontSize: 11 },
  messageButton: { marginLeft: 8 },
  messageButtonGradient: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  
  // Solicitações
  requestsSection: { marginBottom: 20 },
  requestsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  clearText: { color: colors.primary, fontSize: 12 },
  requestItem: { marginBottom: 10 },
  requestCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  requestAvatar: { marginRight: 12 },
  requestInfo: { flex: 1 },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  requestName: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  requestMessage: { color: colors.textSecondary, fontSize: 11 },
  acceptButton: { borderRadius: 20, overflow: 'hidden' },
  acceptButtonGradient: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  
  // Busca
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, gap: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, color: colors.text, paddingVertical: 14, fontSize: 15 },
  searchResults: { marginBottom: 20 },
  searchResultsTitle: { color: colors.primary, fontSize: 13, fontWeight: 'bold', marginBottom: 12 },
  searchLoader: { marginTop: 20 },
  searchResultItem: { marginBottom: 10 },
  searchResultCard: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  searchAvatar: { width: 42, height: 42, borderRadius: 21 },
  searchAvatarGradient: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  searchResultInfo: { flex: 1, marginLeft: 12 },
  searchResultName: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  searchResultId: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  followButton: { borderRadius: 20, overflow: 'hidden' },
  followingButton: { borderRadius: 20 },
  followButtonGradient: { paddingHorizontal: 16, paddingVertical: 8 },
  followButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  noResultsCard: { alignItems: 'center', padding: 30, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  noResultsText: { color: colors.textSecondary, fontSize: 14, marginTop: 12 },
  
  // Empty states
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  emptyCard: { alignItems: 'center', padding: 40, borderRadius: 24, width: '100%' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  emptyText: { color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' },
  emptyButton: { marginTop: 24, borderRadius: 30, overflow: 'hidden' },
  emptyButtonGradient: { paddingHorizontal: 28, paddingVertical: 12 },
  emptyButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  
  // Empty friends
  emptyFriendsCard: { alignItems: 'center', padding: 40, borderRadius: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  emptyFriendsText: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginTop: 16 },
  emptyFriendsSubtext: { color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' },
  findFriendsButton: { marginTop: 20, borderRadius: 30, overflow: 'hidden' },
  findFriendsButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10 },
  findFriendsButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  
  friendsSection: { marginBottom: 20 },
});