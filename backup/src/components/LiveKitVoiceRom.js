/**
 * ============================================
 * FALOU - LIVEKIT VOICE ROOM (COMPONENTE)
 * ============================================
 * ✅ VERSÃO MODERNIZADA:
 * 1. Design com gradientes e cards elegantes
 * 2. Animações suaves na entrada
 * 3. Modo demonstração/simulação quando LiveKit não disponível
 * 4. Melhorias na permissão do microfone
 * 5. Interface moderna para cadeiras
 * 6. Chat com design moderno
 * ============================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, ActivityIndicator, Image, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Modal,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import condicional do LiveKit
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
  console.log('✅ LiveKit disponível');
} catch (e) {
  console.log('⚠️ LiveKit não disponível, usando modo demonstração');
  LiveKitAvailable = false;
}

import { auth } from '../../config/firebase';
import { getUserProfile } from '../services/firestore';
import { generateLiveKitToken, testBackend } from '../services/livekit';
import { ensureMicrophonePermission } from '../services/permissions';
import { colors } from '../utils/colors';

// Componente de áudio
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

export default function LiveKitVoiceRoom({ route, navigation }) {
  const { roomId, roomName: propRoomName } = route.params;
  const [token, setToken] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSeat, setCurrentSeat] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [participants, setParticipants] = useState([]);
  const [isLiveKitWorking, setIsLiveKitWorking] = useState(true);
  const flatListRef = useRef();

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Configuração das cadeiras
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
      Alert.alert('🎤 Permissão Necessária', 'Você precisa permitir o acesso ao microfone para entrar na sala de voz.');
      navigation.goBack();
      return;
    }
    
    const profile = await getUserProfile(auth.currentUser.uid);
    if (profile.success) {
      setUserProfile(profile.data);
      await connectToRoom();
    }
  };

  const connectToRoom = async () => {
    setIsConnecting(true);
    
    const backendWorking = await testBackend();
    
    if (!backendWorking || !LiveKitAvailable) {
      console.log('⚠️ LiveKit indisponível, entrando em modo demonstração');
      setIsLiveKitWorking(false);
      setIsConnecting(false);
      return;
    }
    
    const result = await generateLiveKitToken(
      roomId,
      userProfile?.nick || 'Usuário',
      auth.currentUser.uid
    );
    
    if (result.success) {
      setToken(result.token);
      setIsLiveKitWorking(true);
    } else {
      console.log('⚠️ Falha ao gerar token, entrando em modo demonstração');
      setIsLiveKitWorking(false);
    }
    setIsConnecting(false);
  };

  const leaveRoom = () => {
    navigation.goBack();
  };

  const handleSeatPress = (seatId) => {
    const seat = SEATS[seatId];
    const action = currentSeat === seatId ? 'sair da' : 'ocupar a';
    
    Alert.alert(
      seat.isSpecial ? '👑 Cadeira Especial' : '🪑 Cadeira',
      `Você quer ${action} cadeira ${seat.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: currentSeat === seatId ? 'Sair' : 'Ocupar', onPress: () => {
          if (currentSeat === seatId) {
            setCurrentSeat(null);
            Alert.alert('✅ Você saiu do palco');
          } else {
            setCurrentSeat(seatId);
            Alert.alert('✅ Você subiu ao palco', `Agora você está em ${seat.name}`);
            if (!isLiveKitWorking) {
              Alert.alert('🔊 Áudio em breve', 'O áudio ao vivo estará disponível em breve!');
            }
          }
        }}
      ]
    );
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      userId: auth.currentUser.uid,
      userName: userProfile?.nick || 'Usuário',
      userAvatar: userProfile?.avatarUrl,
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
    setChatInput('');
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    Alert.alert('Microfone', isMuted ? '🎤 Microfone ativado' : '🔇 Microfone desativado');
  };

  const renderSeat = ({ item, index }) => {
    const isOccupied = participants.length > index;
    const isCurrent = currentSeat === index;
    const isSpecial = item.isSpecial;
    
    if (isSpecial) {
      return (
        <LinearGradient
          colors={item.color || ['#6c63ff', '#4ecdc4']}
          style={[styles.seatCard, styles.specialSeat]}
        >
          <View style={styles.seatAvatar}>
            <Icon name={item.icon} size={30} color="#fff" />
          </View>
          <Text style={styles.seatName}>{item.name}</Text>
          <Text style={styles.occupantName}>Dono da sala</Text>
          <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent']} style={styles.specialBadge}>
            <Text style={styles.specialBadgeText}>👑</Text>
          </LinearGradient>
        </LinearGradient>
      );
    }
    
    return (
      <TouchableOpacity 
        style={[styles.seatCard, isCurrent && styles.currentSeat]} 
        onPress={() => handleSeatPress(index)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isCurrent ? [colors.primary, '#4ecdc4'] : ['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.05)']}
          style={styles.seatGradient}
        >
          <View style={styles.seatAvatar}>
            {isCurrent ? (
              <Icon name="microphone" size={30} color={colors.success} />
            ) : (
              <Icon name={item.icon} size={30} color={colors.textSecondary} />
            )}
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
        <View style={styles.chatMessageHeader}>
          <Text style={styles.chatUserName}>{item.userName}</Text>
          <Text style={styles.chatTime}>{item.timestamp}</Text>
        </View>
        <Text style={styles.chatText}>{item.text}</Text>
      </View>
    );
  };

  // Modo demonstração
  if (!isLiveKitWorking && !isConnecting) {
    return (
      <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
        <LinearGradient colors={[colors.card, 'transparent']} style={styles.headerGradient}>
          <View style={styles.header}>
            <View>
              <Text style={styles.roomId}>🎤 {propRoomName || roomId?.slice(0, 8) || 'Demo'}</Text>
              <Text style={styles.roomTime}>🎭 Modo Demonstração</Text>
              <Text style={styles.roomList}>Áudio ao vivo em breve!</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
              <Icon name="cog" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <Animated.ScrollView style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <LinearGradient colors={['rgba(255,230,109,0.15)', 'rgba(255,230,109,0.05)']} style={styles.demoWarning}>
            <Icon name="information" size={24} color={colors.warning} />
            <Text style={styles.demoWarningText}>
              Modo Demonstração - O áudio ao vivo estará disponível em breve!
            </Text>
          </LinearGradient>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seatsScroll}>
            <View style={styles.seatsContainer}>
              {SEATS.map((seat, idx) => (
                <View key={idx} style={{ width: 90 }}>
                  {renderSeat({ item: seat, index: idx })}
                </View>
              ))}
            </View>
          </ScrollView>

          <LinearGradient colors={['rgba(255,107,107,0.1)', 'transparent']} style={styles.warningContainer}>
            <Icon name="alert-circle" size={14} color={colors.warning} />
            <Text style={styles.warningText}>
              Mantenha a ordem e o respeito dentro do Falou. Comportamento inadequado resultará em banimento!
            </Text>
          </LinearGradient>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Pegar microfone', 'Clique em uma cadeira para falar')}>
              <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.05)']} style={styles.actionBtnGradient}>
                <Icon name="microphone" size={18} color={colors.primary} />
                <Text style={styles.actionBtnText}>Pegar microfone</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Convidar', `Compartilhe o ID: ${roomId}`)}>
              <LinearGradient colors={['rgba(78,205,196,0.2)', 'rgba(78,205,196,0.05)']} style={styles.actionBtnGradient}>
                <Icon name="account-plus" size={18} color="#4ecdc4" />
                <Text style={styles.actionBtnText}>Convidar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity style={[styles.tab, activeTab === 'chat' && styles.activeTab]} onPress={() => setActiveTab('chat')}>
              <Icon name="chat" size={16} color={activeTab === 'chat' ? colors.text : colors.textSecondary} />
              <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}> Conversa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'info' && styles.activeTab]} onPress={() => setActiveTab('info')}>
              <Icon name="information" size={16} color={activeTab === 'info' ? colors.text : colors.textSecondary} />
              <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}> Informações</Text>
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
                ListEmptyComponent={
                  <View style={styles.emptyChat}>
                    <Icon name="chat-outline" size={40} color={colors.textSecondary} />
                    <Text style={styles.emptyChatText}>Nenhuma mensagem ainda</Text>
                  </View>
                }
              />
              <LinearGradient colors={[colors.card, colors.background]} style={styles.chatInputWrapper}>
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
              </LinearGradient>
            </>
          ) : (
            <View style={styles.infoContainer}>
              <LinearGradient colors={[colors.card, colors.background]} style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Icon name="account-group" size={20} color={colors.primary} />
                  <Text style={styles.infoText}>Participantes ativos: 1</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="microphone" size={20} color={colors.success} />
                  <Text style={styles.infoText}>Áudio ao vivo (Em breve)</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="chat" size={20} color={colors.primary} />
                  <Text style={styles.infoText}>Chat da sala: Disponível</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="crown" size={20} color={colors.warning} />
                  <Text style={styles.infoText}>Cadeiras especiais disponíveis</Text>
                </View>
              </LinearGradient>
            </View>
          )}
        </Animated.ScrollView>

        <Modal visible={showSettings} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Configurações da Sala</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)}>
                  <Icon name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <TouchableOpacity style={styles.modalItem} onPress={() => Alert.alert('Informações', 'Funcionalidade em breve')}>
                  <Icon name="information" size={20} color={colors.primary} />
                  <Text style={styles.modalItemText}>Informações da sala</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalItem} onPress={toggleMute}>
                  <Icon name={isMuted ? "microphone-off" : "microphone"} size={20} color={colors.primary} />
                  <Text style={styles.modalItemText}>{isMuted ? 'Ativar microfone' : 'Desativar microfone'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalItem, styles.modalItemDanger]} onPress={leaveRoom}>
                  <Icon name="exit-to-app" size={20} color={colors.danger} />
                  <Text style={[styles.modalItemText, styles.modalItemDangerText]}>Sair da sala</Text>
                </TouchableOpacity>
              </ScrollView>
            </LinearGradient>
          </View>
        </Modal>
      </LinearGradient>
    );
  }

  // Tela de carregamento
  if (isConnecting) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.connectingText}>Conectando à sala...</Text>
      </View>
    );
  }

  // Modo LiveKit real
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
        {/* Header similar ao modo demo */}
        <LinearGradient colors={[colors.card, 'transparent']} style={styles.headerGradient}>
          <View style={styles.header}>
            <View>
              <Text style={styles.roomId}>🔴 {propRoomName || roomId?.slice(0, 8)}</Text>
              <Text style={styles.roomTime}>Ao vivo agora</Text>
              <Text style={styles.roomList}>{participants.length} pessoas online</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
              <Icon name="cog" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Conteúdo similar ao modo demo com participantes reais */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seatsScroll}>
          <View style={styles.seatsContainer}>
            {SEATS.map((seat, idx) => (
              <View key={idx} style={{ width: 90 }}>
                {renderSeat({ item: seat, index: idx })}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Restante do conteúdo igual ao modo demo */}
        <LinearGradient colors={['rgba(255,107,107,0.1)', 'transparent']} style={styles.warningContainer}>
          <Icon name="alert-circle" size={14} color={colors.warning} />
          <Text style={styles.warningText}>
            Mantenha a ordem e o respeito dentro do Falou. Comportamento inadequado resultará em banimento!
          </Text>
        </LinearGradient>

        {/* Botões e chat igual ao modo demo */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Pegar microfone', 'Clique em uma cadeira para falar')}>
            <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.05)']} style={styles.actionBtnGradient}>
              <Icon name="microphone" size={18} color={colors.primary} />
              <Text style={styles.actionBtnText}>Pegar microfone</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Convidar', 'Compartilhe o ID da sala')}>
            <LinearGradient colors={['rgba(78,205,196,0.2)', 'rgba(78,205,196,0.05)']} style={styles.actionBtnGradient}>
              <Icon name="account-plus" size={18} color="#4ecdc4" />
              <Text style={styles.actionBtnText}>Convidar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tab, activeTab === 'chat' && styles.activeTab]} onPress={() => setActiveTab('chat')}>
            <Icon name="chat" size={16} color={activeTab === 'chat' ? colors.text : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}> Conversa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'info' && styles.activeTab]} onPress={() => setActiveTab('info')}>
            <Icon name="information" size={16} color={activeTab === 'info' ? colors.text : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}> Informações</Text>
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
              ListEmptyComponent={
                <View style={styles.emptyChat}>
                  <Icon name="chat-outline" size={40} color={colors.textSecondary} />
                  <Text style={styles.emptyChatText}>Nenhuma mensagem ainda</Text>
                </View>
              }
            />
            <LinearGradient colors={[colors.card, colors.background]} style={styles.chatInputWrapper}>
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
            </LinearGradient>
          </>
        ) : (
          <View style={styles.infoContainer}>
            <LinearGradient colors={[colors.card, colors.background]} style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Icon name="account-group" size={20} color={colors.primary} />
                <Text style={styles.infoText}>Participantes: {participants.length}</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="microphone" size={20} color={colors.success} />
                <Text style={styles.infoText}>Áudio ao vivo ativo</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="chat" size={20} color={colors.primary} />
                <Text style={styles.infoText}>Chat da sala: Disponível</Text>
              </View>
            </LinearGradient>
          </View>
        )}

        <Modal visible={showSettings} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Configurações da Sala</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)}>
                  <Icon name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <TouchableOpacity style={styles.modalItem} onPress={() => Alert.alert('Informações', 'Em breve')}>
                  <Icon name="information" size={20} color={colors.primary} />
                  <Text style={styles.modalItemText}>Informações da sala</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalItem} onPress={toggleMute}>
                  <Icon name={isMuted ? "microphone-off" : "microphone"} size={20} color={colors.primary} />
                  <Text style={styles.modalItemText}>{isMuted ? 'Ativar microfone' : 'Desativar microfone'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalItem, styles.modalItemDanger]} onPress={leaveRoom}>
                  <Icon name="exit-to-app" size={20} color={colors.danger} />
                  <Text style={[styles.modalItemText, styles.modalItemDangerText]}>Sair da sala</Text>
                </TouchableOpacity>
              </ScrollView>
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
  
  // Header
  headerGradient: { paddingTop: 40, paddingBottom: 15, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  roomId: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  roomTime: { color: colors.primary, fontSize: 12, marginTop: 2 },
  roomList: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  settingsButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  
  // Cadeiras
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
  specialBadge: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 8, paddingVertical: 4, borderBottomLeftRadius: 12 },
  specialBadgeText: { color: '#fff', fontSize: 12 },
  micStatus: { position: 'absolute', bottom: 5, right: 5 },
  
  // Aviso
  demoWarning: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10, padding: 12, borderRadius: 12, gap: 12 },
  demoWarningText: { color: colors.warning, fontSize: 12, flex: 1 },
  warningContainer: { flexDirection: 'row', marginHorizontal: 16, marginTop: 10, padding: 12, borderRadius: 12, gap: 8 },
  warningText: { color: colors.textSecondary, fontSize: 11, flex: 1 },
  
  // Botões de ação
  actionButtons: { flexDirection: 'row', justifyContent: 'center', marginHorizontal: 16, marginTop: 16, gap: 12 },
  actionBtn: { flex: 1, borderRadius: 25, overflow: 'hidden' },
  actionBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
  actionBtnText: { color: colors.text, fontSize: 13, fontWeight: '500' },
  
  // Abas
  tabBar: { flexDirection: 'row', backgroundColor: colors.card, marginHorizontal: 16, marginTop: 16, borderRadius: 30, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 25, gap: 6 },
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
  emptyChatText: { color: colors.textSecondary, fontSize: 14 },
  
  // Input chat
  chatInputWrapper: { borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' },
  chatInputContainer: { flexDirection: 'row', padding: 12, gap: 8 },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 10, color: colors.text },
  sendButton: { borderRadius: 25, overflow: 'hidden' },
  sendButtonGradient: { width: 45, height: 45, justifyContent: 'center', alignItems: 'center' },
  
  // Informações
  infoContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  infoCard: { borderRadius: 20, padding: 16, gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoText: { color: colors.text, fontSize: 14, flex: 1 },
  
  // Modal
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalItemText: { color: colors.text, fontSize: 16, flex: 1 },
  modalItemDanger: { borderBottomWidth: 0 },
  modalItemDangerText: { color: colors.danger },
});