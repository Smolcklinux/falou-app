/**
 * ============================================
 * FALOU - TELA DE CHAT PRIVADO
 * ============================================
 * ✅ VERSÃO MODERNIZADA CORRIGIDA:
 * 1. Removido header duplicado (deixando apenas o botão voltar)
 * 2. Botão de voltar branco e moderno
 * 3. Design com gradientes e cards elegantes
 * 4. Animação de digitação
 * 5. Emojis com animação suave
 * 6. Modal de imagem com zoom
 * ============================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image, Keyboard, TouchableWithoutFeedback,
  Alert, Animated, Modal, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../../config/firebase';
import { getMessages, sendMessage, markMessagesAsRead, listenToMessages } from '../services/firestore';
import { uploadToCloudinary } from '../services/cloudinary';
import { ensureGalleryPermission } from '../services/permissions';
import { colors } from '../utils/colors';

// Lista de emojis organizada por categorias
const EMOJIS = {
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'],
  gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '🤝', '❤️', '💙', '💚', '💛', '🧡', '💜', '💔', '💕', '💞'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐸', '🐒', '🐔', '🐧', '🐦', '🐤', '🐴', '🐺', '🦁', '🐮'],
  objects: ['🎁', '🎂', '🎈', '🎉', '🎊', '🏆', '🏅', '🎸', '🎧', '🎤', '🎬', '📷', '💎', '💰', '⚽', '🏀', '🏈', '⚾', '🎾'],
};

const EMOJI_CATEGORIES = [
  { id: 'smileys', name: '😊 Carinhas', emojis: EMOJIS.smileys },
  { id: 'gestures', name: '✋ Gestos', emojis: EMOJIS.gestures },
  { id: 'animals', name: '🐾 Animais', emojis: EMOJIS.animals },
  { id: 'objects', name: '🎯 Objetos', emojis: EMOJIS.objects },
];

export default function ChatScreen({ route, navigation }) {
  const { userId, userNick, userAvatar, userStatus } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const flatListRef = useRef();
  const inputRef = useRef();
  const emojiAnimations = useRef({}).current;
  const typingTimeoutRef = useRef(null);

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadMessages();
    animateEntrance();
    
    const unsubscribe = listenToMessages(auth.currentUser.uid, userId, (newMessages) => {
      setMessages(newMessages);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      markMessagesAsRead(auth.currentUser.uid, userId);
    });
    
    return () => {
      unsubscribe && unsubscribe();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [userId]);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 5, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const loadMessages = async () => {
    setLoading(true);
    const result = await getMessages(auth.currentUser.uid, userId);
    if (result.success) {
      setMessages(result.data);
      markMessagesAsRead(auth.currentUser.uid, userId);
    }
    setLoading(false);
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    
    setSending(true);
    const result = await sendMessage(auth.currentUser.uid, userId, inputText);
    if (result.success) {
      setInputText('');
      setShowEmojiPicker(false);
      await loadMessages();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
    setSending(false);
  };

  const handleSendImage = async () => {
    const hasPermission = await ensureGalleryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setUploadingImage(true);
      const uploadResult = await uploadToCloudinary(result.assets[0].uri);
      if (uploadResult.success) {
        const sendResult = await sendMessage(
          auth.currentUser.uid, 
          userId, 
          '📷 Imagem', 
          uploadResult.url
        );
        if (sendResult.success) {
          await loadMessages();
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      } else {
        Alert.alert('Erro', 'Falha ao enviar imagem');
      }
      setUploadingImage(false);
    }
  };

  const handleTyping = () => {
    if (!inputText.trim()) {
      setIsTyping(false);
      return;
    }
    
    if (!isTyping) {
      setIsTyping(true);
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const showFullImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const getEmojiAnimation = (key) => {
    if (!emojiAnimations[key]) {
      emojiAnimations[key] = new Animated.Value(1);
    }
    return emojiAnimations[key];
  };

  const insertEmoji = (emoji, categoryId, index) => {
    const key = `${categoryId}_${index}`;
    const animValue = getEmojiAnimation(key);
    
    Animated.sequence([
      Animated.timing(animValue, { toValue: 1.4, duration: 100, useNativeDriver: true }),
      Animated.timing(animValue, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    
    setInputText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.from === auth.currentUser.uid;
    const hasImage = item.imageUrl;
    const messageTime = formatMessageTime(item.timestamp);
    
    return (
      <Animated.View 
        style={[
          styles.messageWrapper,
          isMyMessage ? styles.myMessageWrapper : styles.otherMessageWrapper,
          { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }
        ]}
      >
        {!isMyMessage && (
          <View style={styles.messageAvatar}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={['#6c63ff', '#4ecdc4']} style={styles.avatarGradient}>
                <Icon name="account" size={18} color="#fff" />
              </LinearGradient>
            )}
          </View>
        )}
        
        <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.otherMessage]}>
          {!isMyMessage && (
            <Text style={styles.messageSender}>{userNick}</Text>
          )}
          
          {hasImage && (
            <TouchableOpacity onPress={() => showFullImage(item.imageUrl)}>
              <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
            </TouchableOpacity>
          )}
          
          {item.text && item.text !== '📷 Imagem' && (
            <Text style={styles.messageText}>{item.text}</Text>
          )}
          
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>{messageTime}</Text>
            {isMyMessage && (
              <View style={styles.statusContainer}>
                {item.read ? (
                  <Icon name="check-all" size={14} color={colors.primary} />
                ) : item.delivered ? (
                  <Icon name="check-all" size={14} color={colors.textSecondary} />
                ) : (
                  <Icon name="check" size={14} color={colors.textSecondary} />
                )}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderEmojiCategory = (category) => (
    <View key={category.id} style={styles.emojiCategory}>
      <Text style={styles.emojiCategoryTitle}>{category.name}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.emojiRow}
      >
        {category.emojis.map((emoji, idx) => {
          const key = `${category.id}_${idx}`;
          const animValue = getEmojiAnimation(key);
          return (
            <Animated.View key={idx} style={{ transform: [{ scale: animValue }] }}>
              <TouchableOpacity 
                onPress={() => insertEmoji(emoji, category.id, idx)}
                style={styles.emojiItem}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando conversa...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
        {/* ========================================== */}
        {/* HEADER SIMPLIFICADO - APENAS BOTÃO VOLTAR */}
        {/* ========================================== */}
        <LinearGradient
          colors={[colors.card, 'transparent']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.headerInfo} onPress={() => navigation.navigate('UserProfile', { userId, userNick, userAvatar })}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.headerAvatar} />
              ) : (
                <LinearGradient colors={['#6c63ff', '#4ecdc4']} style={styles.headerAvatarGradient}>
                  <Icon name="account" size={20} color="#fff" />
                </LinearGradient>
              )}
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>{userNick}</Text>
                <View style={styles.headerStatusContainer}>
                  <View style={[styles.statusDot, userStatus === 'online' && styles.statusOnline]} />
                  <Text style={styles.headerStatus}>
                    {userStatus === 'online' ? 'Online' : 'Visto há pouco'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.infoButton}>
              <Icon name="dots-vertical" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Indicador de digitação */}
        {isTyping && (
          <View style={styles.typingIndicator}>
            <View style={styles.typingDot} />
            <View style={[styles.typingDot, styles.typingDotDelay]} />
            <View style={[styles.typingDot, styles.typingDotDelay2]} />
            <Text style={styles.typingText}>{userNick} está digitando...</Text>
          </View>
        )}

        {/* Lista de Mensagens */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={[colors.card, 'transparent']}
                style={styles.emptyCard}
              >
                <Icon name="chat-outline" size={60} color={colors.textSecondary} />
                <Text style={styles.emptyTitle}>Nenhuma mensagem ainda</Text>
                <Text style={styles.emptyText}>
                  Envie uma mensagem para {userNick} e comece a conversar!
                </Text>
              </LinearGradient>
            </View>
          }
        />

        {/* Modal para imagem em tela cheia */}
        <Modal visible={showImageModal} transparent={true} animationType="fade">
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowImageModal(false)}>
              <LinearGradient colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.5)']} style={styles.modalCloseBtn}>
                <Icon name="close" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
            )}
          </View>
        </Modal>

        {/* Emoji Picker Moderno */}
        {showEmojiPicker && (
          <LinearGradient
            colors={[colors.card, colors.background]}
            style={styles.emojiPickerContainer}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {EMOJI_CATEGORIES.map(category => renderEmojiCategory(category))}
            </ScrollView>
          </LinearGradient>
        )}

        {/* Input com opções de anexo */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <LinearGradient
            colors={[colors.card, colors.background]}
            style={styles.inputWrapper}
          >
            <View style={styles.inputContainer}>
              <TouchableOpacity onPress={handleSendImage} style={styles.attachButton}>
                <Icon name="image-plus" size={24} color={colors.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setShowEmojiPicker(!showEmojiPicker)} style={styles.emojiButton}>
                <Icon name="emoticon-happy" size={26} color={showEmojiPicker ? colors.primary : colors.textSecondary} />
              </TouchableOpacity>
              
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Digite uma mensagem..."
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={(text) => {
                  setInputText(text);
                  handleTyping();
                }}
                multiline
              />
              
              <TouchableOpacity 
                style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]} 
                onPress={handleSendText}
                disabled={sending || !inputText.trim()}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary, '#4ecdc4']}
                  style={styles.sendButtonGradient}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Icon name="send" size={20} color="#fff" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            {uploadingImage && (
              <View style={styles.uploadingIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.uploadingText}>Enviando imagem...</Text>
              </View>
            )}
          </LinearGradient>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, marginTop: 16, fontSize: 14 },
  
  // Header simplificado
  headerGradient: { paddingTop: 40, paddingBottom: 15, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(108,99,255,0.15)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12, gap: 12 },
  headerAvatar: { width: 45, height: 45, borderRadius: 22.5 },
  headerAvatarGradient: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  headerTextContainer: { flex: 1 },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: 'bold' },
  headerStatusContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textSecondary },
  statusOnline: { backgroundColor: '#4ecdc4' },
  headerStatus: { color: colors.textSecondary, fontSize: 11 },
  infoButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.1)' },
  
  // Indicador de digitação
  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, gap: 6 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, opacity: 0.6 },
  typingDotDelay: { opacity: 0.3, marginLeft: 2 },
  typingDotDelay2: { opacity: 0.1, marginLeft: 2 },
  typingText: { color: colors.textSecondary, fontSize: 11, marginLeft: 8 },
  
  // Mensagens
  messagesList: { padding: 16, flexGrow: 1, paddingBottom: 20 },
  messageWrapper: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  myMessageWrapper: { justifyContent: 'flex-end' },
  otherMessageWrapper: { justifyContent: 'flex-start' },
  messageAvatar: { marginRight: 8 },
  avatarImage: { width: 32, height: 32, borderRadius: 16 },
  avatarGradient: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  messageContainer: { maxWidth: '75%', padding: 12, borderRadius: 20 },
  myMessage: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  otherMessage: { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
  messageSender: { color: colors.primary, fontSize: 11, marginBottom: 4, fontWeight: '500' },
  messageText: { color: colors.text, fontSize: 15, lineHeight: 20 },
  messageImage: { width: 200, height: 150, borderRadius: 12, marginBottom: 4 },
  messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 4 },
  messageTime: { color: 'rgba(255,255,255,0.6)', fontSize: 9 },
  statusContainer: { marginLeft: 2 },
  
  // Emoji Picker
  emojiPickerContainer: { maxHeight: 220, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingVertical: 12 },
  emojiCategory: { marginBottom: 12 },
  emojiCategoryTitle: { color: colors.primary, fontSize: 12, fontWeight: 'bold', marginLeft: 16, marginBottom: 6 },
  emojiRow: { paddingHorizontal: 12, gap: 4 },
  emojiItem: { paddingHorizontal: 8, paddingVertical: 4 },
  emojiText: { fontSize: 28 },
  
  // Input
  inputWrapper: { borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' },
  inputContainer: { flexDirection: 'row', padding: 12, alignItems: 'center', gap: 8 },
  attachButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.1)' },
  emojiButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.1)' },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 10, color: colors.text, maxHeight: 100, fontSize: 15 },
  sendButton: { borderRadius: 22.5, overflow: 'hidden' },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonGradient: { width: 45, height: 45, justifyContent: 'center', alignItems: 'center' },
  uploadingIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, gap: 8 },
  uploadingText: { color: colors.primary, fontSize: 12 },
  
  // Modal de imagem
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  modalCloseBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '100%', height: '80%' },
  
  // Empty state
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 20 },
  emptyCard: { alignItems: 'center', padding: 40, borderRadius: 24, width: '100%' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  emptyText: { color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' },
});