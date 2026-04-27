/**
 * ============================================
 * FALOU - TELA DE SPLASH (ABERTURA)
 * ============================================
 * ✅ VERSÃO MODERNIZADA:
 * 1. Design com gradientes e efeitos visuais
 * 2. Múltiplas animações simultâneas
 * 3. Logo com efeito pulsante
 * 4. Barra de progresso animada
 * 5. Versão do app exibida
 * 6. Compatível com iOS e Android
 * ============================================
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../utils/colors';

const { width, height } = Dimensions.get('window');
const APP_VERSION = '1.0.0';

export default function SplashScreen({ navigation }) {
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startAnimations();
    
    // Navegar para Auth após 3 segundos
    const timer = setTimeout(() => {
      navigation.replace('Auth');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const startAnimations = () => {
    // Animação de rotação do logo
    const rotate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    });

    // Animação de pulso do logo
    const pulse = pulseAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.1, 1]
    });

    // Animações paralelas principais
    Animated.parallel([
      // Fade da logo
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Scale da logo
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
      // Bounce do texto
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 3,
        tension: 60,
        useNativeDriver: true,
      }),
      // Rotação da logo
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      // Pulso da logo
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Animação da barra de progresso
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2800,
      useNativeDriver: false,
    }).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const pulse = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08]
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <LinearGradient
      colors={[colors.background, '#0f0f1a', colors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Efeito de brilho no fundo */}
      <LinearGradient
        colors={['transparent', 'rgba(108,99,255,0.05)', 'transparent']}
        style={styles.glowEffect}
      />

      {/* Logo com animações */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { rotate }]
          }
        ]}
      >
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <LinearGradient
            colors={[colors.primary, '#4ecdc4']}
            style={styles.logoCircle}
          >
            <Icon name="microphone-variant" size={70} color="#fff" />
          </LinearGradient>
        </Animated.View>
      </Animated.View>

      {/* Texto do app */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{
            translateY: bounceAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          }]
        }}
      >
        <LinearGradient
          colors={[colors.text, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.titleGradient}
        >
          <Text style={styles.title}>FALOU</Text>
        </LinearGradient>
        <Text style={styles.subtitle}>Sua voz conecta pessoas</Text>
        <Text style={styles.tagline}>Salas de voz ao vivo</Text>
      </Animated.View>

      {/* Barra de progresso moderna */}
      <Animated.View
        style={[
          styles.loadingContainer,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <View style={styles.progressWrapper}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: progressWidth }
              ]}
            />
          </View>
          <View style={styles.progressSteps}>
            <View style={[styles.progressStep, styles.progressStepActive]} />
            <View style={[styles.progressStep, progressAnim.interpolate({
              inputRange: [0, 0.33, 0.34],
              outputRange: [0, 0, 1]
            })]} />
            <View style={[styles.progressStep, progressAnim.interpolate({
              inputRange: [0, 0.66, 0.67],
              outputRange: [0, 0, 1]
            })]} />
          </View>
        </View>
        <Text style={styles.loadingText}>Carregando experiência incrível...</Text>
      </Animated.View>

      {/* Versão do app */}
      <Animated.View
        style={[
          styles.versionContainer,
          { opacity: fadeAnim }
        ]}
      >
        <Text style={styles.versionText}>Versão {APP_VERSION}</Text>
        <Text style={styles.copyrightText}>© 2026 Falou App</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 15,
  },
  titleGradient: {
    marginTop: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
    width: width - 80,
  },
  progressWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  progressStep: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressStepActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },
  versionContainer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  versionText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    textAlign: 'center',
  },
  copyrightText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
  },
});