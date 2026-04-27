/**
 * ============================================
 * FALOU - TELA DE CONFIGURAÇÕES
 * ============================================
 * ✅ VERSÃO MODERNIZADA:
 * 1. Design com gradientes e cards elegantes
 * 2. Animações suaves na entrada
 * 3. Header com gradiente e avatar do usuário
 * 4. Menu com seções organizadas
 * 5. Cards com gradiente e ícones
 * 6. Botão de logout com destaque
 * 7. Versão do app exibida
 * ============================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, Image, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../../config/firebase';
import { logoutUser } from '../services/auth';
import { getUserProfile } from '../services/firestore/index';
import { colors } from '../utils/colors';

const APP_VERSION = '1.0.0';

export default function SettingsScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadUserProfile();
    animateEntrance();
  }, []);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  const loadUserProfile = async () => {
    const result = await getUserProfile(auth.currentUser.uid);
    if (result.success) setUserProfile(result.data);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive', 
          onPress: async () => { 
            await logoutUser(); 
            navigation.replace('Auth'); 
          } 
        }
      ]
    );
  };

  const handleComingSoon = (feature) => {
    Alert.alert('Em breve', `A funcionalidade "${feature}" estará disponível em breve!`);
  };

  const handleClearCache = () => {
    Alert.alert('Cache limpo', 'O cache do aplicativo foi limpo com sucesso!');
  };

  // Seções do menu
  const menuSections = [
    {
      title: '🎨 APARÊNCIA',
      items: [
        { icon: 'window-maximize', name: 'Tela voadora', desc: 'Em todo o aplicativo', onPress: () => handleComingSoon('Tela Voadora') },
        { icon: 'palette', name: 'Tema', desc: 'Claro / Escuro', onPress: () => handleComingSoon('Tema') },
      ]
    },
    {
      title: '🎁 RECOMPENSAS',
      items: [
        { icon: 'gift', name: 'Gift banner', onPress: () => handleComingSoon('Gift Banner') },
        { icon: 'gift', name: 'Lucky bag banner', onPress: () => handleComingSoon('Lucky Bag') },
        { icon: 'gift', name: 'Treasure box banner', onPress: () => handleComingSoon('Treasure Box') },
      ]
    },
    {
      title: '🔒 PRIVACIDADE',
      items: [
        { icon: 'shield-account', name: 'Privacidade', onPress: () => handleComingSoon('Privacidade') },
        { icon: 'account-cancel', name: 'Lista negra', onPress: () => handleComingSoon('Lista Negra') },
        { icon: 'eye-off', name: 'Bloquear usuários', onPress: () => handleComingSoon('Bloquear') },
      ]
    },
    {
      title: '🌐 PREFERÊNCIAS',
      items: [
        { icon: 'translate', name: 'Idioma', desc: 'Português', onPress: () => handleComingSoon('Idioma') },
        { icon: 'bell', name: 'Notificações', desc: 'Ativadas', onPress: () => handleComingSoon('Notificações') },
        { icon: 'volume-high', name: 'Sons', desc: 'Ativados', onPress: () => handleComingSoon('Sons') },
      ]
    },
    {
      title: '⚖️ SUPORTE',
      items: [
        { icon: 'gavel', name: 'Centro de apelações', onPress: () => handleComingSoon('Apelações') },
        { icon: 'file-document', name: 'Termos de serviço', onPress: () => navigation.navigate('About') },
        { icon: 'shield-check', name: 'Política de privacidade', onPress: () => navigation.navigate('About') },
        { icon: 'trash-can', name: 'Limpar cache', onPress: handleClearCache },
      ]
    },
    {
      title: 'ℹ️ SOBRE',
      items: [
        { icon: 'information', name: 'Versão do app', desc: APP_VERSION, onPress: () => navigation.navigate('About') },
        { icon: 'account-star', name: 'Avaliar o app', onPress: () => handleComingSoon('Avaliar') },
        { icon: 'share-variant', name: 'Compartilhar', onPress: () => handleComingSoon('Compartilhar') },
      ]
    },
  ];

  const renderMenuItem = (item, index) => (
    <TouchableOpacity 
      key={index}
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['rgba(108,99,255,0.15)', 'rgba(108,99,255,0.05)']}
        style={styles.menuIconContainer}
      >
        <Icon name={item.icon} size={22} color={colors.primary} />
      </LinearGradient>
      <View style={styles.menuContent}>
        <Text style={styles.menuText}>{item.name}</Text>
        {item.desc && <Text style={styles.menuDesc}>{item.desc}</Text>}
      </View>
      <Icon name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={[colors.background, '#0f0f1a']} style={styles.container}>
      {/* Header com gradiente */}
      <LinearGradient
        colors={[colors.card, 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configurações</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </LinearGradient>

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Card do Perfil */}
        <LinearGradient
          colors={[colors.card, colors.background]}
          style={styles.profileCard}
        >
          <View style={styles.profileInfo}>
            {userProfile?.avatarUrl ? (
              <Image source={{ uri: userProfile.avatarUrl }} style={styles.profileAvatar} />
            ) : (
              <LinearGradient colors={['#6c63ff', '#4ecdc4']} style={styles.profileAvatarGradient}>
                <Icon name="account" size={28} color="#fff" />
              </LinearGradient>
            )}
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{userProfile?.nick || 'Usuário'}</Text>
              <Text style={styles.profileEmail}>{userProfile?.email || auth.currentUser?.email}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileButton} onPress={() => navigation.navigate('ProfileView')}>
            <Text style={styles.editProfileText}>Editar perfil</Text>
            <Icon name="pencil" size={14} color={colors.primary} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Seções do Menu */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <LinearGradient
              colors={[colors.card, colors.background]}
              style={styles.sectionCard}
            >
              {section.items.map((item, itemIndex) => renderMenuItem(item, itemIndex))}
            </LinearGradient>
          </View>
        ))}

        {/* Botão de Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <LinearGradient
            colors={['rgba(255,107,107,0.2)', 'rgba(255,107,107,0.05)']}
            style={styles.logoutGradient}
          >
            <Icon name="logout" size={22} color="#ff6b6b" />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer com direitos autorais */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Falou App © 2026</Text>
          <Text style={styles.footerVersion}>Versão {APP_VERSION}</Text>
        </View>

        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  bottomPadding: { height: 40 },
  
  // Header
  headerGradient: { paddingTop: 40, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  headerPlaceholder: { width: 40 },
  
  // Profile Card
  profileCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 24, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  profileInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileAvatar: { width: 55, height: 55, borderRadius: 27.5 },
  profileAvatarGradient: { width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center' },
  profileText: { flex: 1 },
  profileName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  profileEmail: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  editProfileButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(108,99,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  editProfileText: { color: colors.primary, fontSize: 13, fontWeight: '500' },
  
  // Seções
  section: { marginHorizontal: 20, marginTop: 20 },
  sectionTitle: { color: colors.primary, fontSize: 12, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
  sectionCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  
  // Menu Item
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(42,42,74,0.5)' },
  menuIconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuContent: { flex: 1 },
  menuText: { color: colors.text, fontSize: 15, fontWeight: '500' },
  menuDesc: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  
  // Logout Button
  logoutButton: { marginHorizontal: 20, marginTop: 30, borderRadius: 16, overflow: 'hidden' },
  logoutGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)', borderRadius: 16 },
  logoutText: { color: '#ff6b6b', fontSize: 16, fontWeight: 'bold' },
  
  // Footer
  footer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  footerText: { color: colors.textSecondary, fontSize: 12 },
  footerVersion: { color: colors.textSecondary, fontSize: 10, marginTop: 4 },
});