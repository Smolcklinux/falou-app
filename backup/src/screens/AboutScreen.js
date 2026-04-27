/**
 * ============================================
 * FALOU - TELA SOBRE O APP
 * ============================================
 * ✅ VERSÃO MODERNIZADA:
 * 1. Design com gradientes e cards elegantes
 * 2. Animações suaves na entrada
 * 3. Header com gradiente
 * 4. Seções organizadas com ícones
 * 5. Cards de características
 * 6. Links com efeitos visuais
 * 7. Layout responsivo
 * ============================================
 */

import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../utils/colors';

const APP_VERSION = '1.0.0';

// Características do app
const features = [
  { icon: 'microphone-variant', name: 'Salas de voz', description: 'Converse ao vivo' },
  { icon: 'account-group', name: 'Amigos', description: 'Conecte-se com pessoas' },
  { icon: 'chat', name: 'Mensagens', description: 'Chat instantâneo' },
  { icon: 'newspaper-variant', name: 'Momentos', description: 'Compartilhe sua vida' },
  { icon: 'gift', name: 'Presentes', description: 'Recompensas especiais' },
  { icon: 'crown', name: 'Ranking', description: 'Suba de nível' },
];

// Links úteis
const links = [
  { icon: 'email', name: 'E-mail de contato', value: 'voicemercury1@gmail.com', url: 'mailto:voicemercury1@gmail.com' },
  { icon: 'file-document', name: 'Termos de Serviço', value: 'Leia os termos', url: 'https://falou.app/terms' },
  { icon: 'shield-account', name: 'Política de Privacidade', value: 'Saiba mais', url: 'https://falou.app/privacy' },
  { icon: 'star', name: 'Avaliar o app', value: 'Deixe sua nota', url: 'https://falou.app/rate' },
];

export default function AboutScreen({ navigation }) {
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    animateEntrance();
  }, []);

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

  const handleLinkPress = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o link');
    });
  };

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
          <Text style={styles.headerTitle}>Sobre</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </LinearGradient>

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo e nome do app */}
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={[colors.primary, '#4ecdc4']}
            style={styles.logoCircle}
          >
            <Icon name="microphone-variant" size={55} color="#fff" />
          </LinearGradient>
          <LinearGradient
            colors={[colors.text, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.appNameGradient}
          >
            <Text style={styles.appName}>FALOU</Text>
          </LinearGradient>
          <Text style={styles.appVersion}>Versão {APP_VERSION}</Text>
          <View style={styles.badgeContainer}>
            <LinearGradient colors={['rgba(78,205,196,0.2)', 'rgba(78,205,196,0.1)']} style={styles.badge}>
              <Icon name="check-circle" size={12} color="#4ecdc4" />
              <Text style={styles.badgeText}>Estável</Text>
            </LinearGradient>
            <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.1)']} style={styles.badge}>
              <Icon name="shield-check" size={12} color={colors.primary} />
              <Text style={styles.badgeText}>Seguro</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Descrição */}
        <LinearGradient
          colors={[colors.card, colors.background]}
          style={styles.descriptionCard}
        >
          <Text style={styles.description}>
            Falou é um app de salas de voz interativas onde você pode conectar-se com pessoas,
            fazer amigos, compartilhar momentos e muito mais!
          </Text>
        </LinearGradient>

        {/* Características */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="star" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Características</Text>
          </View>
          
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <LinearGradient
                key={index}
                colors={[colors.card, colors.background]}
                style={styles.featureCard}
              >
                <LinearGradient
                  colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.05)']}
                  style={styles.featureIcon}
                >
                  <Icon name={feature.icon} size={24} color={colors.primary} />
                </LinearGradient>
                <Text style={styles.featureName}>{feature.name}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </LinearGradient>
            ))}
          </View>
        </View>

        {/* Links úteis */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="link" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Links úteis</Text>
          </View>

          <LinearGradient
            colors={[colors.card, colors.background]}
            style={styles.linksCard}
          >
            {links.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.linkItem, index === links.length - 1 && styles.linkItemLast]}
                onPress={() => handleLinkPress(link.url)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(108,99,255,0.15)', 'rgba(108,99,255,0.05)']}
                  style={styles.linkIcon}
                >
                  <Icon name={link.icon} size={20} color={colors.primary} />
                </LinearGradient>
                <View style={styles.linkContent}>
                  <Text style={styles.linkName}>{link.name}</Text>
                  <Text style={styles.linkValue}>{link.value}</Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </LinearGradient>
        </View>

        {/* Estatísticas */}
        <View style={styles.statsSection}>
          <LinearGradient
            colors={[colors.card, colors.background]}
            style={styles.statsCard}
          >
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1.0</Text>
              <Text style={styles.statLabel}>Versão</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>100%</Text>
              <Text style={styles.statLabel}>Seguro</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Suporte</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Créditos */}
        <View style={styles.creditsContainer}>
          <Text style={styles.creditsText}>© 2026 Falou App</Text>
          <Text style={styles.creditsSubtext}>Todos os direitos reservados</Text>
          <Text style={styles.developerText}>Desenvolvido com ❤️ pela equipe Falou</Text>
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
  
  // Logo
  logoContainer: { alignItems: 'center', marginTop: 20, marginBottom: 24 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  appNameGradient: { marginBottom: 8 },
  appName: { fontSize: 32, fontWeight: 'bold', color: colors.text, letterSpacing: 2 },
  appVersion: { fontSize: 13, color: colors.textSecondary },
  badgeContainer: { flexDirection: 'row', gap: 10, marginTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: colors.text, fontSize: 11, fontWeight: '500' },
  
  // Descrição
  descriptionCard: { marginHorizontal: 20, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.border },
  description: { fontSize: 14, lineHeight: 22, color: colors.text, textAlign: 'center' },
  
  // Seções
  section: { marginHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  
  // Features grid
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureCard: { width: '48%', padding: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  featureIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  featureName: { color: colors.text, fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  featureDesc: { color: colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 4 },
  
  // Links Card
  linksCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  linkItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  linkItemLast: { borderBottomWidth: 0 },
  linkIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  linkContent: { flex: 1 },
  linkName: { color: colors.text, fontSize: 15, fontWeight: '500' },
  linkValue: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  
  // Stats
  statsSection: { marginHorizontal: 20, marginTop: 24 },
  statsCard: { flexDirection: 'row', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { color: colors.primary, fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: colors.border },
  
  // Créditos
  creditsContainer: { alignItems: 'center', marginTop: 32, marginBottom: 20 },
  creditsText: { color: colors.textSecondary, fontSize: 12 },
  creditsSubtext: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  developerText: { color: 'rgba(108,99,255,0.6)', fontSize: 10, marginTop: 8 },
});