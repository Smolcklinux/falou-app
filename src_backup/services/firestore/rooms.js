/**
 * ============================================
 * FALOU - FIRESTORE ROOMS SERVICE
 * ============================================
 */

import { db, collection, doc, addDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc, orderBy, serverTimestamp, onSnapshot, limit, increment } from 'firebase/firestore';

let currentRoomNumericId = null;

const getMaxRoomNumericId = async () => {
  try {
    const roomsRef = collection(db, 'rooms');
    const snapshot = await getDocs(roomsRef);
    let maxId = 100000;
    snapshot.forEach(doc => {
      if (doc.data().roomNumericId && doc.data().roomNumericId > maxId) {
        maxId = doc.data().roomNumericId;
      }
    });
    return maxId;
  } catch (error) {
    console.error('Erro em getMaxRoomNumericId:', error);
    return 100000;
  }
};

const generateRoomNumericId = async () => {
  if (currentRoomNumericId === null) {
    currentRoomNumericId = await getMaxRoomNumericId();
  }
  currentRoomNumericId++;
  return currentRoomNumericId;
};

export const createVoiceRoom = async (roomData) => {
  try {
    const roomNumericId = await generateRoomNumericId();
    const docRef = await addDoc(collection(db, 'rooms'), {
      roomNumericId, name: roomData.name, description: roomData.description || '',
      coverImage: roomData.coverImage || null, ownerId: roomData.ownerId,
      ownerNick: roomData.ownerNick, ownerAvatar: roomData.ownerAvatar || null,
      members: [roomData.ownerId], seats: Array(10).fill(null), popularity: 0,
      createdAt: new Date().toISOString(), isActive: true,
      settings: { allowChat: true, allowGuests: true, seatLocked: false }
    });
    return { success: true, id: docRef.id, roomNumericId };
  } catch (error) { return { success: false, error: error.message }; }
};

export const getUserVoiceRoom = async (userId) => {
  try {
    const q = query(collection(db, 'rooms'), where('ownerId', '==', userId), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return { success: true, data: { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } };
    return { success: false, error: 'Nenhuma sala encontrada' };
  } catch (error) { return { success: false, error: error.message }; }
};

export const getRoomByNumericId = async (numericId) => {
  try {
    const q = query(collection(db, 'rooms'), where('roomNumericId', '==', numericId), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return { success: true, data: { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } };
    return { success: false, error: 'Sala não encontrada' };
  } catch (error) { return { success: false, error: error.message }; }
};

export const getActiveRooms = async () => {
  try {
    const q = query(collection(db, 'rooms'), where('isActive', '==', true), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const rooms = [];
    snapshot.forEach(doc => rooms.push({ id: doc.id, ...doc.data() }));
    return { success: true, data: rooms };
  } catch (error) {
    return { success: true, data: [] };
  }
};

export const getPopularRooms = async (limitCount = 30) => {
  try {
    const q = query(collection(db, 'rooms'), where('isActive', '==', true), orderBy('popularity', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    const rooms = [];
    snapshot.forEach(doc => rooms.push({ id: doc.id, ...doc.data() }));
    return { success: true, data: rooms };
  } catch { return { success: true, data: [] }; }
};

export const getNewRooms = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const q = query(collection(db, 'rooms'), where('isActive', '==', true), where('createdAt', '>=', sevenDaysAgo.toISOString()), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const rooms = [];
    snapshot.forEach(doc => rooms.push({ id: doc.id, ...doc.data() }));
    return { success: true, data: rooms };
  } catch { return { success: true, data: [] }; }
};

export const getRecentRooms = async (limitCount = 10) => {
  try {
    const q = query(collection(db, 'rooms'), where('isActive', '==', true), orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    const rooms = [];
    snapshot.forEach(doc => rooms.push({ id: doc.id, ...doc.data() }));
    return { success: true, data: rooms };
  } catch { return { success: true, data: [] }; }
};

export const getFollowedRooms = async (followingList) => {
  if (!followingList || followingList.length === 0) return { success: true, data: [] };
  try {
    const rooms = [];
    for (const uid of followingList) {
      const q = query(collection(db, 'rooms'), where('ownerId', '==', uid), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      snapshot.forEach(doc => rooms.push({ id: doc.id, ...doc.data() }));
    }
    return { success: true, data: rooms };
  } catch { return { success: true, data: [] }; }
};

export const searchRooms = async (searchTerm) => {
  try {
    const term = searchTerm.toLowerCase().trim();
    const q = query(collection(db, 'rooms'), where('isActive', '==', true), where('name', '>=', term), where('name', '<=', term + '\uf8ff'), limit(20));
    const snapshot = await getDocs(q);
    const rooms = [];
    snapshot.forEach(doc => rooms.push({ id: doc.id, ...doc.data() }));
    return { success: true, data: rooms };
  } catch { return { success: true, data: [] }; }
};

export const updateUserVoiceRoom = async (roomId, data) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { name: data.name, description: data.description, coverImage: data.coverImage, settings: data.settings });
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};

export const deleteUserVoiceRoom = async (roomId) => {
  try {
    await deleteDoc(doc(db, 'rooms', roomId));
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};

export const updateRoomPopularity = async (roomId, incrementValue = 1) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { popularity: increment(incrementValue) });
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};

export const getRoomSeats = async (roomId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) return { success: true, seats: roomSnap.data()?.seats || Array(10).fill(null) };
    return { success: false, error: 'Sala não encontrada' };
  } catch (error) { return { success: false, error: error.message }; }
};

export const updateRoomSeats = async (roomId, seats) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { seats });
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};

export const sendRoomMessage = async (roomId, userId, userName, userAvatar, text) => {
  try {
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    await addDoc(messagesRef, { userId, userName, userAvatar: userAvatar || null, text, timestamp: serverTimestamp(), type: 'user' });
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};

export const getRoomMessages = async (roomId, limitCount = 100) => {
  try {
    const q = query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp', 'asc'), limit(limitCount));
    const snapshot = await getDocs(q);
    const messages = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      messages.push({ id: doc.id, userId: data.userId, userName: data.userName, userAvatar: data.userAvatar, text: data.text, timestamp: data.timestamp?.toDate?.() || new Date(), type: data.type || 'user' });
    });
    return { success: true, data: messages };
  } catch (error) { return { success: false, error: error.message }; }
};

export const listenToRoomMessages = (roomId, callback) => {
  const q = query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      messages.push({ id: doc.id, userId: data.userId, userName: data.userName, userAvatar: data.userAvatar, text: data.text, timestamp: data.timestamp?.toDate?.() || new Date(), type: data.type || 'user' });
    });
    callback(messages);
  });
};
