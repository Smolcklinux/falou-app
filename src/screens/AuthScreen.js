/**
 * ============================================
 * FALOU - TELA DE AUTENTICAÇÃO (PREMIUM)
 * Design moderno com efeitos de vidro e partículas
 * ============================================
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Animated, Dimensions,
  KeyboardAvoidingView, Platform, ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
  const [focusedField, setFocusedField] = useState(null);

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(cardAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(particleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(particleAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
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
    setFocusedField(null);
    
    Animated.sequence([
      Animated.timing(cardAnim, { toValue: 0.95, duration: 150, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const renderInput = (icon, placeholder, value, onChange, isPassword = false, fieldName = '') => {
    const isFocused = focusedField === fieldName;
    const showEye = isPassword && fieldName === 'password';
    const showConfirmEye = isPassword && fieldName === 'confirmPassword';
    
    return (
      <Animated.View 
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          { transform: [{ scale: isFocused ? 1.02 : 1 }] }
        ]}
      >
        <LinearGradient
          colors={isFocused ? ['rgba(108,99,255,0.15)', 'rgba(108,99,255,0.05)'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
          style={styles.inputGradient}
        >
          <Icon name={icon} size={22} color={isFocused ? colors.primary : colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary + '80'}
            value={value}
            onChangeText={onChange}
            secureTextEntry={isPassword && (fieldName === 'password' ? !showPassword : !showConfirmPassword)}
            autoCapitalize="none"
            keyboardType={icon === 'email' ? 'email-address' : 'default'}
            editable={!loading}
            onFocus={() => setFocusedField(fieldName)}
            onBlur={() => setFocusedField(null)}
          />
          {isPassword && (
            <TouchableOpacity 
              onPress={() => fieldName === 'password' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeButton}
            >
              <Icon 
                name={(fieldName === 'password' ? showPassword : showConfirmPassword) ? "eye-off" : "eye"} 
                size={20} 
                color={isFocused ? colors.primary : colors.textSecondary} 
              />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </Animated.View>
    );
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
              {/* Logo Animada */}
              <View style={styles.logoSection}>
                <Animated.View style={{ transform: [{ scale: cardAnim }] }}>
                  <LinearGradient
                    colors={[colors.primary, '#4ecdc4']}
                    style={styles.logoCircle}
                  >
                    <Icon name="microphone-variant" size={55} color="#fff" />
                  </LinearGradient>
                </Animated.View>
                
                <Animated.View style={{ opacity: fadeAnim }}>
                  <Text style={styles.appName}>
                    FALOU
                    <Text style={styles.appNameDot}>.</Text>
                  </Text>
                  <Text style={styles.tagline}>Sua voz conecta pessoas</Text>
                </Animated.View>
              </View>

              {/* Card Principal com efeito glassmorphism */}
              <Animated.View style={[styles.card, { transform: [{ scale: cardAnim }] }]}>
                <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
                  <LinearGradient
                    colors={['rgba(22,33,62,0.6)', 'rgba(22,33,62,0.3)']}
                    style={styles.cardGradient}
                  >
                    <Text style={styles.cardTitle}>
                      {isLogin ? '🎤 Entrar' : '✨ Criar Conta'}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {isLogin ? 'Bem-vindo de volta à comunidade' : 'Comece sua jornada no Falou'}
                    </Text>

                    {/* Formulário */}
                    <View style={styles.form}>
                      {renderInput('email', 'Email', email, setEmail, false, 'email')}
                      {renderInput('lock', 'Senha', password, setPassword, true, 'password')}
                      
                      {!isLogin && renderInput('lock-check', 'Confirmar senha', confirmPassword, setConfirmPassword, true, 'confirmPassword')}

                      {isLogin && (
                        <TouchableOpacity style={styles.forgotLink}>
                          <Text style={styles.forgotText}>Esqueceu a senha?</Text>
                        </TouchableOpacity>
                      )}

                      {/* Botão Principal */}
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
                                  {isLogin ? 'Entrar na Conta' : 'Criar Conta'}
                                </Text>
                              </>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>

                      {/* Divisor */}
                      <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>ou</Text>
                        <View style={styles.dividerLine} />
                      </View>

                      {/* Botões Sociais */}
                      <View style={styles.socialButtons}>
                        <TouchableOpacity style={styles.socialButton}>
                          <LinearGradient
                            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                            style={styles.socialButtonGradient}
                          >
                            <Icon name="google" size={24} color="#DB4437" />
                          </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialButton}>
                          <LinearGradient
                            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                            style={styles.socialButtonGradient}
                          >
                            <Icon name="apple" size={24} color="#fff" />
                          </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialButton}>
                          <LinearGradient
                            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                            style={styles.socialButtonGradient}
                          >
                            <Icon name="facebook" size={24} color="#4267B2" />
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>

                      {/* Switch entre login/cadastro */}
                      <TouchableOpacity style={styles.switchButton} onPress={toggleMode}>
                        <Text style={styles.switchText}>
                          {isLogin ? 'Novo por aqui? ' : 'Já tem conta? '}
                          <Text style={styles.switchHighlight}>
                            {isLogin ? 'Criar conta gratuita' : 'Fazer login'}
                          </Text>
                        </Text>
                      </TouchableOpacity>

                      {/* Termos */}
                      <Text style={styles.terms}>
                        Ao continuar, você concorda com nossos{' '}
                        <Text style={styles.termsLink}>Termos</Text> e{' '}
                        <Text style={styles.termsLink}>Política de Privacidade</Text>
                      </Text>
                    </View>
                  </LinearGradient>
                </BlurView>
              </Animated.View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 16,
  },
  appName: {
    fontSize: 44,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
    textAlign: 'center',
  },
  appNameDot: {
    color: colors.primary,
  },
  tagline: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // Card
  card: {
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 32,
  },
  cardGradient: {
    padding: 24,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },

  // Form
  form: {
    gap: 16,
  },
  inputWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    padding: 0,
  },
  eyeButton: {
    padding: 4,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },

  // Botão Principal
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Divisor
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  // Botões Sociais
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    borderRadius: 40,
    overflow: 'hidden',
  },
  socialButtonGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // Switch
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  switchHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Termos
  terms: {
    color: colors.textSecondary + '99',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '500',
  },
});