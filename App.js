/**
 * ============================================
 * FALOU - APP PRINCIPAL (COM AGORA.IO)
 * ============================================
 */

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

// ✅ AGORA ATIVADO
import AgoraVoiceRoom from './src/components/AgoraVoiceRoom';

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

const LoadingScreen = () => (
  <LinearGradient colors={[colors.background, '#0f0f1a']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={{ color: colors.text, marginTop: 20 }}>Falou...</Text>
  </LinearGradient>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Splash');

  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!isMounted) return;
      
      if (firebaseUser) {
        console.log('📱 Usuário logado:', firebaseUser.uid);
        
        const profile = await getUserProfile(firebaseUser.uid);
        
        if (profile.success && isMounted) {
          await AsyncStorage.setItem('@falou_user', JSON.stringify({ 
            uid: firebaseUser.uid, 
            nick: profile.data.nick 
          }));
          setUser(firebaseUser);
          setInitialRoute(profile.data.profileCompleted ? 'Main' : 'CompleteProfile');
        } else if (isMounted) {
          setUser(firebaseUser);
          setInitialRoute('Main');
        }
      } else {
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
            {/* ✅ AgoraVoiceRoom ATIVADO */}
            <Stack.Screen name="AgoraVoiceRoom" component={AgoraVoiceRoom} />
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
