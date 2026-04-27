/**
 * ============================================
 * FALOU - TELA DE SALAS DE VOZ
 * ============================================
 * ✅ VERSÃO MODERNIZADA CORRIGIDA:
 * 1. Removido header duplicado dentro da sala
 * 2. Apenas header da sala com botão voltar
 * 3. Design com gradientes e cards elegantes
 * 4. Animações suaves na entrada
 * 5. Chat com persistência no Firestore
 * 6. Sistema de cadeiras com indicadores visuais
 * 7. Layout responsivo
 * ============================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, TextInput, Modal, ActivityIndicator, 
  RefreshControl, Image, ScrollView, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../../config/firebase';
import { 
  getActiveRooms, createVoiceRoom, getUserProfile, 
  getRoomSeats, updateRoomSeats,
  listenToRoomMessages, sendRoomMessage, getRoomMessages
} from '../services/firestore';
import { colors } from '../utils/colors';

// Configuração das cadeiras (10 no total)
const SEATS_COUNT = 10;
const SEATS_NAMES = ['Dono(a)', 'Parceiro', 'Nº1', 'Nº2', 'Nº3', 'Nº4', 'Nº5', 'Nº6', 'Nº7', 'Nº8'];

export default function VoiceRoomScreen({ navigation, route }) {
  const { roomId, roomData: initialRoomData } = route.params || {};
  
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(initialRoomData || null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  
  const [seats, setSeats] = useState(Array(SEATS_COUNT).fill(null));
  const [loadingSeats, setLoadingSeats] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const flatListRef = useRef();
  const unsubscribeMessages = useRef(null);
  
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadData();
    animateEntrance();
    
    return () => {
      if (unsubscribeMessages.current) {
        unsubscribeMessages.current();
      }
    };
  }, []);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const loadData = async () => {
    setLoading(true);
    const profile = await getUserProfile(auth.currentUser.uid);
    if (profile.success) setUserProfile(profile.data);
    await loadRooms();
    setLoading(false);
    setRefreshing(false);
  };

  const loadRooms = async () => {
    const result = await getActiveRooms();
    if (result.success) setRooms(result.data);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert('Erro', 'Digite um nome para a sala');
      return;
    }

    setLoading(true);
    const result = await createVoiceRoom({
      name: roomName,
      description: roomDescription,
      ownerId: auth.currentUser.uid,
      ownerNick: userProfile?.nick || 'Usuário',
      ownerAvatar: userProfile?.avatarUrl || null,
    });

    if (result.success) {
      setModalVisible(false);
      setRoomName('');
      setRoomDescription('');
      await loadRooms();
      Alert.alert('Sucesso', 'Sala criada!');
    } else {
      Alert.alert('Erro', result.error);
    }
    setLoading(false);
  };

  const enterRoom = async (room) => {
    console.log('🎤 Entrando na sala:', room.name);
    setCurrentRoom(room);
    
    setLoadingSeats(true);
    const seatsResult = await getRoomSeats(room.id);
    if (seatsResult.success && seatsResult.seats) {
      setSeats(seatsResult.seats);
    } else {
      const emptySeats = Array(SEATS_COUNT).fill(null);
      emptySeats[0] = {
        uid: room.ownerId,
        nick: room.ownerNick,
        avatar: room.ownerAvatar,
        isOwner: true
      };
      setSeats(emptySeats);
      await updateRoomSeats(room.id, emptySeats);
    }
    
    const messagesResult = await getRoomMessages(room.id);
    if (messagesResult.success) {
      setMessages(messagesResult.data);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
    
    if (unsubscribeMessages.current) {
      unsubscribeMessages.current();
    }
    unsubscribeMessages.current = listenToRoomMessages(room.id, (newMessages) => {
      setMessages(newMessages);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    
    setLoadingSeats(false);
  };

  const takeSeat = async (seatIndex) => {
    const currentSeatIndex = seats.findIndex(s => s?.uid === auth.currentUser.uid);
    
    if (currentSeatIndex === seatIndex) return;
    
    if (currentSeatIndex !== -1) {
      const newSeats = [...seats];
      newSeats[currentSeatIndex] = null;
      setSeats(newSeats);
      await updateRoomSeats(currentRoom.id, newSeats);
    }
    
    if (seats[seatIndex]) return;
    
    const newSeats = [...seats];
    newSeats[seatIndex] = {
      uid: auth.currentUser.uid,
      nick: userProfile?.nick,
      avatar: userProfile?.avatarUrl,
      joinedAt: new Date().toISOString()
    };
    setSeats(newSeats);
    
    const result = await updateRoomSeats(currentRoom.id, newSeats);
    if (!result.success) {
      newSeats[seatIndex] = null;
      setSeats(newSeats);
    }
  };

  const leaveCurrentSeat = async () => {
    const currentSeatIndex = seats.findIndex(s => s?.uid === auth.currentUser.uid);
    if (currentSeatIndex === -1) return;
    
    const newSeats = [...seats];
    newSeats[currentSeatIndex] = null;
    setSeats(newSeats);
    await updateRoomSeats(currentRoom.id, newSeats);
  };

  const leaveRoom = async () => {
    await leaveCurrentSeat();
    if (unsubscribeMessages.current) {
      unsubscribeMessages.current();
    }
    setCurrentRoom(null);
    navigation.goBack();
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const text = chatInput.trim();
    setChatInput('');
    
    const result = await sendRoomMessage(
      currentRoom.id,
      auth.currentUser.uid,
      userProfile?.nick || 'Usuário',
      userProfile?.avatarUrl,
      text
    );
    
    if (!result.success) {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem');
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderSeat = (seat, index) => {
    const isOccupied = !!seat;
    const isCurrentUser = seat?.uid === auth.currentUser.uid;
    const seatName = SEATS_NAMES[index];
    const isSpecial = index === 0 || index === 1;
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.seat,
          isOccupied && styles.seatOccupied,
          isCurrentUser && styles.seatMy,
          isSpecial && styles.specialSeat
        ]}
        onPress={() => takeSeat(index)}
        disabled={loadingSeats}
        activeOpacity={0.7}
      >
        {isOccupied ? (
          <>
            {seat.avatar ? (
              <Image source={{ uri: seat.avatar }} style={styles.seatAvatar} />
            ) : (
              <LinearGradient colors={['#6c63ff', '#4ecdc4']} style={styles.seatAvatarGradient}>
                <Icon name="account" size={20} color="#fff" />
              </LinearGradient>
            )}
            <Text style={styles.seatName} numberOfLines={1}>
              {seat.nick?.substring(0, 12)}
            </Text>
            {isCurrentUser && (
              <View style={styles.micIcon}>
                <Icon name="microphone" size={12} color={colors.success} />
              </View>
            )}
            {isSpecial && index === 0 && (
              <View style={styles.crownIcon}>
                <Icon name="crown" size={14} color={colors.warning} />
              </View>
            )}
          </>
        ) : (
          <>
            <Icon name="seat-passenger" size={28} color={colors.textSecondary} />
            <Text style={styles.seatEmpty}>{seatName}</Text>
            <Text style={styles.seatEmptySub}>Clique</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.userId === auth.currentUser.uid;
    const messageTime = formatMessageTime(item.timestamp);
    
    return (
      <View style={[styles.chatMessage, isMyMessage && styles.myChatMessage]}>
        <View style={styles.chatMessageHeader}>
          <Text style={styles.chatUserName}>{item.userName}</Text>
          <Text style={styles.chatTime}>{messageTime}</Text>
        </View>
        <Text style={styles.chatText}>{item.text}</Text>
      </View>
    );
  };

  // ==========================================
  // TELA DA SALA (quando dentro de uma sala)
  // ==========================================
  if (currentRoom) {
    const onlineCount = seats.filter(s => s).length;
    
    return (
      <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
        {/* ========================================== */}
        {/* APENAS O HEADER DA SALA (sem título duplicado) */}
        {/* ========================================== */}
        <LinearGradient colors={[colors.card, 'transparent']} style={styles.roomHeaderGradient}>
          <View style={styles.roomHeader}>
            <TouchableOpacity onPress={leaveRoom} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.roomHeaderInfo}>
              <Text style={styles.roomHeaderTitle}>{currentRoom.name}</Text>
              <View style={styles.roomHeaderStats}>
                <View style={styles.roomStat}>
                  <Icon name="account" size={10} color={colors.primary} />
                  <Text style={styles.roomStatText}>{currentRoom.ownerNick}</Text>
                </View>
                <View style={styles.roomStat}>
                  <Icon name="account-group" size={10} color={colors.textSecondary} />
                  <Text style={styles.roomStatText}>{onlineCount}/10 online</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.inviteButton} onPress={() => {
              Alert.alert('Convidar', `Compartilhe o ID da sala: ${currentRoom.id}`);
            }}>
              <Icon name="share-variant" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {loadingSeats && (
          <View style={styles.loadingSeats}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingSeatsText}>Carregando cadeiras...</Text>
          </View>
        )}

        {/* Área das cadeiras */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seatsScroll}>
          <View style={styles.seatsGrid}>
            {seats.map((seat, index) => renderSeat(seat, index))}
          </View>
        </ScrollView>

        {/* Aviso de regras */}
        <LinearGradient colors={['rgba(255,107,107,0.1)', 'transparent']} style={styles.warningContainer}>
          <Icon name="alert-circle" size={14} color={colors.warning} />
          <Text style={styles.warningText}>
            Mantenha a ordem e o respeito dentro do Falou. Comportamento inadequado resultará em banimento!
          </Text>
        </LinearGradient>

        {/* Abas */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Icon name="chat" size={14} color={colors.text} />
            <Text style={[styles.tabText, styles.activeTabText]}> Conversa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Icon name="account-group" size={14} color={colors.textSecondary} />
            <Text style={styles.tabText}> Participantes ({onlineCount}/10)</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de mensagens */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Icon name="chat-outline" size={40} color={colors.textSecondary} />
              <Text style={styles.emptyChatText}>Nenhuma mensagem ainda</Text>
              <Text style={styles.emptyChatSubtext}>Seja o primeiro a conversar!</Text>
            </View>
          }
        />

        {/* Input do chat */}
        <LinearGradient colors={[colors.card, colors.background]} style={styles.chatInputWrapper}>
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Digite uma mensagem..."
              placeholderTextColor={colors.textSecondary}
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.sendButtonGradient}>
                <Icon name="send" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </LinearGradient>
    );
  }

  // ==========================================
  // LISTA DE SALAS (FORA DA SALA)
  // ==========================================
  const renderRoom = ({ item }) => {
    const onlineCount = item.seats?.filter(s => s)?.length || 0;
    
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity style={styles.roomCard} onPress={() => enterRoom(item)} activeOpacity={0.8}>
          <LinearGradient colors={[colors.card, colors.background]} style={styles.roomCardGradient}>
            <View style={styles.roomAvatar}>
              {item.coverImage ? (
                <Image source={{ uri: item.coverImage }} style={styles.avatarImage} />
              ) : item.ownerAvatar ? (
                <Image source={{ uri: item.ownerAvatar }} style={styles.avatarImage} />
              ) : (
                <LinearGradient colors={['#6c63ff', '#4ecdc4']} style={styles.roomAvatarGradient}>
                  <Icon name="microphone-variant" size={28} color="#fff" />
                </LinearGradient>
              )}
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>{onlineCount}</Text>
              </View>
            </View>
            <View style={styles.roomInfo}>
              <Text style={styles.roomName}>{item.name}</Text>
              <Text style={styles.roomOwner}>{item.ownerNick}</Text>
              <View style={styles.roomTags}>
                <View style={styles.tag}>
                  <Icon name="fire" size={10} color={colors.warning} />
                  <Text style={styles.tagText}>{item.popularity || 0}</Text>
                </View>
                <View style={styles.tag}>
                  <Icon name="chat" size={10} color={colors.primary} />
                  <Text style={styles.tagText}>Ativo</Text>
                </View>
              </View>
            </View>
            <Icon name="chevron-right" size={24} color={colors.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando salas...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
      {/* Header da lista (fora da sala) */}
      <LinearGradient colors={[colors.card, 'transparent']} style={styles.headerGradient}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Salas de Voz</Text>
            <Text style={styles.headerSubtitle}>Conecte-se ao vivo</Text>
          </View>
          <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
            <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.createButtonGradient}>
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Criar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoom}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.roomsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient colors={[colors.card, 'transparent']} style={styles.emptyCard}>
              <Icon name="microphone-variant-off" size={60} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Nenhuma sala ativa</Text>
              <Text style={styles.emptyText}>Crie uma sala para começar</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => setModalVisible(true)}>
                <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.emptyButtonGradient}>
                  <Icon name="plus" size={18} color="#fff" />
                  <Text style={styles.emptyButtonText}>Criar Sala</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        }
      />

      {/* Modal de criação de sala */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🎤 Criar Sala</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Icon name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalUserInfo}>
                {userProfile?.avatarUrl ? (
                  <Image source={{ uri: userProfile.avatarUrl }} style={styles.modalAvatar} />
                ) : (
                  <LinearGradient colors={['#6c63ff', '#4ecdc4']} style={styles.modalAvatarGradient}>
                    <Icon name="account" size={18} color="#fff" />
                  </LinearGradient>
                )}
                <Text style={styles.modalUserName}>{userProfile?.nick}</Text>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Nome da sala"
                placeholderTextColor={colors.textSecondary}
                value={roomName}
                onChangeText={setRoomName}
                maxLength={30}
              />

              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Descrição (opcional)"
                placeholderTextColor={colors.textSecondary}
                value={roomDescription}
                onChangeText={setRoomDescription}
                multiline
                numberOfLines={3}
                maxLength={100}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={handleCreateRoom}>
                  <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.modalSaveGradient}>
                    <Text style={styles.modalSaveText}>Criar Sala</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, marginTop: 16, fontSize: 14 },
  
  // Header da lista (fora da sala)
  headerGradient: { paddingTop: 40, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text, letterSpacing: 1 },
  headerSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  createButton: { borderRadius: 25, overflow: 'hidden' },
  createButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  createButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  
  // Lista de salas
  roomsList: { paddingHorizontal: 16, paddingBottom: 20 },
  roomCard: { marginBottom: 12, borderRadius: 20, overflow: 'hidden' },
  roomCardGradient: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 20 },
  roomAvatar: { position: 'relative', marginRight: 14 },
  avatarImage: { width: 55, height: 55, borderRadius: 27.5 },
  roomAvatarGradient: { width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center' },
  onlineBadge: { position: 'absolute', bottom: -2, right: -2, flexDirection: 'row', alignItems: 'center', backgroundColor: '#4ecdc4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  onlineText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  roomInfo: { flex: 1 },
  roomName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  roomOwner: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  roomTags: { flexDirection: 'row', gap: 8, marginTop: 6 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(108,99,255,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  tagText: { color: colors.textSecondary, fontSize: 10 },
  
  // Header da sala ativa (dentro da sala)
  roomHeaderGradient: { paddingTop: 40, paddingBottom: 15, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  roomHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  roomHeaderInfo: { flex: 1 },
  roomHeaderTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  roomHeaderStats: { flexDirection: 'row', gap: 12, marginTop: 4 },
  roomStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roomStatText: { color: colors.textSecondary, fontSize: 10 },
  inviteButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  
  // Loading
  loadingSeats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, gap: 10 },
  loadingSeatsText: { color: colors.textSecondary, fontSize: 12 },
  
  // Cadeiras
  seatsScroll: { maxHeight: 130, marginVertical: 10 },
  seatsGrid: { flexDirection: 'row', paddingHorizontal: 10, gap: 10 },
  seat: { width: 80, backgroundColor: colors.card, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderWidth: 1, borderColor: colors.border },
  seatOccupied: { borderColor: '#ff6b6b', backgroundColor: 'rgba(255,107,107,0.1)' },
  seatMy: { borderColor: '#4ecdc4', borderWidth: 2, backgroundColor: 'rgba(78,205,196,0.1)' },
  specialSeat: { backgroundColor: 'rgba(108,99,255,0.1)', borderColor: colors.primary },
  seatAvatar: { width: 40, height: 40, borderRadius: 20, marginBottom: 5 },
  seatAvatarGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  seatName: { color: colors.text, fontSize: 10, textAlign: 'center' },
  seatEmpty: { color: colors.textSecondary, fontSize: 10, marginTop: 5 },
  seatEmptySub: { color: '#666', fontSize: 8, marginTop: 2 },
  micIcon: { position: 'absolute', bottom: 5, right: 5 },
  crownIcon: { position: 'absolute', top: 5, right: 5 },
  
  // Aviso
  warningContainer: { flexDirection: 'row', marginHorizontal: 16, padding: 12, borderRadius: 12, gap: 8 },
  warningText: { color: colors.textSecondary, fontSize: 11, flex: 1 },
  
  // Abas
  tabBar: { flexDirection: 'row', backgroundColor: colors.card, marginHorizontal: 16, borderRadius: 25, padding: 4, marginBottom: 10 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 20 },
  activeTab: { backgroundColor: colors.primary },
  tabText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  activeTabText: { color: colors.text },
  
  // Chat
  chatList: { paddingHorizontal: 16, paddingBottom: 10, flex: 1 },
  chatMessage: { backgroundColor: colors.card, borderRadius: 16, padding: 12, marginBottom: 8, maxWidth: '85%' },
  myChatMessage: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  chatMessageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chatUserName: { color: colors.textSecondary, fontSize: 11 },
  chatTime: { color: 'rgba(255,255,255,0.6)', fontSize: 9 },
  chatText: { color: colors.text, fontSize: 14 },
  emptyChat: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyChatText: { color: colors.textSecondary, fontSize: 16 },
  emptyChatSubtext: { color: '#666', fontSize: 12 },
  
  // Input chat
  chatInputWrapper: { borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' },
  chatInputContainer: { flexDirection: 'row', padding: 12, gap: 8 },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 10, color: colors.text },
  sendButton: { borderRadius: 25, overflow: 'hidden' },
  sendButtonGradient: { width: 45, height: 45, justifyContent: 'center', alignItems: 'center' },
  
  // Empty state
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 20 },
  emptyCard: { alignItems: 'center', padding: 40, borderRadius: 24, width: '100%' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  emptyText: { color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' },
  emptyButton: { marginTop: 20, borderRadius: 25, overflow: 'hidden' },
  emptyButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  emptyButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContainer: { width: '90%', borderRadius: 28, overflow: 'hidden' },
  modalContent: { padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  modalUserInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  modalAvatar: { width: 40, height: 40, borderRadius: 20 },
  modalAvatarGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  modalUserName: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.05)', color: colors.text, padding: 14, borderRadius: 14, marginBottom: 15, borderWidth: 1, borderColor: colors.border },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancel: { flex: 1, backgroundColor: 'rgba(255,107,107,0.2)', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalCancelText: { color: '#ff6b6b', fontSize: 15, fontWeight: 'bold' },
  modalSave: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  modalSaveGradient: { paddingVertical: 14, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});