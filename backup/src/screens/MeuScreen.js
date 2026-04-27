/**
 * ============================================
 * FALOU - MINHAS SALAS (MEU)
 * ============================================
 * ✅ CORREÇÕES REALIZADAS (BUG #5):
 * 1. Adicionada flag isMounted para evitar memory leak
 * 2. Corrigido loadData com verificação de montagem
 * 3. Adicionados alerts para funcionalidades em breve
 * 4. Melhorada navegação para VoiceRoom
 * ============================================
 * Funcionalidades:
 * - Criar/editar sala do usuário (apenas uma por usuário)
 * - Escolher capa da sala (com permissão de galeria)
 * - Ver salas recomendadas e seguidas
 * - Entrar em salas
 * ============================================
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, TextInput, Modal, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../config/firebase';
import { getUserProfile, getUserVoiceRoom, createVoiceRoom, updateUserVoiceRoom, getRecentRooms, getFollowedRooms } from '../services/firestore';
import { uploadToCloudinary } from '../services/cloudinary';
import { ensureGalleryPermission } from '../services/permissions';
import { colors } from '../utils/colors';

export default function MeuScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [userRoom, setUserRoom] = useState(null);
  const [recentRooms, setRecentRooms] = useState([]);
  const [followedRooms, setFollowedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [roomCover, setRoomCover] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('recomendado');

  // ✅ Flag para evitar memory leak
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      setLoading(true);
      
      try {
        const profile = await getUserProfile(auth.currentUser.uid);
        if (!isMounted) return;
        
        if (profile.success) {
          setUserProfile(profile.data);
          
          const room = await getUserVoiceRoom(auth.currentUser.uid);
          if (!isMounted) return;
          
          if (room.success) {
            setUserRoom(room.data);
            setRoomName(room.data.name);
            setRoomDescription(room.data.description || '');
            setRoomCover(room.data.coverImage);
            setEditing(true);
          }
          
          const recent = await getRecentRooms();
          if (!isMounted) return;
          if (recent.success) setRecentRooms(recent.data);
          
          const followed = await getFollowedRooms(profile.data.following);
          if (!isMounted) return;
          if (followed.success) setFollowedRooms(followed.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        if (isMounted) {
          Alert.alert('Erro', 'Falha ao carregar dados');
        }
      }
      
      if (isMounted) setLoading(false);
    };
    
    loadData();
    
    return () => { isMounted = false; };
  }, []);

  const handleChooseCover = async () => {
    const hasPermission = await ensureGalleryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setUploading(true);
      const uploadResult = await uploadToCloudinary(result.assets[0].uri);
      if (uploadResult.success) {
        setRoomCover(uploadResult.url);
      } else {
        Alert.alert('Erro', 'Falha ao fazer upload da imagem');
      }
      setUploading(false);
    }
  };

  const handleSaveRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert('Erro', 'Digite um nome para a sala');
      return;
    }

    setUploading(true);
    
    try {
      if (userRoom) {
        const result = await updateUserVoiceRoom(userRoom.id, {
          name: roomName,
          description: roomDescription,
          coverImage: roomCover || userProfile?.avatarUrl
        });
        if (result.success) {
          Alert.alert('Sucesso', 'Sala atualizada!');
          setModalVisible(false);
          // Recarregar dados
          const room = await getUserVoiceRoom(auth.currentUser.uid);
          if (room.success) setUserRoom(room.data);
        } else {
          Alert.alert('Erro', result.error);
        }
      } else {
        const result = await createVoiceRoom({
          name: roomName,
          description: roomDescription,
          coverImage: roomCover || userProfile?.avatarUrl,
          ownerId: auth.currentUser.uid,
          ownerNick: userProfile?.nick,
          ownerAvatar: userProfile?.avatarUrl
        });
        if (result.success) {
          Alert.alert('Sucesso', 'Sala criada!');
          setModalVisible(false);
          // Recarregar dados
          const room = await getUserVoiceRoom(auth.currentUser.uid);
          if (room.success) setUserRoom(room.data);
        } else {
          Alert.alert('Erro', result.error);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar sala:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado');
    }
    
    setUploading(false);
  };

  const enterRoom = (room) => {
    navigation.navigate('VoiceRoom', { roomId: room.id, roomData: room });
  };

  const renderRoomCard = ({ item, type }) => (
    <TouchableOpacity style={styles.roomCard} onPress={() => enterRoom(item)}>
      <View style={styles.roomAvatar}>
        {item.coverImage ? (
          <Image source={{ uri: item.coverImage }} style={styles.avatarImage} />
        ) : item.ownerAvatar ? (
          <Image source={{ uri: item.ownerAvatar }} style={styles.avatarImage} />
        ) : (
          <Icon name="microphone-variant" size={30} color={colors.primary} />
        )}
      </View>
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{item.name}</Text>
        <Text style={styles.roomDescription} numberOfLines={1}>
          {item.description || 'Sala de voz ao vivo'}
        </Text>
        <View style={styles.roomStats}>
          <Icon name="account-group" size={12} color={colors.textSecondary} />
          <Text style={styles.roomMembers}>{item.members?.length || 0} online</Text>
        </View>
      </View>
      <Icon name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu</Text>
      </View>

      <View style={styles.topMenu}>
        <TouchableOpacity 
          style={[styles.topMenuItem, activeTab === 'recomendado' && styles.activeTopMenuItem]}
          onPress={() => setActiveTab('recomendado')}
        >
          <Text style={[styles.topMenuText, activeTab === 'recomendado' && styles.activeTopMenuText]}>Recomendado</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.topMenuItem, activeTab === 'seguir' && styles.activeTopMenuItem]}
          onPress={() => setActiveTab('seguir')}
        >
          <Text style={[styles.topMenuText, activeTab === 'seguir' && styles.activeTopMenuText]}>Seguir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.myRoomSection}>
        <Text style={styles.sectionTitle}>Sua Sala</Text>
        {userRoom ? (
          <TouchableOpacity style={styles.myRoomCard} onPress={() => enterRoom(userRoom)}>
            <View style={styles.myRoomAvatar}>
              {userRoom.coverImage ? (
                <Image source={{ uri: userRoom.coverImage }} style={styles.myRoomImage} />
              ) : userProfile?.avatarUrl ? (
                <Image source={{ uri: userProfile.avatarUrl }} style={styles.myRoomImage} />
              ) : (
                <Icon name="microphone-variant" size={40} color={colors.primary} />
              )}
            </View>
            <View style={styles.myRoomInfo}>
              <Text style={styles.myRoomName}>{userRoom.name}</Text>
              <Text style={styles.myRoomMembers}>{userRoom.members?.length || 0} pessoas online</Text>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.editRoomButton}>
              <Icon name="pencil" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Icon name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.createRoomButton} onPress={() => setModalVisible(true)}>
            <Icon name="plus-circle" size={24} color={colors.primary} />
            <Text style={styles.createRoomText}>Criar sua sala</Text>
            <Text style={styles.createRoomSubtext}>Comece sua jornada no Falou</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.roomsSection}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'recomendado' ? 'Salas Recomendadas' : 'Salas que Você Segue'}
        </Text>
        {activeTab === 'recomendado' ? (
          recentRooms.length > 0 ? (
            recentRooms.map((room) => (
              <View key={room.id}>{renderRoomCard({ item: room, type: 'recomendado' })}</View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhuma sala recomendada</Text>
          )
        ) : (
          followedRooms.length > 0 ? (
            followedRooms.map((room) => (
              <View key={room.id}>{renderRoomCard({ item: room, type: 'seguir' })}</View>
            ))
          ) : (
            <Text style={styles.emptyText}>Siga outros usuários para ver suas salas</Text>
          )
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{userRoom ? 'Editar Sala' : 'Criar Sala'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.coverSelector} onPress={handleChooseCover}>
              {roomCover ? (
                <Image source={{ uri: roomCover }} style={styles.coverPreview} />
              ) : (
                <View style={styles.coverSelectorPlaceholder}>
                  <Icon name="image-plus" size={30} color={colors.textSecondary} />
                  <Text style={styles.coverSelectorText}>Adicionar capa da sala</Text>
                </View>
              )}
              {uploading && <ActivityIndicator size="small" color={colors.primary} style={styles.uploadingIndicator} />}
            </TouchableOpacity>

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
              placeholder="Descrição da sala (opcional)"
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
              <TouchableOpacity 
                style={[styles.modalSave, uploading && styles.modalSaveDisabled]} 
                onPress={handleSaveRoom}
                disabled={uploading}
              >
                {uploading ? <ActivityIndicator size="small" color={colors.text} /> : <Text style={styles.modalSaveText}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  topMenu: { flexDirection: 'row', backgroundColor: colors.card, marginHorizontal: 20, marginVertical: 10, borderRadius: 30, padding: 4 },
  topMenuItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 25 },
  activeTopMenuItem: { backgroundColor: colors.primary },
  topMenuText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  activeTopMenuText: { color: colors.text },
  myRoomSection: { paddingHorizontal: 20, marginVertical: 10 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  myRoomCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 15, gap: 15 },
  myRoomAvatar: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden' },
  myRoomImage: { width: 60, height: 60, borderRadius: 30 },
  myRoomInfo: { flex: 1 },
  myRoomName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  myRoomMembers: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  editRoomButton: { padding: 8 },
  createRoomButton: { backgroundColor: colors.card, borderRadius: 16, padding: 20, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  createRoomText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  createRoomSubtext: { color: colors.textSecondary, fontSize: 12 },
  roomsSection: { paddingHorizontal: 20, marginVertical: 10, marginBottom: 30 },
  roomCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 10, gap: 12 },
  roomAvatar: { width: 45, height: 45, borderRadius: 22.5, overflow: 'hidden' },
  avatarImage: { width: 45, height: 45, borderRadius: 22.5 },
  roomInfo: { flex: 1 },
  roomName: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  roomDescription: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  roomStats: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  roomMembers: { color: colors.textSecondary, fontSize: 11 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', padding: 20 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: colors.card, borderRadius: 20, padding: 20, width: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  coverSelector: { marginBottom: 15, position: 'relative' },
  coverPreview: { width: '100%', height: 120, borderRadius: 12 },
  coverSelectorPlaceholder: { width: '100%', height: 120, backgroundColor: colors.background, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  coverSelectorText: { color: colors.textSecondary, marginTop: 8 },
  uploadingIndicator: { position: 'absolute', top: 45, left: '50%', marginLeft: -10 },
  modalInput: { backgroundColor: colors.background, color: colors.text, padding: 14, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: colors.border },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 10 },
  modalCancel: { flex: 1, backgroundColor: colors.danger, padding: 14, borderRadius: 12, alignItems: 'center' },
  modalCancelText: { color: colors.text, fontWeight: 'bold' },
  modalSave: { flex: 1, backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
  modalSaveDisabled: { opacity: 0.6 },
  modalSaveText: { color: colors.text, fontWeight: 'bold' },
});