/**
 * ============================================
 * FALOU - TELA DE COMPLETAR PERFIL
 * ============================================
 * ✅ CORREÇÕES REALIZADAS:
 * 1. Adicionada verificação de permissão com cache (não pede toda vez)
 * 2. Adicionado suporte para Android 13+ (READ_MEDIA_IMAGES)
 * 3. Adicionado Linking para abrir configurações quando permissão negada
 * 4. Adicionado tratamento de erro para upload de avatar
 * 5. Adicionadas animações suaves
 * 6. Melhorada validação dos campos
 * 7. Adicionados comentários explicativos
 * ============================================
 * Após o cadastro, o usuário completa seu perfil:
 * - Avatar (upload com permissão de galeria - apenas uma vez)
 * - Nome
 * - Gênero (não pode ser alterado depois)
 * - País
 * - Idade
 * - Idioma
 * ============================================
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Animated,
  Linking  // ✅ ADD: Para abrir configurações quando permissão negada
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../../config/firebase';
import { completeUserProfile } from '../services/firestore';
import { pickAndUploadImage } from '../services/cloudinary';
import { ensureGalleryPermission } from '../services/permissions'; // ✅ Permissão com cache
import { colors } from '../utils/colors';

export default function CompleteProfileScreen({ navigation }) {
  // Estados do formulário
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [nome, setNome] = useState('');
  const [genero, setGenero] = useState('');
  const [pais, setPais] = useState('');
  const [idioma, setIdioma] = useState('');
  const [idade, setIdade] = useState('');
  
  // Estados de animação
  const [scaleAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  
  // ✅ Verificar permissão de galeria AO CARREGAR A TELA (apenas uma vez)
  useEffect(() => {
    // Animação de entrada
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
    ]).start();
    
    // ✅ Verificar permissão de galeria silenciosamente (sem alerta)
    // Isso evita que o app peça permissão toda vez que o usuário tentar subir foto
    const checkPermissions = async () => {
      try {
        // Verifica se já tem permissão (usando cache)
        const hasPermission = await ensureGalleryPermission();
        if (hasPermission) {
          console.log('✅ [CompleteProfile] Permissão da galeria já concedida');
        } else {
          console.log('⚠️ [CompleteProfile] Permissão da galeria não concedida ainda');
          // Não mostra alerta aqui, apenas registra
          // O pedido será feito quando o usuário clicar no botão de adicionar foto
        }
      } catch (error) {
        console.error('Erro ao verificar permissão:', error);
      }
    };
    
    checkPermissions();
  }, []);

  // Lista de países disponíveis
  const paises = [
    'Brasil', 'Portugal', 'Angola', 'Moçambique', 'Cabo Verde',
    'Guiné-Bissau', 'São Tomé e Príncipe', 'Timor-Leste', 'Outro'
  ];

  // Lista de idiomas disponíveis
  const idiomas = ['Português', 'Inglês', 'Espanhol', 'Francês'];

  // Animação do botão ao clicar
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  /**
   * ✅ Upload do avatar com permissão de galeria (com cache e suporte Android 13+)
   * - Só vai pedir permissão na PRIMEIRA vez que o usuário clicar
   * - Depois disso, usa o cache e não pergunta mais
   * - Se negado, oferece link para configurações
   */
  const handleUploadAvatar = async () => {
    try {
      // ✅ Verificar permissão da galeria (usando cache)
      // A primeira vez pede, as próximas não
      const hasPermission = await ensureGalleryPermission();
      
      if (!hasPermission) {
        // ✅ Mostrar alerta com opção de abrir configurações (igual ao seu screenshot)
        Alert.alert(
          '📸 Permissão Necessária',
          'Para adicionar uma foto de perfil, você precisa permitir o acesso à galeria.\n\nToque em "Abrir Configurações" e permita o acesso.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }
      
      // Se tem permissão, fazer upload
      setUploading(true);
      const result = await pickAndUploadImage();
      
      if (result.success) {
        setAvatarUrl(result.url);
        Alert.alert('Sucesso! 🎉', 'Sua foto de perfil foi atualizada!');
      } else if (result.error !== 'Nenhuma imagem selecionada') {
        Alert.alert('Erro', result.error);
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      Alert.alert('Erro', 'Não foi possível carregar a imagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  /**
   * ✅ Valida e completa o perfil do usuário
   */
  const handleCompleteProfile = async () => {
    // Validações dos campos
    if (!nome.trim()) {
      Alert.alert('Erro', 'Por favor, digite seu nome');
      return;
    }
    
    if (nome.trim().length < 3) {
      Alert.alert('Erro', 'O nome deve ter pelo menos 3 caracteres');
      return;
    }
    
    if (!genero) {
      Alert.alert('Erro', 'Por favor, selecione seu gênero');
      return;
    }
    
    if (!pais) {
      Alert.alert('Erro', 'Por favor, selecione seu país');
      return;
    }
    
    const idadeNum = parseInt(idade);
    if (!idade || isNaN(idadeNum) || idadeNum < 13 || idadeNum > 120) {
      Alert.alert('Erro', 'Idade inválida (mínimo 13 anos, máximo 120 anos)');
      return;
    }

    setLoading(true);
    animateButton();
    
    // Preparar dados para salvar
    const updateData = {
      nick: nome.trim(),
      avatarUrl: avatarUrl || null,
      gender: genero,
      country: pais,
      language: idioma || 'Português',
      age: idadeNum,
      profileCompleted: true
    };
    
    try {
      const result = await completeUserProfile(auth.currentUser.uid, updateData);
      
      if (result.success) {
        Alert.alert(
          'Bem-vindo ao Falou! 🎤',
          'Seu perfil foi criado com sucesso! Agora você pode explorar o app.',
          [{ text: 'Começar', onPress: () => navigation.replace('Main') }]
        );
      } else {
        Alert.alert('Erro', result.error || 'Falha ao completar cadastro');
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao completar perfil:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
      setLoading(false);
    }
  };

  // Renderizar botão de gênero
  const renderGenderButton = (gender, label, icon) => (
    <TouchableOpacity
      style={[styles.genderButton, genero === gender && styles.genderActive]}
      onPress={() => setGenero(gender)}
      activeOpacity={0.8}
    >
      <View style={[styles.genderIconContainer, genero === gender && styles.genderIconActive]}>
        <Icon name={icon} size={28} color={genero === gender ? colors.text : colors.primary} />
      </View>
      <Text style={[styles.genderText, genero === gender && styles.genderTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={[colors.background, colors.card]} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header com animação */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Icon name="account-edit" size={50} color={colors.primary} />
            </View>
            <Text style={styles.title}>Complete seu perfil</Text>
            <Text style={styles.subtitle}>Personalize sua experiência no Falou</Text>
          </View>
        </Animated.View>

        {/* Avatar - com verificação de permissão aprimorada */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity 
              onPress={handleUploadAvatar} 
              disabled={uploading}
              style={styles.avatarTouchable}
              activeOpacity={0.7}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Icon name="camera-plus" size={36} color={colors.textSecondary} />
                  <Text style={styles.avatarText}>Adicionar foto</Text>
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Icon name="camera" size={16} color={colors.text} />
              </View>
            </TouchableOpacity>
            
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.uploadingText}>Enviando...</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Nome */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
          <View style={styles.inputCard}>
            <View style={styles.inputWrapper}>
              <Icon name="account" size={20} color={colors.primary} />
              <TextInput
                style={styles.input}
                placeholder="Seu nome"
                placeholderTextColor={colors.textSecondary}
                value={nome}
                onChangeText={setNome}
                maxLength={30}
              />
            </View>
          </View>
        </Animated.View>

        {/* Gênero */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Icon name="gender-male-female" size={16} color={colors.primary} /> Gênero
            </Text>
            <View style={styles.genderRow}>
              {renderGenderButton('Masculino', 'Homem', 'gender-male')}
              {renderGenderButton('Feminino', 'Mulher', 'gender-female')}
            </View>
            <View style={styles.warningContainer}>
              <Icon name="lock-alert" size={12} color={colors.warning} />
              <Text style={styles.warningText}>O gênero não pode ser alterado após a confirmação</Text>
            </View>
          </View>
        </Animated.View>

        {/* País */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Icon name="map-marker" size={16} color={colors.primary} /> País
            </Text>
            <View style={styles.chipsContainer}>
              {paises.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, pais === p && styles.chipActive]}
                  onPress={() => setPais(p)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, pais === p && styles.chipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Idade */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
          <View style={styles.inputCard}>
            <View style={styles.inputWrapper}>
              <Icon name="cake-variant" size={20} color={colors.primary} />
              <TextInput
                style={styles.input}
                placeholder="Idade"
                placeholderTextColor={colors.textSecondary}
                value={idade}
                onChangeText={setIdade}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>
        </Animated.View>

        {/* Idioma */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Icon name="translate" size={16} color={colors.primary} /> Idioma
            </Text>
            <View style={styles.chipsContainer}>
              {idiomas.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.chip, idioma === lang && styles.chipActive]}
                  onPress={() => setIdioma(lang)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, idioma === lang && styles.chipTextActive]}>{lang}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Botão finalizar animado */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: fadeAnim }}>
          <TouchableOpacity
            style={[styles.button, (loading || uploading) && styles.buttonDisabled]}
            onPress={handleCompleteProfile}
            disabled={loading || uploading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Icon name="rocket-launch" size={20} color={colors.text} />
                <Text style={styles.buttonText}>Começar a viajar</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Footer com informações de segurança */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Seus dados estão seguros e serão usados apenas para conectar você com pessoas que compartilham interesses semelhantes.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 },
  
  // Header
  header: { alignItems: 'center', marginBottom: 32 },
  headerIcon: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: 'rgba(108, 99, 255, 0.1)', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 16 
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#aaaaaa', marginTop: 8, textAlign: 'center' },
  
  // Avatar
  avatarContainer: { alignItems: 'center', marginBottom: 32, position: 'relative' },
  avatarTouchable: { position: 'relative' },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  avatarPlaceholder: { 
    backgroundColor: '#16213e', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#6c63ff',
    borderStyle: 'dashed'
  },
  avatarText: { color: '#aaaaaa', fontSize: 11, marginTop: 8 },
  avatarBadge: { 
    position: 'absolute', 
    bottom: 5, 
    right: 5, 
    backgroundColor: '#6c63ff', 
    borderRadius: 20, 
    width: 32, 
    height: 32, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1a1a2e'
  },
  uploadingOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    borderRadius: 55, 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8
  },
  uploadingText: { color: '#ffffff', fontSize: 12 },
  
  // Inputs
  inputCard: { 
    backgroundColor: '#16213e', 
    borderRadius: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a4a'
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    gap: 12
  },
  input: { 
    flex: 1, 
    color: '#ffffff', 
    paddingVertical: 16,
    fontSize: 16 
  },
  
  // Seções
  section: { marginBottom: 24 },
  sectionTitle: { 
    color: '#ffffff', 
    fontSize: 15, 
    fontWeight: '600', 
    marginBottom: 12,
    gap: 6
  },
  
  // Gênero
  genderRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  genderButton: { 
    flex: 1, 
    backgroundColor: '#16213e', 
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center', 
    gap: 12,
    borderWidth: 1,
    borderColor: '#2a2a4a'
  },
  genderActive: { 
    backgroundColor: '#6c63ff', 
    borderColor: '#6c63ff',
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  genderIconContainer: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#1a1a2e', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  genderIconActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  genderText: { color: '#aaaaaa', fontSize: 14, fontWeight: '500' },
  genderTextActive: { color: '#ffffff' },
  
  // Avisos
  warningContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'center' },
  warningText: { color: '#ff6b6b', fontSize: 11, textAlign: 'center' },
  
  // Chips (país/idioma)
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { 
    backgroundColor: '#16213e', 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 30, 
    borderWidth: 1, 
    borderColor: '#2a2a4a' 
  },
  chipActive: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  chipText: { color: '#aaaaaa', fontSize: 14 },
  chipTextActive: { color: '#ffffff' },
  
  // Botão principal
  button: { 
    flexDirection: 'row',
    backgroundColor: '#6c63ff', 
    borderRadius: 30, 
    padding: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 17, fontWeight: 'bold' },
  
  // Footer
  footer: { marginTop: 24, paddingBottom: 20 },
  footerText: { color: '#666666', fontSize: 11, textAlign: 'center', lineHeight: 16 }
});