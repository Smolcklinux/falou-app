/**
 * ============================================
 * FALOU - COMPONENTE LIVEKIT VOICE ROOM
 * Áudio ao vivo com LiveKit
 * ============================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, FlatList,
  TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../../config/firebase';
import { generateLiveKitToken } from '../services/livekit';
import { getUserProfile, addVisitor, sendRoomMessage, listenToRoomMessages, updateRoomSeats, getRoomSeats } from '../services/firestore/index';
import { requestMicrophonePermission } from '../services/permissions';
import { colors } from '../utils/colors';

// LiveKit (será importado quando instalado)
let LiveKitRoom, Room, useParticipant, useTrack, Track;
try {
  const LiveKit = require('livekit-react-native');
  LiveKitRoom = LiveKit.LiveKitRoom;
  Room = LiveKit.Room;
  useParticipant = LiveKit.useParticipant;
  useTrack = LiveKit.useTrack;
  Track = LiveKit.Track;
} catch (e) {
  console.log('⚠️ LiveKit não instalado, modo simulação:', e.message);
}

const SEATS_COUNT = 10;

export default function LiveKitVoiceRoom({ navigation, route }) {
  const { roomId, roomName, roomNumericId } = route.params;
  
  const [liveKitActive, setLiveKitActive] = useState(false);
  const [token, setToken] = useState(null);
  const [connecting, setConnecting] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [seats, setSeats] = useState(Array(SEATS_COUNT).fill(null));
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  
  const flatListRef = useRef();
  const unsubscribeMessages = useRef(null);
  const socketRef = useRef(null);
  const localParticipantRef = useRef(null);

  useEffect(() => {
    loadData();
    return () => {
      if (unsubscribeMessages.current) unsubscribeMessages.current();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const loadData = async () => {
    const profile = await getUserProfile(auth.currentUser.uid);
    if (profile.success) setUserProfile(profile.data);
    
    await checkPermissionsAndConnect();
  };

  const checkPermissionsAndConnect = async () => {
    const hasMic = await requestMicrophonePermission();
    if (!hasMic) {
      Alert.alert('Permissão Necessária', 'O app precisa do microfone para funcionar', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      setConnecting(false);
      return;
    }
    
    await connectToLiveKit();
  };

  const connectToLiveKit = async () => {
    setConnecting(true);
    
    try {
      const result = await generateLiveKitToken(
        roomId,
        userProfile?.nick || 'Usuário',
        auth.currentUser.uid,
        { avatar: userProfile?.avatarUrl }
      );
      
      if (result.success) {
        setToken(result.token);
        setLiveKitActive(true);
        console.log('✅ Conectado ao LiveKit');
      } else {
        console.log('⚠️ LiveKit offline:', result.error);
        simulateMode();
      }
    } catch (error) {
      console.log('⚠️ Erro LiveKit:', error.message);
      simulateMode();
    }
    
    setConnecting(false);
  };

  const simulateMode = () => {
    setLiveKitActive(false);
    console.log('🎤 Modo simulação ativo');
    loadMessages();
    loadSeats();
  };

  const loadMessages = async () => {
    const result = await listenToRoomMessages(roomId, (newMessages) => {
      setMessages(newMessages);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    unsubscribeMessages.current = result;
  };

  const loadSeats = async () => {
    const result = await getRoomSeats(roomId);
    if (result.success) setSeats(result.seats);
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    
    await sendRoomMessage(
      roomId,
      auth.currentUser.uid,
      userProfile?.nick,
      userProfile?.avatarUrl,
      chatInput
    );
    setChatInput('');
  };

  const renderSeat = (seat, index) => {
    const isOccupied = seat !== null;
    const isCurrentUser = seat?.uid === auth.currentUser.uid;
    
    return (
      <TouchableOpacity 
        key={index}
        style={[styles.seat, isOccupied && styles.seatOccupied, isCurrentUser && styles.seatCurrent]}
        onPress={() => {
          if (isOccupied && seat.uid !== auth.currentUser.uid) {
            navigation.navigate('UserProfile', { userId: seat.uid, userNick: seat.nick });
          }
        }}
      >
        {isOccupied ? (
          <>
            {seat.avatar ? (
              <Image source={{ uri: seat.avatar }} style={styles.seatAvatar} />
            ) : (
              <LinearGradient colors={['#6c63ff', '#4ecdc4']} style={styles.seatAvatarGradient}>
                <Icon name="account" size={16} color="#fff" />
              </LinearGradient>
            )}
            <Text style={styles.seatName} numberOfLines={1}>{seat.nick}</Text>
            {isCurrentUser && <View style={styles.currentUserBadge} />}
          </>
        ) : (
          <View style={styles.seatEmpty}>
            <Icon name="seat-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.seatEmptyText}>Cadeira {index + 1}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.userId === auth.currentUser.uid;
    
    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
        {!isMyMessage && (
          <Text style={styles.messageSender}>{item.userName}</Text>
        )}
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.messageTime}>
          {item.timestamp?.toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' }) || ''}
        </Text>
      </View>
    );
  };

  const ConnectedContent = () => (
    <View style={styles.roomContainer}>
      <LinearGradient colors={[colors.card, 'transparent']} style={styles.roomHeader}>
        <View style={styles.roomHeaderContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.roomHeaderInfo}>
            <Text style={styles.roomTitle}>{roomName}</Text>
            {roomNumericId && (
              <Text style={styles.roomId}>ID: {roomNumericId}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => setShowParticipants(!showParticipants)}>
            <Icon name="account-group" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {!liveKitActive && (
        <View style={styles.simulateBadge}>
          <Icon name="information" size={14} color={colors.warning} />
          <Text style={styles.simulateBadgeText}>Modo demonstração - Conecte-se ao LiveKit</Text>
        </View>
      )}

      <ScrollView style={styles.contentContainer}>
        <View style={styles.seatsGrid}>
          {seats.map((seat, idx) => renderSeat(seat, idx))}
        </View>

        <View style={styles.roomStats}>
          <View style={styles.statsItem}>
            <Icon name="account-group" size={16} color={colors.primary} />
            <Text style={styles.statsText}>{seats.filter(s => s).length}/10 online</Text>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={() => {
            Alert.alert('Compartilhar', `ID da sala: ${roomNumericId}\nCompartilhe com seus amigos!`);
          }}>
            <Icon name="share-variant" size={16} color={colors.primary} />
            <Text style={styles.shareText}>Compartilhar ID</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
          
          <View style={styles.inputContainer}>
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
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  if (connecting) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Conectando à sala...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
      {liveKitActive && token ? (
        <LiveKitRoom 
          serverUrl="wss://falou-voice-bschu9m4.livekit.cloud"
          token={token}
          onConnected={() => console.log('✅ LiveKit conectado')}
          onDisconnected={() => {
            console.log('⚠️ LiveKit desconectado');
            setLiveKitActive(false);
          }}
        >
          <ConnectedContent />
        </LiveKitRoom>
      ) : (
        <ConnectedContent />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, marginTop: 16, fontSize: 14 },
  roomContainer: { flex: 1 },
  roomHeader: { paddingTop: 40, paddingBottom: 15 },
  roomHeaderContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 16 },
  roomHeaderInfo: { flex: 1 },
  roomTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  roomId: { color: colors.primary, fontSize: 11, marginTop: 2 },
  simulateBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,230,109,0.1)', paddingVertical: 8, marginHorizontal: 20, marginTop: 10, borderRadius: 20 },
  simulateBadgeText: { color: colors.warning, fontSize: 11 },
  contentContainer: { flex: 1, paddingHorizontal: 16 },
  seatsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  seat: { width: '18%', aspectRatio: 1, backgroundColor: colors.card, borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 8, borderWidth: 1, borderColor: colors.border },
  seatOccupied: { backgroundColor: 'rgba(108,99,255,0.15)', borderColor: colors.primary },
  seatCurrent: { borderWidth: 2, borderColor: '#4ecdc4' },
  seatAvatar: { width: 40, height: 40, borderRadius: 20 },
  seatAvatarGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  seatName: { color: colors.text, fontSize: 10, marginTop: 4, textAlign: 'center' },
  currentUserBadge: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ecdc4' },
  seatEmpty: { alignItems: 'center' },
  seatEmptyText: { color: colors.textSecondary, fontSize: 9, marginTop: 4 },
  roomStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingHorizontal: 8, paddingVertical: 12, backgroundColor: colors.card, borderRadius: 16, marginBottom: 20 },
  statsItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statsText: { color: colors.text, fontSize: 13 },
  shareButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(108,99,255,0.1)', borderRadius: 20 },
  shareText: { color: colors.primary, fontSize: 12, fontWeight: '500' },
  chatContainer: { flex: 1, maxHeight: 200 },
  chatList: { paddingHorizontal: 16, paddingVertical: 8 },
  messageBubble: { maxWidth: '80%', padding: 10, borderRadius: 16, marginBottom: 8 },
  myMessage: { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  otherMessage: { backgroundColor: colors.card, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageSender: { color: '#4ecdc4', fontSize: 11, marginBottom: 2 },
  messageText: { color: colors.text, fontSize: 14 },
  messageTime: { color: 'rgba(255,255,255,0.5)', fontSize: 9, textAlign: 'right', marginTop: 4 },
  inputContainer: { flexDirection: 'row', padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: colors.border },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 10, color: colors.text },
  sendButton: { borderRadius: 25, overflow: 'hidden' },
  sendButtonGradient: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }
});
