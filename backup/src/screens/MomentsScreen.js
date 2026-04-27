/**
 * ============================================
 * FALOU - TELA DE MOMENTOS (FEED SOCIAL)
 * ============================================
 * ✅ VERSÃO MODERNIZADA:
 * 1. Design com gradientes e cards elegantes
 * 2. Animações suaves ao curtir
 * 3. Like com atualização otimista
 * 4. Modal de criação com gradiente
 * 5. Stories no topo (em breve)
 * 6. Layout responsivo
 * ============================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator, Image,
  RefreshControl, Dimensions, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../../config/firebase';
import { 
  getUserProfile, getMoments, createMoment, likeMoment, 
  getFollowingMoments, getPopularMoments
} from '../services/firestore';
import { pickAndUploadImage } from '../services/cloudinary';
import { colors } from '../utils/colors';

const { width, height } = Dimensions.get('window');

// Stories mockados (em breve serão dinâmicos)
const STORIES = [
  { id: 1, name: 'Seu story', avatar: null, isAdd: true },
  { id: 2, name: 'Ana Silva', avatar: null, color: ['#6c63ff', '#4ecdc4'] },
  { id: 3, name: 'João Souza', avatar: null, color: ['#f093fb', '#f5576c'] },
  { id: 4, name: 'Maria Santos', avatar: null, color: ['#4facfe', '#00f2fe'] },
];

export default function MomentsScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('seguindo');
  
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;

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
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    const profile = await getUserProfile(auth.currentUser.uid);
    if (profile.success) {
      setUserProfile(profile.data);
    }
    await loadMoments();
    setLoading(false);
  };

  const loadMoments = async () => {
    let result;
    if (activeTab === 'seguindo') {
      result = await getFollowingMoments(auth.currentUser.uid);
    } else {
      result = await getPopularMoments();
    }
    if (result.success) {
      setMoments(result.data);
    }
  };

  const handleAddImage = async () => {
    setUploadingImage(true);
    const result = await pickAndUploadImage();
    if (result.success) {
      setPostImage(result.url);
    } else if (result.error !== 'Nenhuma imagem selecionada') {
      Alert.alert('Erro', result.error);
    }
    setUploadingImage(false);
  };

  const handleCreatePost = async () => {
    if (!postText.trim() && !postImage) {
      Alert.alert('Erro', 'Digite algo ou adicione uma imagem');
      return;
    }

    setSubmitting(true);
    const result = await createMoment(
      auth.currentUser.uid,
      userProfile?.nick,
      postText,
      userProfile?.avatarUrl,
      postImage
    );
    
    if (result.success) {
      setPostText('');
      setPostImage(null);
      setModalVisible(false);
      await loadMoments();
      Alert.alert('Sucesso', 'Momento publicado!');
    } else {
      Alert.alert('Erro', result.error);
    }
    setSubmitting(false);
  };

  // Like com animação
  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(heartAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleLike = async (momentId, currentLikes) => {
    const hasLiked = currentLikes?.includes(auth.currentUser.uid) || false;
    
    // Animação do coração
    if (!hasLiked) animateHeart();
    
    // Atualização otimista local
    const updatedMoments = moments.map(moment => {
      if (moment.id === momentId) {
        const newLikes = hasLiked 
          ? moment.likes.filter(id => id !== auth.currentUser.uid)
          : [...(moment.likes || []), auth.currentUser.uid];
        return { ...moment, likes: newLikes };
      }
      return moment;
    });
    setMoments(updatedMoments);
    
    const result = await likeMoment(momentId, auth.currentUser.uid, hasLiked);
    if (!result.success) {
      setMoments(moments);
      Alert.alert('Erro', 'Não foi possível curtir. Tente novamente.');
    }
  };

  const viewUserProfile = (userId, userNick, userAvatar) => {
    navigation.navigate('UserProfile', { 
      userId: userId, 
      userNick: userNick, 
      userAvatar: userAvatar 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `${diffMinutes} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays < 7) return `${diffDays} dias`;
    return date.toLocaleDateString();
  };

  // Renderizar stories
  const renderStory = ({ item }) => (
    <TouchableOpacity style={styles.storyItem} onPress={() => {
      if (item.isAdd) {
        Alert.alert('Adicionar Story', 'Funcionalidade em breve!');
      } else {
        Alert.alert('Story', `Story de ${item.name}`);
      }
    }}>
      {item.isAdd ? (
        <View style={styles.storyAddContainer}>
          <LinearGradient colors={['#6c63ff', '#4ecdc4']} style={styles.storyAddGradient}>
            <Icon name="plus" size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.storyName}>{item.name}</Text>
        </View>
      ) : (
        <>
          <LinearGradient
            colors={item.color || ['#6c63ff', '#4ecdc4']}
            style={styles.storyGradient}
          >
            <View style={styles.storyAvatar}>
              <Icon name="account" size={24} color="#fff" />
            </View>
          </LinearGradient>
          <Text style={styles.storyName}>{item.name}</Text>
        </>
      )}
    </TouchableOpacity>
  );

  // Renderizar momento
  const renderMoment = ({ item }) => {
    const hasLiked = item.likes?.includes(auth.currentUser.uid) || false;
    const momentDate = formatDate(item.createdAt);
    const likesCount = item.likes?.length || 0;
    const commentsCount = item.comments?.length || 0;
    
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={[colors.card, colors.background]}
          style={styles.momentCard}
        >
          <TouchableOpacity 
            style={styles.momentHeader} 
            onPress={() => viewUserProfile(item.userId, item.userNick, item.userAvatar)}
            activeOpacity={0.7}
          >
            {item.userAvatar ? (
              <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={['#6c63ff', '#4ecdc4']}
                style={styles.avatarGradient}
              >
                <Icon name="account" size={24} color="#fff" />
              </LinearGradient>
            )}
            <View style={styles.momentHeaderInfo}>
              <Text style={styles.userName}>{item.userNick}</Text>
              <View style={styles.timeContainer}>
                <Icon name="clock-outline" size={10} color={colors.textSecondary} />
                <Text style={styles.momentTime}>{momentDate}</Text>
              </View>
            </View>
            <Icon name="dots-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {item.text && (
            <Text style={styles.momentText}>{item.text}</Text>
          )}
          
          {item.imageUrl && (
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={() => {
                Alert.alert('Ver imagem', 'Toque e segure para salvar');
              }}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.momentImage} />
              <View style={styles.imageOverlay}>
                <Icon name="expand" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.momentStats}>
            <View style={styles.statItem}>
              <Icon name="heart" size={14} color={hasLiked ? '#ff6b6b' : colors.textSecondary} />
              <Text style={[styles.statText, hasLiked && styles.statTextActive]}>{likesCount}</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="comment" size={14} color={colors.textSecondary} />
              <Text style={styles.statText}>{commentsCount}</Text>
            </View>
          </View>

          <View style={styles.momentFooter}>
            <TouchableOpacity 
              style={[styles.actionButton, hasLiked && styles.actionButtonActive]} 
              onPress={() => handleLike(item.id, item.likes)}
            >
              <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
                <Icon 
                  name={hasLiked ? "heart" : "heart-outline"} 
                  size={22} 
                  color={hasLiked ? '#ff6b6b' : colors.textSecondary} 
                />
              </Animated.View>
              <Text style={[styles.actionText, hasLiked && styles.actionTextActive]}>
                {hasLiked ? 'Curtido' : 'Curtir'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => {
              Alert.alert('Comentários', 'Funcionalidade em breve!');
            }}>
              <Icon name="comment-outline" size={22} color={colors.textSecondary} />
              <Text style={styles.actionText}>Comentar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => {
              Alert.alert('Compartilhar', 'Funcionalidade em breve!');
            }}>
              <Icon name="share-outline" size={22} color={colors.textSecondary} />
              <Text style={styles.actionText}>Compartilhar</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMoments();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando momentos...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
      {/* Header com gradiente */}
      <LinearGradient
        colors={[colors.card, 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Momentos</Text>
            <Text style={styles.headerSubtitle}>Compartilhe com seus amigos</Text>
          </View>
          <TouchableOpacity 
            style={styles.newButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary, '#4ecdc4']}
              style={styles.newButtonGradient}
            >
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.newButtonText}>Novo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Top Menu - Seguindo | Popular */}
      <View style={styles.topMenu}>
        <TouchableOpacity 
          style={[styles.topMenuItem, activeTab === 'seguindo' && styles.activeTopMenuItem]}
          onPress={() => setActiveTab('seguindo')}
        >
          <Icon name="account-group" size={18} color={activeTab === 'seguindo' ? colors.text : colors.textSecondary} />
          <Text style={[styles.topMenuText, activeTab === 'seguindo' && styles.activeTopMenuText]}>
            Seguindo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.topMenuItem, activeTab === 'popular' && styles.activeTopMenuItem]}
          onPress={() => setActiveTab('popular')}
        >
          <Icon name="fire" size={18} color={activeTab === 'popular' ? colors.text : colors.textSecondary} />
          <Text style={[styles.topMenuText, activeTab === 'popular' && styles.activeTopMenuText]}>
            Popular
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={moments}
        keyExtractor={(item) => item.id}
        renderItem={renderMoment}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.storiesSection}>
            <FlatList
              data={STORIES}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderStory}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesList}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={[colors.card, 'transparent']}
              style={styles.emptyCard}
            >
              <Icon name="newspaper-variant" size={60} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'seguindo' 
                  ? 'Nenhum momento por aqui' 
                  : 'Nenhum momento popular'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'seguindo' 
                  ? 'Siga outros usuários para ver seus momentos' 
                  : 'Os momentos mais famosos aparecerão aqui'}
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => setModalVisible(true)}>
                <LinearGradient
                  colors={[colors.primary, '#4ecdc4']}
                  style={styles.emptyButtonGradient}
                >
                  <Icon name="plus" size={18} color="#fff" />
                  <Text style={styles.emptyButtonText}>Criar Momento</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        }
      />

      {/* Modal de criação modernizado */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => {
              setModalVisible(false);
              setPostText('');
              setPostImage(null);
            }}
          />
          <View style={styles.modalContent}>
            <LinearGradient
              colors={[colors.card, colors.background]}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Novo Momento</Text>
                <TouchableOpacity onPress={() => {
                  setModalVisible(false);
                  setPostText('');
                  setPostImage(null);
                }}>
                  <Icon name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalUserInfo}>
                {userProfile?.avatarUrl ? (
                  <Image source={{ uri: userProfile.avatarUrl }} style={styles.modalAvatar} />
                ) : (
                  <LinearGradient
                    colors={['#6c63ff', '#4ecdc4']}
                    style={styles.modalAvatarGradient}
                  >
                    <Icon name="account" size={20} color="#fff" />
                  </LinearGradient>
                )}
                <Text style={styles.modalUserName}>{userProfile?.nick}</Text>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="O que você está pensando?"
                placeholderTextColor={colors.textSecondary}
                value={postText}
                onChangeText={setPostText}
                multiline
                numberOfLines={4}
                maxLength={500}
              />

              {postImage && (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: postImage }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.removeImage} 
                    onPress={() => setPostImage(null)}
                  >
                    <Icon name="close-circle" size={28} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity 
                style={styles.imageButton} 
                onPress={handleAddImage} 
                disabled={uploadingImage}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(108,99,255,0.1)', 'rgba(108,99,255,0.2)']}
                  style={styles.imageButtonGradient}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Icon name="image-plus" size={24} color={colors.primary} />
                      <Text style={styles.imageButtonText}>Adicionar imagem</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancel} 
                  onPress={() => {
                    setModalVisible(false);
                    setPostText('');
                    setPostImage(null);
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalSave, submitting && styles.modalSaveDisabled]} 
                  onPress={handleCreatePost}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.primary, '#4ecdc4']}
                    style={styles.modalSaveGradient}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <>
                        <Icon name="send" size={18} color="#fff" />
                        <Text style={styles.modalSaveText}>Publicar</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
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
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text, letterSpacing: 1 },
  headerSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  
  // Botão novo
  newButton: { overflow: 'hidden', borderRadius: 25 },
  newButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  newButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  
  // Top Menu
  topMenu: { flexDirection: 'row', backgroundColor: 'rgba(22, 33, 62, 0.8)', marginHorizontal: 20, marginVertical: 16, borderRadius: 30, padding: 4 },
  topMenuItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 25 },
  activeTopMenuItem: { backgroundColor: colors.primary },
  topMenuText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  activeTopMenuText: { color: colors.text },
  
  // Stories
  storiesSection: { marginBottom: 8 },
  storiesList: { paddingHorizontal: 16, gap: 16 },
  storyItem: { alignItems: 'center', width: 70 },
  storyGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.primary },
  storyAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' },
  storyAddContainer: { alignItems: 'center' },
  storyAddGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  storyName: { color: colors.textSecondary, fontSize: 11, marginTop: 6, textAlign: 'center' },
  
  // Card do Momento
  momentCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border },
  momentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 45, height: 45, borderRadius: 22.5 },
  avatarGradient: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  momentHeaderInfo: { flex: 1, marginLeft: 12 },
  userName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  timeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  momentTime: { color: colors.textSecondary, fontSize: 10 },
  momentText: { color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: 12 },
  imageContainer: { position: 'relative', marginBottom: 12 },
  momentImage: { width: '100%', height: 200, borderRadius: 16 },
  imageOverlay: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  momentStats: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: colors.textSecondary, fontSize: 12 },
  statTextActive: { color: '#ff6b6b' },
  momentFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  actionButtonActive: { backgroundColor: 'rgba(255,107,107,0.1)' },
  actionText: { color: colors.textSecondary, fontSize: 13 },
  actionTextActive: { color: '#ff6b6b' },
  
  // Empty state
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyCard: { alignItems: 'center', padding: 40, borderRadius: 24, width: '100%' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  emptyText: { color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' },
  emptyButton: { marginTop: 20, borderRadius: 25, overflow: 'hidden' },
  emptyButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  emptyButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { maxHeight: '85%' },
  modalGradient: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  modalUserInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  modalAvatar: { width: 40, height: 40, borderRadius: 20 },
  modalAvatarGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  modalUserName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.05)', color: colors.text, padding: 15, borderRadius: 16, marginBottom: 15, fontSize: 16, minHeight: 100, textAlignVertical: 'top' },
  imageButton: { marginBottom: 15, borderRadius: 16, overflow: 'hidden' },
  imageButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 16 },
  imageButtonText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  imagePreview: { position: 'relative', marginBottom: 15 },
  previewImage: { width: '100%', height: 150, borderRadius: 16 },
  removeImage: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalCancel: { flex: 1, backgroundColor: 'rgba(255,107,107,0.8)', padding: 14, borderRadius: 16, alignItems: 'center' },
  modalCancelText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalSave: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  modalSaveDisabled: { opacity: 0.6 },
  modalSaveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 },
  modalSaveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});