/**
 * ============================================
 * FALOU - APP PRINCIPAL (COM DIAGNÓSTICO)
 * ============================================
 * ✅ VERSÃO COM LOGS VISUAIS:
 * 1. Mostra cada etapa do carregamento
 * 2. Se der erro, mostra o erro na tela
 * 3. Não fica tela preta sem informação
 * ============================================
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Text, LogBox, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { auth } from './config/firebase';
import { getUserProfile } from './src/services/firestore/index';
import { colors } from './src/utils/colors';

// Ignorar warnings
LogBox.ignoreAllLogs(true);

// Telas
import SplashScreen from './src/screens/SplashScreen';
import AuthScreen from './src/screens/AuthScreen';
import CompleteProfileScreen from './src/screens/CompleteProfileScreen';
import PopularScreen from './src/screens/PopularScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProfileViewScreen from './src/screens/ProfileViewScreen';
import VoiceRoomScreen from './src/screens/VoiceRoomScreen';
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

// ✅ COMPONENTE DE DIAGNÓSTICO (MOSTRA O ERRO NA TELA)
const DiagnosticScreen = ({ step, error, loading }) => {
  const steps = [
    'Inicializando...',
    'Verificando autenticação...',
    'Carregando perfil...',
    'Preparando navegação...',
    'Concluído!'
  ];
  
  const currentIndex = loading ? Math.min(step || 0, steps.length - 1) : steps.length - 1;
  
  return (
    <LinearGradient colors={[colors.background, '#0f0f1a']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.text, fontSize: 18, marginTop: 20, fontWeight: 'bold' }}>Falou</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 10, textAlign: 'center' }}>
        {steps[currentIndex]}
      </Text>
      <Text style={{ color: colors.primary, fontSize: 12, marginTop: 20, textAlign: 'center' }}>
        Etapa {currentIndex + 1} de {steps.length}
      </Text>
      
      {error && (
        <View style={{ marginTop: 30, backgroundColor: colors.card, padding: 15, borderRadius: 12, width: '100%' }}>
          <Text style={{ color: colors.danger, fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>⚠️ ERRO:</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{error}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 10 }}>Verifique sua conexão com a internet</Text>
        </View>
      )}
    </LinearGradient>
  );
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Sala: 'home',
            Jogos: 'gamepad-variant',
            Momento: 'newspaper-variant',
            Mensagem: 'message',
            Eu: 'account-circle'
          };
          return <Icon name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, height: 60 },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Sala" component={PopularScreen} />
      <Tab.Screen name="Jogos" component={GamesScreen} />
      <Tab.Screen name="Momento" component={MomentsScreen} />
      <Tab.Screen name="Mensagem" component={FriendsScreen} />
      <Tab.Screen name="Eu" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Splash');
  const [diagnosticStep, setDiagnosticStep] = useState(0);
  const [diagnosticError, setDiagnosticError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      try {
        setDiagnosticStep(1);
        setDiagnosticError(null);
        
        // Aguardar um pouco para garantir
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setDiagnosticStep(2);
        
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
          if (!isMounted) return;
          
          setDiagnosticStep(3);
          
          try {
            if (firebaseUser) {
              console.log('📱 Usuário logado:', firebaseUser.uid);
              
              const profile = await getUserProfile(firebaseUser.uid);
              setDiagnosticStep(4);
              
              if (profile.success && isMounted) {
                await AsyncStorage.setItem('@falou_user', JSON.stringify({ 
                  uid: firebaseUser.uid, 
                  nick: profile.data.nick 
                }));
                setUser(firebaseUser);
                
                if (!profile.data.profileCompleted) {
                  setInitialRoute('CompleteProfile');
                } else {
                  setInitialRoute('Main');
                }
              } else if (isMounted) {
                setUser(firebaseUser);
                setInitialRoute('Main');
              }
            } else {
              setUser(null);
              setInitialRoute('Splash');
            }
          } catch (err) {
            console.error('Erro no auth:', err);
            setDiagnosticError(err.message);
          } finally {
            if (isMounted) setLoading(false);
          }
        });
        
        return () => {
          isMounted = false;
          unsubscribe();
        };
        
      } catch (err) {
        console.error('Erro na inicialização:', err);
        setDiagnosticError(err.message);
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

  if (loading) {
    return <DiagnosticScreen step={diagnosticStep} error={diagnosticError} loading={true} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        {!user ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
            <Stack.Screen name="Meu" component={MeuScreen} />
            <Stack.Screen name="ProfileView" component={ProfileViewScreen} />
            <Stack.Screen name="Gifts" component={GiftsScreen} />
            <Stack.Screen name="Shop" component={ShopScreen} />
            <Stack.Screen name="VoiceRoom" component={VoiceRoomScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Descobrir" component={DescobrirScreen} />
            <Stack.Screen name="Eventos" component={EventosScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}