/**
 * ============================================
 * FALOU - NAVEGAÇÃO PRINCIPAL
 * ============================================
 * ✅ VERSÃO COMPLETA E FUNCIONAL:
 * 1. LiveKit carregado sob demanda (não trava inicialização)
 * 2. Telas de áudio (VoiceRoom e LiveKitVoiceRoom)
 * 3. Design moderno com gradientes
 * 4. Splash screen personalizada
 * 5. Navegação completa
 * ============================================
 */

// ✅ LiveKit será carregado APENAS quando entrar na sala
// O registerGlobals é chamado dentro do componente LiveKitVoiceRoom

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Text, LogBox } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { auth } from './config/firebase';
import { getUserProfile } from './src/services/firestore/index';
import { colors } from './src/utils/colors';

// Ignorar warnings específicos (não críticos)
LogBox.ignoreLogs([
  'new NativeEventEmitter',
  'Require cycle:',
  'AsyncStorage has been extracted',
  'EventEmitter.removeListener'
]);

// ============================================
// TELAS PRINCIPAIS
// ============================================
import SplashScreen from './src/screens/SplashScreen';
import AuthScreen from './src/screens/AuthScreen';
import CompleteProfileScreen from './src/screens/CompleteProfileScreen';
import PopularScreen from './src/screens/PopularScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProfileViewScreen from './src/screens/ProfileViewScreen';
import VoiceRoomScreen from './src/screens/VoiceRoomScreen';
import LiveKitVoiceRoom from './src/components/LiveKitVoiceRoom'; // ✅ Componente de áudio
import MomentsScreen from './src/screens/MomentsScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AboutScreen from './src/screens/AboutScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import ChatScreen from './src/screens/ChatScreen';
import GamesScreen from './src/screens/GamesScreen';
import DescobrirScreen from './src/screens/DescobrirScreen';
import EventosScreen from './src/screens/EventosScreen';
import MeuScreen from './src/screens/MeuScreen';
import GiftsScreen from './src/screens/GiftsScreen';
import ShopScreen from './src/screens/ShopScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ============================================
// CONFIGURAÇÃO DA BARRA DE ABAS
// ============================================

/**
 * ✅ Configuração centralizada das abas inferiores
 * - Sala: tela principal com lista de salas
 * - Jogos: tela de jogos (em desenvolvimento)
 * - Momento: feed de posts
 * - Mensagem: chats e amigos
 * - Eu: perfil do usuário
 */
const TAB_CONFIG = {
  Sala: { icon: 'home', label: 'Sala', component: PopularScreen },
  Jogos: { icon: 'gamepad-variant', label: 'Jogos', component: GamesScreen },
  Momento: { icon: 'newspaper-variant', label: 'Momento', component: MomentsScreen },
  Mensagem: { icon: 'message', label: 'Mensagem', component: FriendsScreen },
  Eu: { icon: 'account-circle', label: 'Eu', component: ProfileScreen },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const config = TAB_CONFIG[route.name];
          return <Icon name={config?.icon || 'circle'} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      {Object.entries(TAB_CONFIG).map(([name, config]) => (
        <Tab.Screen 
          key={name} 
          name={name} 
          component={config.component} 
          options={{ title: config.label }} 
        />
      ))}
    </Tab.Navigator>
  );
}

// ============================================
// TELA DE CARREGAMENTO PERSONALIZADA
// ============================================

const LoadingScreen = () => (
  <LinearGradient 
    colors={[colors.background, '#0f0f1a']} 
    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
  >
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={{ color: colors.text, marginTop: 20, fontSize: 16 }}>Falou...</Text>
  </LinearGradient>
);

// ============================================
// APP PRINCIPAL
// ============================================

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Splash');

  useEffect(() => {
    let isMounted = true;
    
    // ✅ Listener de autenticação do Firebase
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!isMounted) return;
      
      if (firebaseUser) {
        console.log('📱 Usuário logado:', firebaseUser.uid);
        
        const profile = await getUserProfile(firebaseUser.uid);
        console.log('📝 Perfil:', profile.success ? 'encontrado' : 'não encontrado');
        
        if (profile.success && isMounted) {
          // Salvar dados do usuário localmente
          await AsyncStorage.setItem('@falou_user', JSON.stringify({ 
            uid: firebaseUser.uid, 
            nick: profile.data.nick 
          }));
          setUser(firebaseUser);
          
          // ✅ Redirecionar baseado no status do perfil
          if (!profile.data.profileCompleted) {
            console.log('🔄 Perfil incompleto, indo para CompleteProfile');
            setInitialRoute('CompleteProfile');
          } else {
            console.log('🏠 Perfil completo, indo para Main');
            setInitialRoute('Main');
          }
        } else if (isMounted) {
          setUser(firebaseUser);
          setInitialRoute('Main');
        }
      } else {
        console.log('🚪 Usuário não logado, indo para Auth');
        await AsyncStorage.removeItem('@falou_user');
        setUser(null);
        setInitialRoute('Splash');
      }
      
      if (isMounted) setLoading(false);
    });
    
    return () => { isMounted = false; unsubscribe(); };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }} 
        initialRouteName={initialRoute}
      >
        {/* ========================================== */}
        {/* ROTAS PARA USUÁRIOS NÃO LOGADOS */}
        {/* ========================================== */}
        {!user ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : (
          /* ========================================== */
          /* ROTAS PARA USUÁRIOS LOGADOS */
          /* ========================================== */
          <>
            {/* Tela principal com abas */}
            <Stack.Screen name="Main" component={MainTabs} />
            
            {/* Cadastro/Perfil */}
            <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
            <Stack.Screen name="Meu" component={MeuScreen} />
            <Stack.Screen name="ProfileView" component={ProfileViewScreen} />
            
            {/* Funcionalidades */}
            <Stack.Screen name="Gifts" component={GiftsScreen} />
            <Stack.Screen name="Shop" component={ShopScreen} />
            
            {/* ✅ SALA DE VOZ - LISTAGEM */}
            <Stack.Screen name="VoiceRoom" component={VoiceRoomScreen} />
            
            {/* ✅ SALA DE VOZ - ÁUDIO (LiveKit) */}
            <Stack.Screen 
              name="LiveKitVoiceRoom" 
              component={LiveKitVoiceRoom} 
              options={{ 
                headerShown: false,
                gestureEnabled: false, // Desativa gesto de voltar para não interromper áudio
              }}
            />
            
            {/* Perfil de outros usuários */}
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            
            {/* Chat privado */}
            <Stack.Screen name="Chat" component={ChatScreen} />
            
            {/* Configurações e Sobre */}
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            
            {/* Descoberta */}
            <Stack.Screen name="Descobrir" component={DescobrirScreen} />
            <Stack.Screen name="Eventos" component={EventosScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}