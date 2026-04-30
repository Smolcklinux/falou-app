/**
 * ============================================
 * FALOU - TELA DE AUTENTICAÇÃO
 * ============================================
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Animated, Dimensions,
  KeyboardAvoidingView, Platform, ImageBackground, ScrollView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { loginUser, registerUser } from '../services/auth';
import { createUserProfile } from '../services/firestore/index';
import { colors } from '../utils/colors';

const { width, height } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Ops!', 'Preencha todos os campos para continuar');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Email inválido', 'Digite um endereço de email válido');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Senha fraca', 'A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Senhas não coincidem', 'Verifique se as senhas são iguais');
      return;
    }

    setLoading(true);
    
    if (isLogin) {
      const result = await loginUser(email, password);
      if (!result.success) {
        Alert.alert('Erro ao entrar', result.error);
        setLoading(false);
      }
    } else {
      const tempNick = email.split('@')[0];
      const result = await registerUser(email, password, tempNick);
      if (result.success) {
        const profileResult = await createUserProfile(result.user.uid, { 
          nick: tempNick, 
          email: email,
          profileCompleted: false 
        });
        if (profileResult.success) {
          navigation.replace('CompleteProfile');
        } else {
          Alert.alert('Erro', 'Falha ao criar perfil: ' + profileResult.error);
          setLoading(false);
        }
      } else {
        Alert.alert('Erro ao cadastrar', result.error);
        setLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070' }}
      style={styles.background}
      blurRadius={2}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.85)', '#0a0a15']}
        style={styles.overlay}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.container}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <View style={styles.logoSection}>
                <LinearGradient
                  colors={[colors.primary, '#4ecdc4']}
                  style={styles.logoCircle}
                >
                  <Icon name="microphone-variant" size={55} color="#fff" />
                </LinearGradient>
                
                <Text style={styles.appName}>FALOU</Text>
                <Text style={styles.tagline}>Sua voz conecta pessoas</Text>
              </View>

              <View style={styles.card}>
                <LinearGradient
                  colors={['rgba(22,33,62,0.9)', 'rgba(22,33,62,0.7)']}
                  style={styles.cardGradient}
                >
                  <Text style={styles.cardTitle}>
                    {isLogin ? '🎤 Entrar' : '✨ Criar Conta'}
                  </Text>

                  <View style={styles.form}>
                    {/* Email */}
                    <View style={styles.inputWrapper}>
                      <LinearGradient
                        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                        style={styles.inputGradient}
                      >
                        <Icon name="email" size={22} color={colors.textSecondary} />
                        <TextInput
                          style={styles.input}
                          placeholder="Email"
                          placeholderTextColor={colors.textSecondary + '80'}
                          value={email}
                          onChangeText={setEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          editable={!loading}
                        />
                      </LinearGradient>
                    </View>

                    {/* Senha */}
                    <View style={styles.inputWrapper}>
                      <LinearGradient
                        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                        style={styles.inputGradient}
                      >
                        <Icon name="lock" size={22} color={colors.textSecondary} />
                        <TextInput
                          style={styles.input}
                          placeholder="Senha"
                          placeholderTextColor={colors.textSecondary + '80'}
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          editable={!loading}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                          <Icon name={showPassword ? "eye-off" : "eye"} size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </LinearGradient>
                    </View>

                    {/* Confirmar Senha */}
                    {!isLogin && (
                      <View style={styles.inputWrapper}>
                        <LinearGradient
                          colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                          style={styles.inputGradient}
                        >
                          <Icon name="lock-check" size={22} color={colors.textSecondary} />
                          <TextInput
                            style={styles.input}
                            placeholder="Confirmar senha"
                            placeholderTextColor={colors.textSecondary + '80'}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            editable={!loading}
                          />
                          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={colors.textSecondary} />
                          </TouchableOpacity>
                        </LinearGradient>
                      </View>
                    )}

                    {/* Botão */}
                    <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 16 }}>
                      <TouchableOpacity
                        onPress={handleAuth}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        disabled={loading}
                        activeOpacity={0.9}
                      >
                        <LinearGradient
                          colors={[colors.primary, '#4ecdc4']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.mainButton}
                        >
                          {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <>
                              <Icon name={isLogin ? "login" : "account-plus"} size={20} color="#fff" />
                              <Text style={styles.mainButtonText}>
                                {isLogin ? 'Entrar' : 'Criar Conta'}
                              </Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>

                    {/* Switch */}
                    <TouchableOpacity style={styles.switchButton} onPress={toggleMode}>
                      <Text style={styles.switchText}>
                        {isLogin ? 'Novo por aqui? ' : 'Já tem conta? '}
                        <Text style={styles.switchHighlight}>
                          {isLogin ? 'Criar conta gratuita' : 'Fazer login'}
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1 },
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  appName: { fontSize: 44, fontWeight: '800', color: '#fff', letterSpacing: 2, textAlign: 'center' },
  tagline: { fontSize: 13, color: '#aaa', textAlign: 'center', marginTop: 4 },
  card: { borderRadius: 32, overflow: 'hidden' },
  cardGradient: { padding: 24 },
  cardTitle: { fontSize: 28, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 28 },
  form: { gap: 16 },
  inputWrapper: { borderRadius: 20, overflow: 'hidden' },
  inputGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  input: { flex: 1, color: '#fff', fontSize: 16, padding: 0 },
  mainButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 30 },
  mainButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchButton: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  switchText: { color: '#aaa', fontSize: 14 },
  switchHighlight: { color: '#6c63ff', fontWeight: '600' },
});
