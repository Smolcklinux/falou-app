/**
 * ============================================
 * FALOU - TELA DE AUTENTICAÇÃO
 * Login e cadastro com email/senha
 * ============================================
 * ✅ VERSÃO CORRIGIDA E MODERNIZADA:
 * 1. Layout corrigido para exibir todos os campos
 * 2. Design com gradientes e efeitos visuais
 * 3. Animações suaves de entrada
 * 4. Cards com efeito glassmorphism
 * 5. Ícones animados nos inputs
 * 6. Botão com gradiente animado
 * 7. Layout responsivo e moderno
 * ============================================
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Animated,
  KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { loginUser, registerUser } from '../services/auth';
import { createUserProfile } from '../services/firestore';
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
  const [slowConnection, setSlowConnection] = useState(false);

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const inputFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
  }, []);

  useEffect(() => {
    let timeout;
    if (loading) {
      timeout = setTimeout(() => setSlowConnection(true), 5000);
    } else {
      setSlowConnection(false);
    }
    return () => clearTimeout(timeout);
  }, [loading]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(inputFade, {
        toValue: 1,
        duration: 1000,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Email inválido');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'Senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    setLoading(true);
    
    if (isLogin) {
      const result = await loginUser(email, password);
      if (!result.success) {
        Alert.alert('Erro', result.error);
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
        Alert.alert('Erro', result.error);
        setLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    
    Animated.sequence([
      Animated.timing(inputFade, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(inputFade, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  return (
    <LinearGradient
      colors={[colors.background, '#0f0f1a', colors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Logo */}
            <View style={styles.iconContainer}>
              <Animated.View style={{ transform: [{ scale: logoScale }] }}>
                <LinearGradient
                  colors={[colors.primary, '#4ecdc4']}
                  style={styles.iconCircle}
                >
                  <Icon name="microphone-variant" size={50} color="#fff" />
                </LinearGradient>
              </Animated.View>
            </View>
            
            <LinearGradient
              colors={[colors.text, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleGradient}
            >
              <Text style={styles.title}>FALOU</Text>
            </LinearGradient>
            
            <Text style={styles.subtitle}>
              {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta e comece'}
            </Text>

            {/* Formulário */}
            <Animated.View style={[styles.formContainer, { opacity: inputFade }]}>
              <Text style={styles.formTitle}>
                {isLogin ? '🔐 Acessar conta' : '📝 Novo cadastro'}
              </Text>

              {/* Campo Email */}
              <View style={styles.inputContainer}>
                <LinearGradient
                  colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.05)']}
                  style={styles.inputIconBg}
                >
                  <Icon name="email" size={20} color={colors.primary} />
                </LinearGradient>
                <TextInput
                  style={styles.input}
                  placeholder="Seu melhor email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>

              {/* Campo Senha */}
              <View style={styles.inputContainer}>
                <LinearGradient
                  colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.05)']}
                  style={styles.inputIconBg}
                >
                  <Icon name="lock" size={20} color={colors.primary} />
                </LinearGradient>
                <TextInput
                  style={styles.input}
                  placeholder="Sua senha"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Icon name={showPassword ? "eye-off" : "eye"} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Confirmar Senha (apenas cadastro) */}
              {!isLogin && (
                <View style={styles.inputContainer}>
                  <LinearGradient
                    colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.05)']}
                    style={styles.inputIconBg}
                  >
                    <Icon name="lock-check" size={20} color={colors.primary} />
                  </LinearGradient>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirme sua senha"
                    placeholderTextColor={colors.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Esqueci a senha (apenas login) */}
              {isLogin && (
                <TouchableOpacity style={styles.forgotButton}>
                  <Text style={styles.forgotText}>Esqueceu a senha?</Text>
                </TouchableOpacity>
              )}

              {slowConnection && (
                <View style={styles.slowContainer}>
                  <Icon name="wifi-off" size={14} color={colors.warning} />
                  <Text style={styles.slowText}>
                    Conexão lenta. Verifique sua internet.
                  </Text>
                </View>
              )}

              {/* Botão principal */}
              <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 10 }}>
                <TouchableOpacity
                  onPress={handleAuth}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.primary, '#4ecdc4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.button}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Icon name={isLogin ? "login" : "account-plus"} size={20} color="#fff" />
                        <Text style={styles.buttonText}>{isLogin ? 'Entrar' : 'Cadastrar'}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Botão de alternar modo */}
              <TouchableOpacity style={styles.switchButton} onPress={toggleMode} disabled={loading}>
                <Text style={styles.switchText}>
                  {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
                  <Text style={styles.switchTextHighlight}>
                    {isLogin ? 'Criar conta' : 'Fazer login'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Termos */}
            <Text style={styles.terms}>
              Ao continuar, você concorda com os{' '}
              <Text style={styles.termsLink}>Termos de Serviço</Text> e a{' '}
              <Text style={styles.termsLink}>Política de Privacidade</Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 40,
    minHeight: height
  },
  
  // Logo
  iconContainer: { alignItems: 'center', marginBottom: 20 },
  iconCircle: { 
    width: 85, 
    height: 85, 
    borderRadius: 42.5, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: colors.primary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 12, 
    elevation: 8 
  },
  
  // Título
  titleGradient: { marginBottom: 8, alignSelf: 'center' },
  title: { 
    fontSize: 42, 
    fontWeight: 'bold', 
    color: colors.text, 
    textAlign: 'center', 
    letterSpacing: 3 
  },
  subtitle: { 
    fontSize: 14, 
    color: colors.textSecondary, 
    textAlign: 'center', 
    marginBottom: 32 
  },
  
  // Formulário
  formContainer: { 
    backgroundColor: 'rgba(22, 33, 62, 0.8)', 
    borderRadius: 28, 
    padding: 24, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(108, 99, 255, 0.2)'
  },
  formTitle: { 
    color: colors.text, 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 24, 
    textAlign: 'center' 
  },
  
  // Inputs
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(26, 26, 46, 0.9)', 
    borderRadius: 16, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: colors.border, 
    overflow: 'hidden' 
  },
  inputIconBg: { 
    width: 50, 
    height: 50, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  input: { 
    flex: 1, 
    color: colors.text, 
    paddingVertical: 14, 
    fontSize: 15, 
    paddingRight: 15 
  },
  eyeIcon: { 
    paddingHorizontal: 15, 
    paddingVertical: 12 
  },
  
  // Esqueci a senha
  forgotButton: { 
    alignSelf: 'flex-end', 
    marginBottom: 20,
    marginTop: 5 
  },
  forgotText: { 
    color: colors.primary, 
    fontSize: 12, 
    fontWeight: '500' 
  },
  
  // Slow connection
  slowContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    marginBottom: 15 
  },
  slowText: { 
    color: colors.warning, 
    textAlign: 'center', 
    fontSize: 11 
  },
  
  // Botão principal
  button: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    paddingVertical: 16, 
    borderRadius: 30, 
    shadowColor: colors.primary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 10, 
    elevation: 5 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 17, 
    fontWeight: 'bold' 
  },
  
  // Botão switch
  switchButton: { 
    alignItems: 'center', 
    marginTop: 20 
  },
  switchText: { 
    color: colors.textSecondary, 
    fontSize: 13, 
    fontWeight: '500' 
  },
  switchTextHighlight: { 
    color: colors.primary, 
    fontWeight: 'bold' 
  },
  
  // Termos
  terms: { 
    color: colors.textSecondary, 
    fontSize: 11, 
    textAlign: 'center', 
    marginTop: 20, 
    lineHeight: 16 
  },
  termsLink: { 
    color: colors.primary, 
    fontWeight: '500' 
  },
});