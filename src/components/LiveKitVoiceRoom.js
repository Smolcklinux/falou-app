/**
 * ============================================
 * FALOU - LIVEKIT VOICE ROOM
 * ============================================
 * Componente de áudio ao vivo
 * ============================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, ActivityIndicator, Image, TextInput,
  ScrollView, Modal, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import do LiveKit
let LiveKitRoom, useTracks, useParticipants, TrackLoop, AudioTrack;
let LiveKitAvailable = false;

try {
  const livekit = require('@livekit/react-native');
  LiveKitRoom = livekit.LiveKitRoom;
  useTracks = livekit.useTracks;
  useParticipants = livekit.useParticipants;
  TrackLoop = livekit.TrackLoop;
  AudioTrack = livekit.AudioTrack;
  LiveKitAvailable = true;
  console.log('✅ LiveKit SDK carregado');
} catch (e) {
  console.log('⚠️ LiveKit SDK não disponível:', e.message);
  LiveKitAvailable = false;
}

import { auth } from '../../config/firebase';
import { getUserProfile } from '../services/firestore/index';
import { generateLiveKitToken, testBackend } from '../services/livekit';
import { ensureMicrophonePermission } from '../services/permissions';
import { colors } from '../utils/colors';

function AudioTracks() {
  if (!LiveKitAvailable || !useTracks) return null;
  const tracks = useTracks([Track.Source.Microphone]);
  if (!TrackLoop) return null;
  return (
    <TrackLoop tracks={tracks}>
      <AudioTrack />
    </TrackLoop>
  );
}

function ParticipantsUpdater({ setParticipants }) {
  const participants = useParticipants ? useParticipants() : [];
  useEffect(() => {
    if (participants && setParticipants) {
      setParticipants(participants);
    }
  }, [participants, setParticipants]);
  return null;
}

export default function LiveKitVoiceRoom({ route, navigation }) {
  const { roomId, roomName: propRoomName, roomNumericId } = route.params || {};
  
  const [token, setToken] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSeat, setCurrentSeat] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [participants, setParticipants] = useState([]);
  const [liveKitReady, setLiveKitReady] = useState(false);
  
  const flatListRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const SEATS = [
    { id: 0, name: 'Dono(a)', isSpecial: true, icon: 'crown', color: ['#FFD700', '#FFA500'] },
    { id: 1, name: 'Parceiro', isSpecial: true, icon: 'handshake', color: ['#6c63ff', '#4ecdc4'] },
    { id: 2, name: 'Nº1', isSpecial: false, icon: 'numeric-1-circle' },
    { id: 3, name: 'Nº2', isSpecial: false, icon: 'numeric-2-circle' },
    { id: 4, name: 'Nº3', isSpecial: false, icon: 'numeric-3-circle' },
    { id: 5, name: 'Nº4', isSpecial: false, icon: 'numeric-4-circle' },
    { id: 6, name: 'Nº5', isSpecial: false, icon: 'numeric-5-circle' },
    { id: 7, name: 'Nº6', isSpecial: false, icon: 'numeric-6-circle' },
    { id: 8, name: 'Nº7', isSpecial: false, icon: 'numeric-7-circle' },
    { id: 9, name: 'Nº8', isSpecial: false, icon: 'numeric-8-circle' },
  ];

  useEffect(() => {
    loadProfileAndConnect();
    animateEntrance();
  }, []);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const loadProfileAndConnect = async () => {
    const hasMicPermission = await ensureMicrophonePermission();
    if (!hasMicPermission) {
      setConnectionError('PERMISSION_DENIED');
      setIsConnecting(false);
      return;
    }
    
    const profile = await getUserProfile(auth.currentUser.uid);
    if (!profile.success) {
      setConnectionError('USER_NOT_FOUND');
      setIsConnecting(false);
      return;
    }
    setUserProfile(profile.data);
    await connectToRoom();
  };

  const connectToRoom = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    if (!LiveKitAvailable) {
      setConnectionError('LIVEKIT_SDK_UNAVAILABLE');
      setIsConnecting(false);
      return;
    }
    
    const backendWorking = await testBackend();
    if (!backendWorking) {
      setConnectionError('BACKEND_OFFLINE');
      setIsConnecting(false);
      return;
    }
    
    const result = await generateLiveKitToken(
      roomId,
      userProfile?.nick || 'Usuário',
      auth.currentUser.uid
    );
    
    if (!result.success) {
      setConnectionError(`TOKEN_ERROR: ${result.error}`);
      setIsConnecting(false);
      return;
    }
    
    setToken(result.token);
    setLiveKitReady(true);
    setIsConnecting(false);
  };

  const leaveRoom = () => {
    navigation.goBack();
  };

  const handleSeatPress = (seatId) => {
    const seat = SEATS[seatId];
    if (currentSeat === seatId) {
      setCurrentSeat(null);
    } else {
      setCurrentSeat(seatId);
    }
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      userId: auth.currentUser.uid,
      userName: userProfile?.nick || 'Usuário',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, newMessage]);
    setChatInput('');
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const getErrorMessage = (errorCode) => {
    const errors = {
      PERMISSION_DENIED: {
        title: '🎤 Permissão do Microfone',
        message: 'Você precisa permitir o acesso ao microfone.',
        icon: 'microphone-off'
      },
      USER_NOT_FOUND: {
        title: '👤 Usuário não encontrado',
        message: 'Não foi possível encontrar seus dados.',
        icon: 'account-off'
      },
      LIVEKIT_SDK_UNAVAILABLE: {
        title: '🔧 LiveKit indisponível',
        message: 'Módulo de áudio não está disponível.',
        icon: 'microphone-variant-off'
      },
      BACKEND_OFFLINE: {
        title: '🌐 Servidor offline',
        message: 'Não foi possível conectar ao servidor de áudio.',
        icon: 'wifi-off'
      }
    };
    if (errorCode?.startsWith('TOKEN_ERROR')) {
      return {
        title: '🔑 Erro de autenticação',
        message: errorCode.replace('TOKEN_ERROR: ', ''),
        icon: 'key'
      };
    }
    return errors[errorCode] || {
      title: '❌ Erro desconhecido',
      message: errorCode,
      icon: 'alert-circle'
    };
  };

  const renderSeat = ({ item, index }) => {
    const isCurrent = currentSeat === index;
    const isSpecial = item.isSpecial;
    
    if (isSpecial) {
      return (
        <LinearGradient colors={item.color} style={[styles.seatCard, styles.specialSeat]}>
          <View style={styles.seatAvatar}>
            <Icon name={item.icon} size={30} color="#fff" />
          </View>
          <Text style={styles.seatName}>{item.name}</Text>
          <Text style={styles.occupantName}>Dono</Text>
        </LinearGradient>
      );
    }
    
    return (
      <TouchableOpacity style={[styles.seatCard, isCurrent && styles.currentSeat]} onPress={() => handleSeatPress(index)}>
        <LinearGradient colors={isCurrent ? [colors.primary, '#4ecdc4'] : ['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.05)']} style={styles.seatGradient}>
          <View style={styles.seatAvatar}>
            <Icon name={isCurrent ? "microphone" : item.icon} size={30} color={isCurrent ? colors.success : colors.textSecondary} />
          </View>
          <Text style={[styles.seatName, isCurrent && styles.currentSeatText]}>{item.name}</Text>
          {isCurrent && (
            <TouchableOpacity style={styles.micStatus} onPress={toggleMute}>
              <Icon name={isMuted ? "microphone-off" : "microphone"} size={14} color={isMuted ? colors.danger : colors.success} />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.userId === auth.currentUser.uid;
    return (
      <View style={[styles.chatMessage, isMyMessage && styles.myChatMessage]}>
        <Text style={styles.chatUserName}>{item.userName}</Text>
        <Text style={styles.chatText}>{item.text}</Text>
        <Text style={styles.chatTime}>{item.timestamp}</Text>
      </View>
    );
  };

  // Tela de erro
  if (connectionError && !isConnecting) {
    const error = getErrorMessage(connectionError);
    return (
      <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name={error.icon} size={80} color={colors.danger} />
          <Text style={styles.errorTitle}>{error.title}</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={connectToRoom}>
            <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.retryButtonGradient}>
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={leaveRoom}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Carregando
  if (isConnecting) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.connectingText}>Conectando à sala...</Text>
      </View>
    );
  }

  // Modo LiveKit real
  if (!liveKitReady || !token) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.connectingText}>Preparando áudio...</Text>
      </View>
    );
  }

  return (
    <LiveKitRoom
      serverUrl="wss://falou-voice-bschu9m4.livekit.cloud"
      token={token}
      connect={true}
      audio={!isMuted}
      video={false}
      onDisconnected={leaveRoom}
    >
      <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
        <LinearGradient colors={[colors.card, 'transparent']} style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity onPress={leaveRoom} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.roomTitle}>{propRoomName || 'Sala de Voz'}</Text>
              <Text style={styles.roomIdText}>ID: {roomNumericId || roomId?.slice(-8)}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
              <Icon name="cog" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ParticipantsUpdater setParticipants={setParticipants} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seatsScroll}>
          <View style={styles.seatsContainer}>
            {SEATS.map((seat, idx) => (
              <View key={idx} style={{ width: 90 }}>
                {renderSeat({ item: seat, index: idx })}
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tab, activeTab === 'chat' && styles.activeTab]} onPress={() => setActiveTab('chat')}>
            <Icon name="chat" size={16} color={activeTab === 'chat' ? colors.text : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}> Conversa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'info' && styles.activeTab]} onPress={() => setActiveTab('info')}>
            <Icon name="information" size={16} color={activeTab === 'info' ? colors.text : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}> Info</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'chat' ? (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.chatList}
              ListEmptyComponent={<Text style={styles.emptyChat}>Nenhuma mensagem ainda</Text>}
            />
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Digite uma mensagem..."
                placeholderTextColor={colors.textSecondary}
                value={chatInput}
                onChangeText={setChatInput}
              />
              <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.sendButtonGradient}>
                  <Icon name="send" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.infoContainer}>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>ID: {roomNumericId || roomId?.slice(-8)}</Text>
              <Text style={styles.infoText}>Participantes: {participants.length}/10</Text>
              <Text style={styles.infoText}>Áudio: {isMuted ? 'Mudo' : 'Ativo'}</Text>
            </View>
          </View>
        )}

        <Modal visible={showSettings} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Configurações</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)}>
                  <Icon name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.modalItem} onPress={toggleMute}>
                <Icon name={isMuted ? "microphone-off" : "microphone"} size={20} color={colors.primary} />
                <Text style={styles.modalItemText}>{isMuted ? 'Ativar microfone' : 'Desativar microfone'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalItem, styles.modalItemDanger]} onPress={leaveRoom}>
                <Icon name="exit-to-app" size={20} color={colors.danger} />
                <Text style={[styles.modalItemText, styles.modalItemDangerText]}>Sair da sala</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Modal>
      </LinearGradient>
    </LiveKitRoom>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  connectingText: { color: colors.textSecondary, marginTop: 16, fontSize: 14 },
  
  headerGradient: { paddingTop: 40, paddingBottom: 15, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  roomTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  roomIdText: { color: colors.primary, fontSize: 11, marginTop: 2 },
  settingsButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorTitle: { color: colors.danger, fontSize: 22, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
  errorMessage: { color: colors.textSecondary, fontSize: 14, marginTop: 10, textAlign: 'center' },
  retryButton: { marginTop: 20, borderRadius: 25, overflow: 'hidden', width: '100%' },
  retryButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backButton: { marginTop: 12, padding: 12 },
  backButtonText: { color: colors.primary, fontSize: 14 },
  
  seatsScroll: { maxHeight: 140, marginVertical: 10 },
  seatsContainer: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 10, gap: 10 },
  seatCard: { width: 85, borderRadius: 16, padding: 10, alignItems: 'center', overflow: 'hidden' },
  specialSeat: { borderWidth: 1, borderColor: colors.border },
  seatGradient: { width: '100%', alignItems: 'center', paddingVertical: 10, borderRadius: 14 },
  currentSeat: { borderWidth: 2, borderColor: colors.primary, borderRadius: 16 },
  currentSeatText: { color: colors.primary },
  seatAvatar: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  seatName: { color: colors.text, fontSize: 12, fontWeight: '500', textAlign: 'center' },
  occupantName: { color: colors.textSecondary, fontSize: 10, marginTop: 2 },
  micStatus: { position: 'absolute', bottom: 5, right: 5 },
  
  tabBar: { flexDirection: 'row', backgroundColor: colors.card, marginHorizontal: 16, marginTop: 16, borderRadius: 30, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 25, gap: 6 },
  activeTab: { backgroundColor: colors.primary },
  tabText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  activeTabText: { color: colors.text },
  
  chatList: { paddingHorizontal: 16, paddingBottom: 10, flex: 1 },
  chatMessage: { backgroundColor: colors.card, borderRadius: 16, padding: 12, marginBottom: 8, maxWidth: '85%' },
  myChatMessage: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  chatUserName: { color: colors.textSecondary, fontSize: 11 },
  chatText: { color: colors.text, fontSize: 14 },
  chatTime: { color: colors.textSecondary, fontSize: 9, marginTop: 4 },
  emptyChat: { color: colors.textSecondary, textAlign: 'center', padding: 40 },
  
  chatInputContainer: { flexDirection: 'row', padding: 12, backgroundColor: colors.card, gap: 8 },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 10, color: colors.text },
  sendButton: { borderRadius: 25, overflow: 'hidden' },
  sendButtonGradient: { width: 45, height: 45, justifyContent: 'center', alignItems: 'center' },
  
  infoContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  infoCard: { backgroundColor: colors.card, borderRadius: 20, padding: 16, gap: 8 },
  infoText: { color: colors.text, fontSize: 14 },
  
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalItemText: { color: colors.text, fontSize: 16, flex: 1 },
  modalItemDanger: { borderBottomWidth: 0 },
  modalItemDangerText: { color: colors.danger },
});
