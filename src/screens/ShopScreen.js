/**
 * ============================================
 * FALOU - TELA DA LOJA
 * ============================================
 * ✅ VERSÃO MODERNIZADA:
 * 1. Design com gradientes e cards elegantes
 * 2. Animações suaves na entrada
 * 3. Header com gradiente
 * 4. Cards de itens com gradiente e efeitos
 * 5. Categorias de produtos
 * 6. Modal de confirmação de compra
 * 7. Indicador de carregamento
 * ============================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Animated, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../../config/firebase';
import { getUserProfile, updateUserStats, updateUserProfile } from '../services/firestore/index';
import { colors } from '../utils/colors';

// Itens da loja organizados por categoria
const shopItems = [
  { id: '1', name: 'Avatar Especial', price: 100, type: 'avatar', iconName: 'face-agent', description: 'Avatar exclusivo', color: ['#6c63ff', '#4ecdc4'], popular: true },
  { id: '2', name: 'Badge de Ouro', price: 50, type: 'badge', iconName: 'medal', description: 'Badge dourada', color: ['#FFD700', '#FFA500'], popular: true },
  { id: '3', name: 'Fundo Exclusivo', price: 200, type: 'background', iconName: 'palette', description: 'Background personalizado', color: ['#f093fb', '#f5576c'], popular: false },
  { id: '4', name: 'Emote Personalizado', price: 75, type: 'emote', iconName: 'emoticon-happy', description: 'Emote animado', color: ['#4facfe', '#00f2fe'], popular: true },
  { id: '5', name: 'Moldura Diamante', price: 300, type: 'frame', iconName: 'diamond-stone', description: 'Moldura premium', color: ['#43e97b', '#38f9d7'], popular: false },
  { id: '6', name: 'Sticker Pack', price: 40, type: 'sticker', iconName: 'sticker-emoji', description: 'Pacote de stickers', color: ['#fa709a', '#fee140'], popular: true },
  { id: '7', name: 'Ícone Exclusivo', price: 80, type: 'icon', iconName: 'star-circle', description: 'Ícone especial', color: ['#a18cd1', '#fbc2eb'], popular: false },
  { id: '8', name: 'Efeito Especial', price: 150, type: 'effect', iconName: 'sparkles', description: 'Efeito animado', color: ['#ff9a9e', '#fecfef'], popular: true },
];

const categories = ['Todos', 'Popular', 'Avatar', 'Badge', 'Emote', 'Sticker'];

export default function ShopScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadProfile();
    animateEntrance();
  }, []);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const loadProfile = async () => {
    setLoading(true);
    const result = await getUserProfile(auth.currentUser.uid);
    if (result.success) setUserProfile(result.data);
    setLoading(false);
  };

  const openConfirmModal = (item) => {
    setSelectedItem(item);
    setConfirmModalVisible(true);
  };

  const buyItem = async () => {
    if (!userProfile || !selectedItem) return;
    
    if (userProfile.wealth < selectedItem.price) {
      Alert.alert('Saldo insuficiente', `Você precisa de ${selectedItem.price} moedas para comprar ${selectedItem.name}`);
      setConfirmModalVisible(false);
      return;
    }

    setBuying(true);
    
    const newWealth = userProfile.wealth - selectedItem.price;
    const wealthResult = await updateUserStats(auth.currentUser.uid, { wealth: newWealth });

    if (wealthResult.success) {
      const inventory = userProfile.inventory || [];
      inventory.push({
        id: selectedItem.id,
        name: selectedItem.name,
        type: selectedItem.type,
        price: selectedItem.price,
        iconName: selectedItem.iconName,
        purchasedAt: new Date().toISOString()
      });
      
      const inventoryResult = await updateUserProfile(auth.currentUser.uid, { inventory });
      
      if (inventoryResult.success) {
        Alert.alert('🎉 Compra realizada!', `Você adquiriu ${selectedItem.name}!`);
        await loadProfile();
      } else {
        Alert.alert('Erro', 'Falha ao salvar item no inventário');
        await updateUserStats(auth.currentUser.uid, { wealth: userProfile.wealth });
      }
    } else {
      Alert.alert('Erro', 'Falha ao processar pagamento');
    }
    
    setBuying(false);
    setConfirmModalVisible(false);
    setSelectedItem(null);
  };

  // Filtrar itens por categoria
  const getFilteredItems = () => {
    if (selectedCategory === 'Todos') return shopItems;
    if (selectedCategory === 'Popular') return shopItems.filter(item => item.popular);
    return shopItems.filter(item => item.type === selectedCategory.toLowerCase());
  };

  const renderCategoryChip = ({ item }) => (
    <TouchableOpacity 
      style={[styles.categoryChip, selectedCategory === item && styles.activeCategoryChip]}
      onPress={() => setSelectedCategory(item)}
      activeOpacity={0.7}
    >
      <Text style={[styles.categoryText, selectedCategory === item && styles.activeCategoryText]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item, index }) => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity 
        style={styles.shopCard}
        onPress={() => openConfirmModal(item)}
        disabled={buying}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={item.color}
          style={styles.cardGradient}
        >
          <View style={styles.iconContainer}>
            <Icon name={item.iconName} size={40} color="#fff" />
          </View>
          {item.popular && (
            <View style={styles.popularBadge}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.popularBadgeGradient}>
                <Icon name="fire" size={10} color="#fff" />
                <Text style={styles.popularBadgeText}>Popular</Text>
              </LinearGradient>
            </View>
          )}
          <Text style={styles.shopName}>{item.name}</Text>
          <Text style={styles.shopDescription}>{item.description}</Text>
          <View style={styles.priceContainer}>
            <Icon name="wallet" size={14} color="#FFD700" />
            <Text style={styles.shopPrice}>{item.price}</Text>
            <Text style={styles.priceUnit}>moedas</Text>
          </View>
          <LinearGradient
            colors={[colors.primary, '#4ecdc4']}
            style={[styles.buyButton, (userProfile?.wealth < item.price) && styles.buyButtonDisabled]}
          >
            <Text style={styles.buyButtonText}>
              {userProfile?.wealth < item.price ? 'Saldo insuficiente' : 'Comprar'}
            </Text>
          </LinearGradient>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando loja...</Text>
      </View>
    );
  }

  const filteredItems = getFilteredItems();

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
          <Text style={styles.headerTitle}>Loja</Text>
          <TouchableOpacity style={styles.inventoryButton}>
            <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.1)']} style={styles.inventoryGradient}>
              <Icon name="shopping-outline" size={22} color={colors.primary} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Personalize sua experiência</Text>
      </LinearGradient>

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Card do Saldo */}
        <LinearGradient
          colors={[colors.card, colors.background]}
          style={styles.balanceCard}
        >
          <View style={styles.balanceIconContainer}>
            <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.balanceIconGradient}>
              <Icon name="wallet" size={24} color="#fff" />
            </LinearGradient>
          </View>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Seu saldo</Text>
            <Text style={styles.balanceAmount}>{userProfile?.wealth || 0} moedas</Text>
          </View>
          <TouchableOpacity style={styles.addCoinsButton}>
            <LinearGradient colors={['#4ecdc4', '#44a08d']} style={styles.addCoinsGradient}>
              <Icon name="plus" size={16} color="#fff" />
              <Text style={styles.addCoinsText}>Adicionar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Categorias */}
        <View style={styles.categoriesSection}>
          <FlatList
            data={categories}
            keyExtractor={(item) => item}
            renderItem={renderCategoryChip}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Grid de Itens */}
        <View style={styles.itemsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'Todos' ? '✨ Todos os itens' : `📦 ${selectedCategory}`}
            </Text>
            <Text style={styles.sectionCount}>{filteredItems.length} itens</Text>
          </View>
          
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={styles.itemsRow}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.bottomPadding} />
      </Animated.ScrollView>

      {/* Modal de confirmação de compra */}
      <Modal visible={confirmModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setConfirmModalVisible(false)}
          />
          <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient colors={[colors.card, colors.background]} style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <LinearGradient
                  colors={selectedItem?.color || ['#6c63ff', '#4ecdc4']}
                  style={styles.modalIconGradient}
                >
                  <Icon name={selectedItem?.iconName || 'gift'} size={40} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.modalTitle}>Confirmar compra</Text>
              <Text style={styles.modalItemName}>{selectedItem?.name}</Text>
              <Text style={styles.modalItemDesc}>{selectedItem?.description}</Text>
              <View style={styles.modalPriceContainer}>
                <Icon name="wallet" size={18} color="#FFD700" />
                <Text style={styles.modalPrice}>{selectedItem?.price} moedas</Text>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setConfirmModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirm} onPress={buyItem} disabled={buying}>
                  <LinearGradient colors={[colors.primary, '#4ecdc4']} style={styles.modalConfirmGradient}>
                    {buying ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalConfirmText}>Comprar</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, marginTop: 16, fontSize: 14 },
  bottomPadding: { height: 40 },
  
  // Header
  headerGradient: { paddingTop: 40, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text, letterSpacing: 1 },
  headerSubtitle: { fontSize: 12, color: colors.textSecondary, marginLeft: 20, marginTop: 4 },
  inventoryButton: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  inventoryGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  
  // Balance Card
  balanceCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 16, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: colors.border },
  balanceIconContainer: { marginRight: 14 },
  balanceIconGradient: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  balanceInfo: { flex: 1 },
  balanceLabel: { color: colors.textSecondary, fontSize: 12 },
  balanceAmount: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginTop: 2 },
  addCoinsButton: { borderRadius: 25, overflow: 'hidden' },
  addCoinsGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8 },
  addCoinsText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  
  // Categorias
  categoriesSection: { marginTop: 20 },
  categoriesList: { paddingHorizontal: 16, gap: 10 },
  categoryChip: { paddingHorizontal: 18, paddingVertical: 8, backgroundColor: colors.card, borderRadius: 25, borderWidth: 1, borderColor: colors.border },
  activeCategoryChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { color: colors.textSecondary, fontSize: 13 },
  activeCategoryText: { color: colors.text },
  
  // Itens
  itemsSection: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  sectionCount: { color: colors.textSecondary, fontSize: 12 },
  itemsRow: { justifyContent: 'space-between', gap: 12 },
  shopCard: { width: '48%', marginBottom: 16, borderRadius: 20, overflow: 'hidden' },
  cardGradient: { padding: 16, alignItems: 'center', position: 'relative' },
  iconContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  popularBadge: { position: 'absolute', top: 12, right: 12 },
  popularBadgeGradient: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  popularBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  shopName: { color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  shopDescription: { color: 'rgba(255,255,255,0.8)', fontSize: 10, textAlign: 'center', marginBottom: 8 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  shopPrice: { color: '#FFD700', fontSize: 18, fontWeight: 'bold' },
  priceUnit: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  buyButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, width: '100%', alignItems: 'center' },
  buyButtonDisabled: { opacity: 0.5 },
  buyButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContainer: { width: '85%', borderRadius: 28, overflow: 'hidden' },
  modalContent: { padding: 24, alignItems: 'center' },
  modalIconContainer: { marginBottom: 16 },
  modalIconGradient: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  modalItemName: { color: colors.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  modalItemDesc: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 16 },
  modalPriceContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  modalPrice: { color: '#FFD700', fontSize: 18, fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel: { flex: 1, backgroundColor: 'rgba(255,107,107,0.2)', paddingVertical: 12, borderRadius: 25, alignItems: 'center' },
  modalCancelText: { color: '#ff6b6b', fontSize: 15, fontWeight: 'bold' },
  modalConfirm: { flex: 1, borderRadius: 25, overflow: 'hidden' },
  modalConfirmGradient: { paddingVertical: 12, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});