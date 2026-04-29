/**
 * ============================================
 * FALOU - COMPONENTE AGORA VOICE ROOM
 * ============================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  ScrollView, FlatList, TextInput, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../../config/firebase';
import { generateAgoraToken, AGORA_APP_ID } from '../services/agora';
import { getUserProfile, sendRoomMessage, listenToRoomMessages, getRoomSeats } from '../services/firestore/index';
import { requestMicrophonePermission } from '../services/permissions';
import { colors } from '../utils/colors';

import RtcEngine from 'react-native-agora';

const SEATS_COUNT = 10;

export default function AgoraVoiceRoom({ navigation, route }) {
  const { roomId, roomName, roomNumericId } = route.params;
  
  const [engine, setEngine] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [muted, setMuted] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [seats, setSeats] = useState(Array(SEATS_COUNT).fill(null));
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState([]);
  
  const flatListRef = useRef();
  const unsubscribeMessages = useRef(null);

  useEffect(() => {
    loadData();
    return () => {
      if (unsubscribeMessages.current) unsubscribeMessages.current();
      if (engine) {
        engine.leaveChannel();
        engine.destroy();
      }
    };
  }, []);

  const loadData = async () => {
    // Aguardar um pouco para garantir inicialização
    await new Promise(resolve => setTimeout(resolve, 500));
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
    await initAgora();
  };

  const initAgora = async () => {
    try {
      const rtcEngine = await RtcEngine.create(AGORA_APP_ID);
      setEngine(rtcEngine);
      
      rtcEngine.addListener('JoinChannelSuccess', () => {
        console.log('✅ Entrou na sala');
        setConnected(true);
        setConnecting(false);
      });
      
      rtcEngine.addListener('UserJoined', (uid) => {
        console.log('👤 Usuário entrou:', uid);
        setParticipants(prev => [...prev, { uid }]);
      });
      
      rtcEngine.addListener('UserOffline', (uid) => {
        console.log('👋 Usuário saiu:', uid);
        setParticipants(prev => prev.filter(p => p.uid !== uid));
      });
      
      await rtcEngine.setChannelProfile(1);
      await rtcEngine.setClientRole(1);
      await rtcEngine.enableAudio();
      
      const uid = parseInt(auth.currentUser.uid.slice(-6), 36) || Math.floor(Math.random() * 100000);
      const tokenResult = await generateAgoraToken(roomId, uid, 'publisher');
      
      await rtcEngine.joinChannel(
        tokenResult.success ? tokenResult.token : null,
        roomId,
        null,
        uid
      );
      
      loadMessages();
      loadSeats();
      
    } catch (error) {
      console.log('❌ Erro Agora:', error);
      Alert.alert('Erro', 'Não foi possível conectar');
      setConnecting(false);
    }
  };

  const toggleMute = async () => {
    if (engine) {
      const newMuted = !muted;
      await engine.muteLocalAudioStream(newMuted);
      setMuted(newMuted);
    }
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
    await sendRoomMessage(roomId, auth.currentUser.uid, userProfile?.nick, userProfile?.avatarUrl, chatInput);
    setChatInput('');
  };

  const renderSeat = (seat, index) => {
    const isOccupied = seat !== null;
    const isCurrentUser = seat?.uid === auth.currentUser.uid;
    
    return (
      <TouchableOpacity key={index} style={[styles.seat, isOccupied && styles.seatOccupied, isCurrentUser && styles.seatCurrent]}>
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
        {!isMyMessage && <Text style={styles.messageSender}>{item.userName}</Text>}
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

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
      <LinearGradient colors={[colors.card, 'transparent']} style={styles.roomHeader}>
        <View style={styles.roomHeaderContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.roomHeaderInfo}>
            <Text style={styles.roomTitle}>{roomName}</Text>
            {roomNumericId && <Text style={styles.roomId}>ID: {roomNumericId}</Text>}
          </View>
          <View style={[styles.statusDot, connected && styles.statusConnected]} />
        </View>
      </LinearGradient>

      <View style={styles.audioControls}>
        <TouchableOpacity style={styles.audioButton} onPress={toggleMute}>
          <LinearGradient colors={muted ? ['#ff6b6b', '#ee5a52'] : [colors.primary, '#4ecdc4']} style={styles.audioButtonGradient}>
            <Icon name={muted ? "microphone-off" : "microphone"} size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.audioButtonText}>{muted ? 'Microfone desligado' : 'Microfone ligado'}</Text>
      </View>

      <ScrollView>
        <View style={styles.seatsGrid}>
          {seats.map((seat, idx) => renderSeat(seat, idx))}
        </View>
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={{ maxHeight: 150 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
          <View style={styles.inputContainer}>
            <TextInput style={styles.chatInput} placeholder="Digite uma mensagem..." placeholderTextColor={colors.textSecondary} value={chatInput} onChangeText={setChatInput} />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.sendButtonGradient}>
                <Icon name="send" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, marginTop: 16, fontSize: 14 },
  roomHeader: { paddingTop: 40, paddingBottom: 15 },
  roomHeaderContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 16 },
  roomHeaderInfo: { flex: 1 },
  roomTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  roomId: { color: colors.primary, fontSize: 11, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textSecondary },
  statusConnected: { backgroundColor: '#4ecdc4' },
  audioControls: { alignItems: 'center', marginVertical: 20, gap: 8 },
  audioButton: { borderRadius: 50, overflow: 'hidden' },
  audioButtonGradient: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  audioButtonText: { color: colors.textSecondary, fontSize: 12 },
  seatsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 16, gap: 12 },
  seat: { width: '18%', aspectRatio: 1, backgroundColor: colors.card, borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 8, borderWidth: 1, borderColor: colors.border },
  seatOccupied: { backgroundColor: 'rgba(108,99,255,0.15)', borderColor: colors.primary },
  seatCurrent: { borderWidth: 2, borderColor: '#4ecdc4' },
  seatAvatar: { width: 40, height: 40, borderRadius: 20 },
  seatAvatarGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  seatName: { color: colors.text, fontSize: 10, marginTop: 4, textAlign: 'center' },
  currentUserBadge: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ecdc4' },
  seatEmpty: { alignItems: 'center' },
  seatEmptyText: { color: colors.textSecondary, fontSize: 9, marginTop: 4 },
  chatContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  inputContainer: { flexDirection: 'row', padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: colors.border },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 10, color: colors.text },
  sendButton: { borderRadius: 25, overflow: 'hidden' },
  sendButtonGradient: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  messageBubble: { maxWidth: '80%', padding: 10, borderRadius: 16, marginBottom: 8 },
  myMessage: { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  otherMessage: { backgroundColor: colors.card, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageSender: { color: '#4ecdc4', fontSize: 11, marginBottom: 2 },
  messageText: { color: colors.text, fontSize: 14 },
});
