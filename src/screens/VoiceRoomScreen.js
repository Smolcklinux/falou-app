/**
 * ============================================
 * FALOU - TELA DE SALAS DE VOZ
 * ============================================
 * ✅ VERSÃO COMPLETA:
 * 1. Lista todas as salas ativas
 * 2. ID da sala visível para compartilhamento
 * 3. Usuários podem entrar por ID numérico
 * 4. Navega para LiveKitVoiceRoom (áudio real)
 * 5. Chat persistente no Firestore
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
  listenToRoomMessages, getRoomMessages,
  getRoomByNumericId
} from '../services/firestore/index';
import { colors } from '../utils/colors';
import { testBackend } from '../services/livekit';

// Configuração das cadeiras (10 no total)
const SEATS_COUNT = 10;
const SEATS_NAMES = ['Dono(a)', 'Parceiro', 'Nº1', 'Nº2', 'Nº3', 'Nº4', 'Nº5', 'Nº6', 'Nº7', 'Nº8'];

export default function VoiceRoomScreen({ navigation, route }) {
  const { roomId, roomData: initialRoomData, roomNumericId: joinNumericId } = route.params || {};
  
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(initialRoomData || null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  
  const [seats, setSeats] = useState(Array(SEATS_COUNT).fill(null));
  const [loadingSeats, setLoadingSeats] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const flatListRef = useRef();
  const unsubscribeMessages = useRef(null);
  
  // Estado para saber se LiveKit está ativo (mostra ID)
  const [liveKitActive, setLiveKitActive] = useState(false);
  
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadData();
    checkLiveKitStatus();
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

  const checkLiveKitStatus = async () => {
    const isActive = await testBackend();
    setLiveKitActive(isActive);
    console.log('🔊 LiveKit status:', isActive ? '✅ Ativo' : '⚠️ Modo demonstração');
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
    if (result.success) {
      console.log('📊 Salas carregadas:', result.data.length);
      setRooms(result.data);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ✅ CRIAR SALA COM ID NUMÉRICO
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
      console.log('✅ Sala criada! ID:', result.id, 'ID Numérico:', result.roomNumericId);
      setModalVisible(false);
      setRoomName('');
      setRoomDescription('');
      await loadRooms();
      Alert.alert('✅ Sucesso', `Sala criada!\n\n📌 ID: ${result.roomNumericId}\n\nCompartilhe este ID com seus amigos!`);
    } else {
      Alert.alert('Erro', result.error);
    }
    setLoading(false);
  };

  // ✅ ENTRAR POR ID NUMÉRICO
  const handleJoinByNumericId = async () => {
    if (!joinRoomId.trim()) {
      Alert.alert('Erro', 'Digite o ID da sala');
      return;
    }
    
    const numericId = parseInt(joinRoomId.trim());
    if (isNaN(numericId)) {
      Alert.alert('Erro', 'ID inválido');
      return;
    }
    
    setJoinModalVisible(false);
    setLoading(true);
    
    const result = await getRoomByNumericId(numericId);
    if (result.success) {
      // ✅ Navega diretamente para o componente de áudio
      navigation.navigate('LiveKitVoiceRoom', { 
        roomId: result.data.id,
        roomName: result.data.name,
        roomNumericId: numericId
      });
    } else {
      Alert.alert('Erro', 'Sala não encontrada');
    }
    setLoading(false);
  };

  // ✅ ENTRAR NA SALA (clique na lista)
  const enterRoom = (room) => {
    console.log('🎤 Entrando na sala:', room.name);
    console.log('📌 ID da sala:', room.id);
    console.log('📌 ID Numérico:', room.roomNumericId);
    
    // ✅ Navegar para o componente LiveKitVoiceRoom (áudio ao vivo)
    navigation.navigate('LiveKitVoiceRoom', { 
      roomId: room.id,
      roomName: room.name,
      roomNumericId: room.roomNumericId
    });
  };

  // ==========================================
  // RENDERIZAÇÃO DA LISTA DE SALAS
  // ==========================================
  const renderRoom = ({ item }) => {
    const onlineCount = item.seats?.filter(s => s)?.length || 0;
    const displayId = item.roomNumericId || item.id?.slice(-6);
    
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
              {/* ✅ ID da sala visível (só se LiveKit ativo) */}
              {liveKitActive && (
                <Text style={styles.roomNumericId}>Sala #{displayId}</Text>
              )}
              <Text style={styles.roomOwner}>{item.ownerNick}</Text>
              <View style={styles.roomTags}>
                <View style={styles.tag}>
                  <Icon name="fire" size={10} color={colors.warning} />
                  <Text style={styles.tagText}>{item.popularity || 0}</Text>
                </View>
                <View style={styles.tag}>
                  <Icon name="people" size={10} color={colors.primary} />
                  <Text style={styles.tagText}>{onlineCount}/10</Text>
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
      {/* Header da lista */}
      <LinearGradient colors={[colors.card, 'transparent']} style={styles.headerGradient}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Salas de Voz</Text>
            <Text style={styles.headerSubtitle}>Conecte-se ao vivo</Text>
          </View>
          <View style={styles.headerButtons}>
            {/* ✅ Botão Entrar por ID */}
            <TouchableOpacity style={styles.joinButton} onPress={() => setJoinModalVisible(true)}>
              <LinearGradient colors={['#4ecdc4', '#44a08d']} style={styles.joinButtonGradient}>
                <Icon name="login" size={16} color="#fff" />
                <Text style={styles.joinButtonText}>Entrar por ID</Text>
              </LinearGradient>
            </TouchableOpacity>
            {/* ✅ Botão Criar Sala */}
            <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
              <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.createButtonGradient}>
                <Icon name="plus" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Criar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Lista de Salas */}
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

      {/* ========================================== */}
      {/* MODAL DE CRIAÇÃO DE SALA */}
      {/* ========================================== */}
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

      {/* ========================================== */}
      {/* MODAL PARA ENTRAR POR ID */}
      {/* ========================================== */}
      <Modal visible={joinModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setJoinModalVisible(false)} />
          <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🔍 Entrar por ID</Text>
                <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                  <Icon name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>Digite o ID numérico da sala</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: 100001"
                placeholderTextColor={colors.textSecondary}
                value={joinRoomId}
                onChangeText={setJoinRoomId}
                keyboardType="numeric"
                maxLength={10}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setJoinModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={handleJoinByNumericId}>
                  <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.modalSaveGradient}>
                    <Text style={styles.modalSaveText}>Entrar</Text>
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
  
  headerGradient: { paddingTop: 40, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text, letterSpacing: 1 },
  headerSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  headerButtons: { flexDirection: 'row', gap: 10 },
  
  joinButton: { borderRadius: 25, overflow: 'hidden' },
  joinButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
  joinButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  
  createButton: { borderRadius: 25, overflow: 'hidden' },
  createButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  createButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  
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
  roomNumericId: { color: colors.primary, fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  roomOwner: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  roomTags: { flexDirection: 'row', gap: 8, marginTop: 6 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(108,99,255,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  tagText: { color: colors.textSecondary, fontSize: 10 },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 20 },
  emptyCard: { alignItems: 'center', padding: 40, borderRadius: 24, width: '100%' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  emptyText: { color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' },
  emptyButton: { marginTop: 20, borderRadius: 25, overflow: 'hidden' },
  emptyButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  emptyButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContainer: { width: '90%', borderRadius: 28, overflow: 'hidden' },
  modalContent: { padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  modalSubtitle: { color: colors.textSecondary, fontSize: 14, marginBottom: 16, textAlign: 'center' },
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