/**
 * ============================================
 * FALOU - TELA DE SPLASH COM VERIFICAÇÃO
 * ============================================
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../../config/firebase';
import { getUserProfile } from '../services/firestore/index';
import { colors } from '../utils/colors';

const { width, height } = Dimensions.get('window');
const APP_VERSION = '1.0.0';

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
    checkAuthAndNavigate();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
    ]).start();

    Animated.timing(progressAnim, { toValue: 1, duration: 2000, useNativeDriver: false }).start();
  };

  const checkAuthAndNavigate = async () => {
    // Aguardar um pouco para a animação
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const user = auth.currentUser;
      console.log('🔍 Verificando auth, user:', user ? user.uid : 'null');
      
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile.success && profile.data.profileCompleted) {
          navigation.replace('Main');
        } else {
          navigation.replace('CompleteProfile');
        }
      } else {
        navigation.replace('Auth');
      }
    } catch (error) {
      console.error('Erro no splash:', error);
      navigation.replace('Auth');
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <LinearGradient colors={[colors.background, '#0f0f1a', colors.card]} style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.logoCircle}>
          <Icon name="microphone-variant" size={70} color="#fff" />
        </LinearGradient>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.title}>FALOU</Text>
        <Text style={styles.subtitle}>Sua voz conecta pessoas</Text>
      </Animated.View>

      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingText}>Carregando...</Text>
      </Animated.View>

      <Text style={styles.versionText}>Versão {APP_VERSION}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  logoCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 25, elevation: 15 },
  title: { fontSize: 48, fontWeight: 'bold', color: colors.text, letterSpacing: 3, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
  loadingContainer: { position: 'absolute', bottom: 80, alignItems: 'center', width: width - 80 },
  progressBar: { width: '100%', height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  loadingText: { color: colors.textSecondary, fontSize: 12, marginTop: 16, textAlign: 'center' },
  versionText: { position: 'absolute', bottom: 30, color: 'rgba(255,255,255,0.3)', fontSize: 10, textAlign: 'center' },
});
