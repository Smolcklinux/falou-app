/**
 * ============================================
 * FALOU - TELA DE VISUALIZAÇÃO DO PERFIL
 * (Como outros usuários veem o perfil)
 * ============================================
 * ✅ VERSÃO MODERNIZADA CORRIGIDA:
 * 1. Removido header duplicado (apenas botão voltar elegante)
 * 2. ID clicável para copiar (toque para copiar para área de transferência)
 * 3. Design com gradientes e cards elegantes
 * 4. Animações suaves na entrada
 * 5. Stats com ícones e gradientes
 * 6. Botões de ação com gradiente
 * 7. Layout responsivo e moderno
 * ============================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Animated, Alert
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../../config/firebase';
import { getUserProfile, followUser, unfollowUser, checkIsFollowing } from '../services/firestore/index';
import { colors } from '../utils/colors';

export default function ProfileViewScreen({ navigation, route }) {
  const { userId: targetUserId } = route.params || {};
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadProfile();
    animateEntrance();
  }, [targetUserId]);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadProfile = async () => {
    setLoading(true);
    const userId = targetUserId || auth.currentUser.uid;
    const result = await getUserProfile(userId);
    
    if (result.success) {
      setProfile(result.data);
      setIsCurrentUser(userId === auth.currentUser.uid);
      
      if (!isCurrentUser && userId !== auth.currentUser.uid) {
        const following = await checkIsFollowing(auth.currentUser.uid, userId);
        setIsFollowing(following);
      }
    }
    setLoading(false);
  };

  // ✅ Função para copiar ID
  const copyToClipboard = () => {
    if (profile?.numericId) {
      Clipboard.setString(profile.numericId.toString());
      Alert.alert('✅ ID Copiado!', `ID ${profile.numericId} copiado para a área de transferência.`);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile) return;
    
    if (isFollowing) {
      const result = await unfollowUser(auth.currentUser.uid, profile.uid);
      if (result.success) {
        setIsFollowing(false);
        Alert.alert('Sucesso', `Você deixou de seguir ${profile.nick}`);
      } else {
        Alert.alert('Erro', result.error);
      }
    } else {
      const result = await followUser(auth.currentUser.uid, profile.uid);
      if (result.success) {
        setIsFollowing(true);
        Alert.alert('Sucesso', `Você está seguindo ${profile.nick}`);
      } else {
        Alert.alert('Erro', result.error);
      }
    }
  };

  const sendMessage = () => {
    navigation.navigate('Chat', { 
      userId: profile.uid, 
      userNick: profile.nick, 
      userAvatar: profile.avatarUrl,
      userStatus: 'online'
    });
  };

  const getGenderColor = () => {
    if (profile?.gender === 'Masculino') return '#6c63ff';
    if (profile?.gender === 'Feminino') return '#ff6b6b';
    return colors.textSecondary;
  };

  const getGenderIcon = () => {
    if (profile?.gender === 'Masculino') return 'gender-male';
    if (profile?.gender === 'Feminino') return 'gender-female';
    return 'gender-non-binary';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="account-off" size={60} color={colors.textSecondary} />
        <Text style={styles.errorText}>Usuário não encontrado</Text>
        <TouchableOpacity style={styles.backButtonError} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonErrorText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
      {/* ========================================== */}
      {/* APENAS BOTÃO VOLTAR (sem título duplicado) */}
      {/* ========================================== */}
      <LinearGradient
        colors={[colors.card, 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerPlaceholder} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Banner de fundo com gradiente */}
          <LinearGradient
            colors={[getGenderColor() + '20', 'transparent']}
            style={styles.coverBanner}
          />

          {/* Avatar e informações principais */}
          <View style={styles.profileContainer}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={[getGenderColor(), getGenderColor() + '80']}
                  style={styles.avatarGradient}
                >
                  <Icon name="account" size={50} color="#fff" />
                </LinearGradient>
              )}
            </Animated.View>
            
            <Text style={styles.nick}>{profile?.nick}</Text>
            
            {/* ✅ ID clicável para copiar */}
            <TouchableOpacity onPress={copyToClipboard} style={styles.idContainer}>
              <Icon name="identifier" size={14} color={colors.textSecondary} />
              <Text style={styles.id}>ID: {profile?.numericId}</Text>
              <Icon name="content-copy" size={12} color={colors.primary} />
            </TouchableOpacity>
            
            {/* Nível e Carisma badges */}
            <View style={styles.badgeContainer}>
              <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.1)']} style={styles.badge}>
                <Icon name="star" size={12} color={colors.primary} />
                <Text style={styles.badgeText}>Nível {profile?.level || 1}</Text>
              </LinearGradient>
              <LinearGradient colors={['rgba(78,205,196,0.2)', 'rgba(78,205,196,0.1)']} style={styles.badge}>
                <Icon name="heart" size={12} color="#4ecdc4" />
                <Text style={styles.badgeText}>Carisma {profile?.charisma || 0}</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsRow}>
            <LinearGradient
              colors={[colors.card, colors.background]}
              style={styles.statCard}
            >
              <Icon name="account-group" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>{profile?.followers?.length || 0}</Text>
              <Text style={styles.statLabel}>Seguidores</Text>
            </LinearGradient>
            <LinearGradient
              colors={[colors.card, colors.background]}
              style={styles.statCard}
            >
              <Icon name="account-check" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>{profile?.following?.length || 0}</Text>
              <Text style={styles.statLabel}>Seguindo</Text>
            </LinearGradient>
            <LinearGradient
              colors={[colors.card, colors.background]}
              style={styles.statCard}
            >
              <Icon name="fire" size={24} color={colors.warning} />
              <Text style={styles.statNumber}>{profile?.charisma || 0}</Text>
              <Text style={styles.statLabel}>Carisma</Text>
            </LinearGradient>
          </View>

          {/* Informações do perfil */}
          <LinearGradient
            colors={[colors.card, colors.background]}
            style={styles.infoCard}
          >
            <Text style={styles.sectionTitle}>📋 Informações</Text>
            
            <View style={styles.infoRow}>
              <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.1)']} style={styles.infoIcon}>
                <Icon name="account" size={18} color={colors.primary} />
              </LinearGradient>
              <Text style={styles.infoLabel}>Nome</Text>
              <Text style={styles.infoValue}>{profile?.nick}</Text>
            </View>

            <View style={styles.infoRow}>
              <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.1)']} style={styles.infoIcon}>
                <Icon name={getGenderIcon()} size={18} color={getGenderColor()} />
              </LinearGradient>
              <Text style={styles.infoLabel}>Gênero</Text>
              <Text style={[styles.infoValue, { color: getGenderColor() }]}>
                {profile?.gender || 'Não informado'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.1)']} style={styles.infoIcon}>
                <Icon name="cake-variant" size={18} color={colors.primary} />
              </LinearGradient>
              <Text style={styles.infoLabel}>Idade</Text>
              <Text style={styles.infoValue}>{profile?.age || 'Não informada'} anos</Text>
            </View>

            <View style={styles.infoRow}>
              <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.1)']} style={styles.infoIcon}>
                <Icon name="map-marker" size={18} color={colors.primary} />
              </LinearGradient>
              <Text style={styles.infoLabel}>País</Text>
              <Text style={styles.infoValue}>{profile?.country || 'Brasil'}</Text>
            </View>

            <View style={styles.infoRow}>
              <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.1)']} style={styles.infoIcon}>
                <Icon name="translate" size={18} color={colors.primary} />
              </LinearGradient>
              <Text style={styles.infoLabel}>Idioma</Text>
              <Text style={styles.infoValue}>{profile?.language || 'Português'}</Text>
            </View>
          </LinearGradient>

          {/* Bio */}
          <LinearGradient
            colors={[colors.card, colors.background]}
            style={styles.bioCard}
          >
            <View style={styles.bioHeader}>
              <Icon name="information-outline" size={20} color={colors.primary} />
              <Text style={styles.bioTitle}>Sobre</Text>
            </View>
            <Text style={styles.bioText}>
              {profile?.bio || '✨ Este usuário ainda não escreveu uma bio'}
            </Text>
          </LinearGradient>

          {/* Botões de ação */}
          {!isCurrentUser && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.followButton, isFollowing && styles.followingButton]} 
                onPress={handleFollowToggle}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isFollowing ? ['#4ecdc4', '#44a08d'] : [colors.primary, '#4ecdc4']}
                  style={styles.followButtonGradient}
                >
                  <Icon name={isFollowing ? "check" : "account-plus"} size={20} color="#fff" />
                  <Text style={styles.followButtonText}>{isFollowing ? 'Seguindo' : 'Seguir'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.messageButton} 
                onPress={sendMessage}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.card, colors.background]}
                  style={styles.messageButtonGradient}
                >
                  <Icon name="message" size={20} color={colors.primary} />
                  <Text style={styles.messageButtonText}>Mensagem</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 20 },
  loadingText: { color: colors.textSecondary, marginTop: 16, fontSize: 14 },
  errorText: { color: colors.textSecondary, fontSize: 18, marginTop: 20, textAlign: 'center' },
  backButtonError: { marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  backButtonErrorText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  // Header simplificado (apenas botão voltar)
  headerGradient: { paddingTop: 40, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerPlaceholder: { width: 40 },
  
  // Cover Banner
  coverBanner: { height: 100, marginTop: -20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  
  // Profile Container
  profileContainer: { alignItems: 'center', marginTop: -30, paddingHorizontal: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: colors.primary, marginBottom: 12 },
  avatarGradient: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  nick: { color: colors.text, fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  idContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.1)' },
  id: { color: colors.textSecondary, fontSize: 13 },
  badgeContainer: { flexDirection: 'row', gap: 10, marginTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: colors.text, fontSize: 12, fontWeight: '500' },
  
  // Stats Row
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20, gap: 12 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  statNumber: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginTop: 8 },
  statLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  
  // Info Card
  infoCard: { marginHorizontal: 20, marginTop: 20, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  infoIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { color: colors.textSecondary, fontSize: 13, width: 50 },
  infoValue: { color: colors.text, fontSize: 13, flex: 1 },
  
  // Bio Card
  bioCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  bioHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  bioTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  bioText: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  
  // Buttons
  buttonContainer: { flexDirection: 'row', marginHorizontal: 20, gap: 12, marginBottom: 40 },
  followButton: { flex: 1, borderRadius: 30, overflow: 'hidden' },
  followingButton: { borderRadius: 30 },
  followButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  followButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  messageButton: { flex: 1, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  messageButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  messageButtonText: { color: colors.primary, fontSize: 15, fontWeight: 'bold' },
  
  bottomPadding: { height: 40 },
});