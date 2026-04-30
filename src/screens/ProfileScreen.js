/**
 * ============================================
 * FALOU - TELA DE PERFIL DO USUÁRIO
 * ============================================
 * ✅ VERSÃO MODERNIZADA:
 * 1. Design com gradientes e cards elegantes
 * 2. Card da Sala (leva para sala do usuário ou criação)
 * 3. Removida seção de presentes
 * 4. Animações suaves
 * 5. Stats interativos
 * 6. Layout responsivo
 * ============================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, TextInput, Modal, ActivityIndicator,
  FlatList, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../../config/firebase';
import { getUserProfile, updateUserProfile, getVisitors, getFollowers, getFollowing, getUserVoiceRoom } from '../services/firestore/index';
import { pickAndUploadImage } from '../services/cloudinary';
import { ensureGalleryPermission } from '../services/permissions';
import { colors } from '../utils/colors';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [userRoom, setUserRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editNick, setEditNick] = useState('');
  const [editBio, setEditBio] = useState('');
  const [visitors, setVisitors] = useState([]);
  const [showVisitors, setShowVisitors] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadProfile();
    animateEntrance();
  }, []);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const loadProfile = async () => {
    setLoading(true);
    const result = await getUserProfile(auth.currentUser.uid);
    if (result.success) {
      setProfile(result.data);
      setEditNick(result.data.nick);
      setEditBio(result.data.bio || '');
    }
    
    // Carregar sala do usuário
    const roomResult = await getUserVoiceRoom(auth.currentUser.uid);
    if (roomResult.success) {
      setUserRoom(roomResult.data);
    }
    
    const visitorsResult = await getVisitors(auth.currentUser.uid);
    if (visitorsResult.success) {
      setVisitors(visitorsResult.data);
    }
    setLoading(false);
  };

  const loadFollowersList = async () => {
    const result = await getFollowers(auth.currentUser.uid);
    if (result.success) {
      setFollowersList(result.data);
      setShowFollowers(true);
    }
  };

  const loadFollowingList = async () => {
    const result = await getFollowing(auth.currentUser.uid);
    if (result.success) {
      setFollowingList(result.data);
      setShowFollowing(true);
    }
  };

  const handleUploadAvatar = async () => {
    const hasPermission = await ensureGalleryPermission();
    if (!hasPermission) return;
    
    setUploading(true);
    const result = await pickAndUploadImage();
    if (result.success) {
      const updateResult = await updateUserProfile(auth.currentUser.uid, { avatarUrl: result.url });
      if (updateResult.success) {
        await loadProfile();
        Alert.alert('Sucesso', 'Avatar atualizado!');
      } else {
        Alert.alert('Erro', 'Falha ao salvar URL do avatar');
      }
    } else if (result.error !== 'Nenhuma imagem selecionada') {
      Alert.alert('Erro', result.error);
    }
    setUploading(false);
  };

  const handleUpdateProfile = async () => {
    if (!editNick.trim()) {
      Alert.alert('Erro', 'Nick não pode estar vazio');
      return;
    }
    setUploading(true);
    const result = await updateUserProfile(auth.currentUser.uid, {
      nick: editNick,
      bio: editBio,
    });
    if (result.success) {
      await loadProfile();
      setEditModalVisible(false);
      Alert.alert('Sucesso', 'Perfil atualizado!');
    } else {
      Alert.alert('Erro', result.error);
    }
    setUploading(false);
  };

  const viewUserProfile = (user) => {
    setShowFollowers(false);
    setShowFollowing(false);
    setShowVisitors(false);
    navigation.navigate('UserProfile', { 
      userId: user.uid, 
      userNick: user.nick,
      userAvatar: user.avatarUrl,
      userGender: user.gender
    });
  };

  const handleWalletPress = () => {
    Alert.alert('💰 Carteira', 'Funcionalidade em desenvolvimento!\n\nEm breve você poderá:\n• Ver seu saldo\n• Comprar moedas\n• Ver histórico de transações');
  };

  const handleVipPress = () => {
    Alert.alert('👑 Área VIP', 'Funcionalidade em desenvolvimento!\n\nEm breve você terá benefícios exclusivos:\n• Badges especiais\n• Temas exclusivos\n• Descontos na loja');
  };

  const handleShopPress = () => {
    navigation.navigate('Shop');
  };

  // ✅ Navegação para a Sala (card)
  const handleRoomPress = () => {
    if (userRoom) {
      navigation.navigate('AgoraVoiceRoom', { roomId: userRoom.id, roomData: userRoom });
    } else {
      navigation.navigate('Meu');
    }
  };

  const renderListItem = ({ item }) => (
    <TouchableOpacity style={styles.listItem} onPress={() => viewUserProfile(item)}>
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.listAvatar} />
      ) : (
        <LinearGradient colors={['#6c63ff', '#4ecdc4']} style={styles.listAvatarGradient}>
          <Icon name="account" size={20} color="#fff" />
        </LinearGradient>
      )}
      <View style={styles.listInfo}>
        <Text style={styles.listName}>{item.nick}</Text>
        <Text style={styles.listId}>ID: {item.numericId}</Text>
      </View>
      <Icon name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header com gradiente */}
        <LinearGradient
          colors={[colors.card, 'transparent']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Perfil</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsButton}>
              <Icon name="cog" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          {/* Avatar e informações básicas */}
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={handleUploadAvatar} disabled={uploading} style={styles.avatarContainer}>
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={['#6c63ff', '#4ecdc4']} style={styles.avatarGradient}>
                  <Icon name="account" size={40} color="#fff" />
                </LinearGradient>
              )}
              <LinearGradient colors={['#6c63ff', '#4ecdc4']} style={styles.editAvatarBadge}>
                <Icon name="camera" size={14} color="#fff" />
              </LinearGradient>
              {uploading && <View style={styles.uploadingOverlay} />}
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.nick}>{profile?.nick}</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(true)}>
                  <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.1)']} style={styles.editIcon}>
                    <Icon name="pencil" size={14} color={colors.primary} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              <Text style={styles.id}>ID: {profile?.numericId}</Text>
              <View style={styles.levelRow}>
                <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.1)']} style={styles.levelBadge}>
                  <Icon name="star" size={12} color={colors.primary} />
                  <Text style={styles.levelText}>Nível {profile?.level || 1}</Text>
                </LinearGradient>
                <LinearGradient colors={['rgba(255,107,107,0.2)', 'rgba(255,107,107,0.1)']} style={styles.levelBadge}>
                  <Icon name="heart" size={12} color="#ff6b6b" />
                  <Text style={styles.levelText}>💖 {profile?.charisma || 0}</Text>
                </LinearGradient>
                <LinearGradient colors={['rgba(78,205,196,0.2)', 'rgba(78,205,196,0.1)']} style={styles.levelBadge}>
                  <Icon name="wallet" size={12} color="#4ecdc4" />
                  <Text style={styles.levelText}>💰 {profile?.wealth || 0}</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statBox} onPress={() => setShowVisitors(true)} activeOpacity={0.7}>
              <Text style={styles.statNumber}>{visitors.length}</Text>
              <Text style={styles.statLabel}>Visitantes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statBox} onPress={loadFollowersList} activeOpacity={0.7}>
              <Text style={styles.statNumber}>{profile?.followers?.length || 0}</Text>
              <Text style={styles.statLabel}>Seguidores</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statBox} onPress={loadFollowingList} activeOpacity={0.7}>
              <Text style={styles.statNumber}>{profile?.following?.length || 0}</Text>
              <Text style={styles.statLabel}>Seguindo</Text>
            </TouchableOpacity>
          </View>

          {/* Bio editável */}
          <TouchableOpacity style={styles.bioContainer} onPress={() => setEditModalVisible(true)} activeOpacity={0.7}>
            <Icon name="information-outline" size={18} color={colors.primary} />
            <Text style={styles.bioText}>{profile?.bio || 'Clique para adicionar uma bio'}</Text>
            <Icon name="pencil" size={14} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* ✅ Card da Sala */}
          <TouchableOpacity style={styles.roomCard} onPress={handleRoomPress} activeOpacity={0.8}>
            <LinearGradient
              colors={['rgba(108,99,255,0.15)', 'rgba(108,99,255,0.05)']}
              style={styles.roomCardGradient}
            >
              <View style={styles.roomIconContainer}>
                <LinearGradient colors={['#6c63ff', '#4ecdc4']} style={styles.roomIconGradient}>
                  <Icon name="microphone-variant" size={24} color="#fff" />
                </LinearGradient>
              </View>
              <View style={styles.roomInfo}>
                <Text style={styles.roomTitle}>Minha Sala</Text>
                <Text style={styles.roomDescription}>
                  {userRoom ? userRoom.name : 'Crie sua sala de voz'}
                </Text>
                <View style={styles.roomStatus}>
                  <View style={styles.roomStatusDot} />
                  <Text style={styles.roomStatusText}>
                    {userRoom ? `${userRoom.members?.length || 0} online` : 'Clique para criar'}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color={colors.primary} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Menu de ações principais */}
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionItem} onPress={handleWalletPress} activeOpacity={0.7}>
              <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.1)']} style={styles.actionIconContainer}>
                <Icon name="wallet" size={24} color={colors.primary} />
              </LinearGradient>
              <Text style={styles.actionText}>Carteira</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleVipPress} activeOpacity={0.7}>
              <LinearGradient colors={['rgba(255,193,7,0.2)', 'rgba(255,193,7,0.1)']} style={styles.actionIconContainer}>
                <Icon name="crown" size={24} color="#FFD700" />
              </LinearGradient>
              <Text style={styles.actionText}>VIP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleShopPress} activeOpacity={0.7}>
              <LinearGradient colors={['rgba(78,205,196,0.2)', 'rgba(78,205,196,0.1)']} style={styles.actionIconContainer}>
                <Icon name="store" size={24} color="#4ecdc4" />
              </LinearGradient>
              <Text style={styles.actionText}>Loja</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('ProfileView')} activeOpacity={0.7}>
              <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.1)']} style={styles.actionIconContainer}>
                <Icon name="account-circle" size={24} color={colors.primary} />
              </LinearGradient>
              <Text style={styles.actionText}>Perfil</Text>
            </TouchableOpacity>
          </View>

          {/* Botão Convidar amigos */}
          <TouchableOpacity style={styles.inviteButton} onPress={() => Alert.alert('Convidar amigos', 'Em breve você poderá convidar amigos via link!')} activeOpacity={0.8}>
            <LinearGradient
              colors={[colors.primary, '#4ecdc4']}
              style={styles.inviteButtonGradient}
            >
              <Icon name="account-multiple-plus" size={20} color="#fff" />
              <Text style={styles.inviteText}>Convidar amigos</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Modais */}
      <Modal visible={showVisitors} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Visitantes</Text>
              <TouchableOpacity onPress={() => setShowVisitors(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={visitors}
              keyExtractor={(item) => item.id}
              renderItem={renderListItem}
              ListEmptyComponent={<Text style={styles.emptyText}>Nenhum visitante ainda</Text>}
            />
          </LinearGradient>
        </View>
      </Modal>

      <Modal visible={showFollowers} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seguidores</Text>
              <TouchableOpacity onPress={() => setShowFollowers(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={followersList}
              keyExtractor={(item) => item.uid}
              renderItem={renderListItem}
              ListEmptyComponent={<Text style={styles.emptyText}>Nenhum seguidor ainda</Text>}
            />
          </LinearGradient>
        </View>
      </Modal>

      <Modal visible={showFollowing} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seguindo</Text>
              <TouchableOpacity onPress={() => setShowFollowing(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={followingList}
              keyExtractor={(item) => item.uid}
              renderItem={renderListItem}
              ListEmptyComponent={<Text style={styles.emptyText}>Não está seguindo ninguém</Text>}
            />
          </LinearGradient>
        </View>
      </Modal>

      {/* Modal de edição de perfil */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Nome</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Seu nome"
                placeholderTextColor={colors.textSecondary}
                value={editNick}
                onChangeText={setEditNick}
                maxLength={30}
              />

              <Text style={styles.modalLabel}>Bio</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Conte um pouco sobre você"
                placeholderTextColor={colors.textSecondary}
                value={editBio}
                onChangeText={setEditBio}
                multiline
                numberOfLines={3}
                maxLength={150}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalSave, uploading && styles.modalSaveDisabled]} 
                  onPress={handleUpdateProfile}
                  disabled={uploading}
                >
                  <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.modalSaveGradient}>
                    {uploading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalSaveText}>Salvar</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>
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
  settingsButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  
  // Profile Header
  profileHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 20, alignItems: 'center', gap: 16 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 85, height: 85, borderRadius: 42.5, borderWidth: 3, borderColor: colors.primary },
  avatarGradient: { width: 85, height: 85, borderRadius: 42.5, justifyContent: 'center', alignItems: 'center' },
  editAvatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.background },
  uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 42.5 },
  
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nick: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  editIcon: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  id: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  levelRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
  levelText: { color: colors.text, fontSize: 11, fontWeight: '500' },
  
  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginTop: 20, gap: 12 },
  statBox: { flex: 1, backgroundColor: 'rgba(22, 33, 62, 0.8)', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statNumber: { color: colors.primary, fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  
  // Bio
  bioContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(22, 33, 62, 0.6)', marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 16, gap: 10, borderWidth: 1, borderColor: colors.border },
  bioText: { color: colors.text, fontSize: 13, flex: 1 },
  
  // Card da Sala
  roomCard: { marginHorizontal: 20, marginTop: 20, borderRadius: 20, overflow: 'hidden' },
  roomCardGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 20 },
  roomIconContainer: { overflow: 'hidden', borderRadius: 30 },
  roomIconGradient: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  roomInfo: { flex: 1 },
  roomTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  roomDescription: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  roomStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  roomStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ecdc4' },
  roomStatusText: { color: '#4ecdc4', fontSize: 10, fontWeight: '500' },
  
  // Action Grid
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20, gap: 12 },
  actionItem: { width: '23%', alignItems: 'center', gap: 8 },
  actionIconContainer: { width: 55, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  actionText: { color: colors.textSecondary, fontSize: 11, fontWeight: '500' },
  
  // Invite Button
  inviteButton: { marginHorizontal: 20, marginTop: 24, marginBottom: 20, borderRadius: 30, overflow: 'hidden' },
  inviteButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 },
  inviteText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  
  // Modais
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { borderRadius: 24, padding: 20, width: '90%', maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  modalLabel: { color: colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.05)', color: colors.text, padding: 14, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  modalCancel: { flex: 1, backgroundColor: '#ff6b6b', padding: 14, borderRadius: 14, alignItems: 'center' },
  modalCancelText: { color: '#fff', fontWeight: 'bold' },
  modalSave: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  modalSaveDisabled: { opacity: 0.6 },
  modalSaveGradient: { padding: 14, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: 'bold' },
  
  // List Items
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  listAvatar: { width: 45, height: 45, borderRadius: 22.5 },
  listAvatarGradient: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  listInfo: { flex: 1 },
  listName: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  listId: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', padding: 20 },
});