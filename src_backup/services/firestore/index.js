/**
 * ============================================
 * FALOU - FIRESTORE SERVICE (ÍNDICE)
 * ============================================
 */

import { db } from '../../../config/firebase';
import { 
  doc, setDoc, getDoc, updateDoc, collection, 
  addDoc, query, where, getDocs, orderBy, limit,
  arrayUnion, arrayRemove, serverTimestamp, deleteDoc,
  onSnapshot, increment
} from 'firebase/firestore';

// ✅ Exporta o db e funções do Firestore
export { 
  db, doc, setDoc, getDoc, updateDoc, collection, 
  addDoc, query, where, getDocs, orderBy, limit,
  arrayUnion, arrayRemove, serverTimestamp, deleteDoc,
  onSnapshot, increment
};

// Importa e re-exporta todas as funções dos serviços
import * as user from './user';
import * as friends from './friends';
import * as messages from './messages';
import * as rooms from './rooms';
import * as moments from './moments';
import * as visitors from './visitors';

// Re-exporta tudo
export const {
  createUserProfile, completeUserProfile, getUserProfile, searchUsers, updateUserProfile, updateUserStats
} = user;

export const {
  sendFriendRequest, getFriendRequests, acceptFriendRequest, getFriends, getFollowers, getFollowing,
  followUser, unfollowUser, checkIsFollowing
} = friends;

export const {
  sendMessage, getMessages, listenToMessages, markMessagesAsRead, getChats
} = messages;

export const {
  createVoiceRoom, getUserVoiceRoom, getRoomByNumericId, getActiveRooms, getPopularRooms, getNewRooms,
  getRecentRooms, getFollowedRooms, searchRooms, updateUserVoiceRoom, deleteUserVoiceRoom, updateRoomPopularity,
  getRoomSeats, updateRoomSeats, sendRoomMessage, getRoomMessages, listenToRoomMessages
} = rooms;

export const {
  getMoments, createMoment, likeMoment, listenToMoments, getFollowingMoments, getPopularMoments
} = moments;

export const {
  addVisitor, getVisitors
} = visitors;

// Exporta também os objetos inteiros
export { user, friends, messages, rooms, moments, visitors };
