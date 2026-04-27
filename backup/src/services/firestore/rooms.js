/**
 * ============================================
 * FALOU - FIRESTORE ROOMS SERVICE
 * ============================================
 */

import { 
  db, collection, doc, addDoc, getDoc, getDocs, query, where,
  updateDoc, deleteDoc, orderBy, serverTimestamp, onSnapshot, limit
} from './config';

let currentRoomNumericId = null;

const getMaxRoomNumericId = async () => {
  try {
    const roomsRef = collection(db, 'rooms');
    const querySnapshot = await getDocs(roomsRef);
    let maxId = 100000;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.roomNumericId && data.roomNumericId > maxId) {
        maxId = data.roomNumericId;
      }
    });
    return maxId;
  } catch (error) {
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
      roomNumericId: roomNumericId,
      name: roomData.name,
      description: roomData.description || '',
      coverImage: roomData.coverImage || null,
      ownerId: roomData.ownerId,
      ownerNick: roomData.ownerNick,
      ownerAvatar: roomData.ownerAvatar || null,
      members: [roomData.ownerId],
      seats: Array(10).fill(null),
      popularity: 0,
      createdAt: new Date().toISOString(),
      isActive: true,
      settings: {
        allowChat: true,
        allowGuests: true,
        seatLocked: false
      }
    });
    return { success: true, id: docRef.id, roomNumericId: roomNumericId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserVoiceRoom = async (userId) => {
  try {
    const q = query(collection(db, 'rooms'), where('ownerId', '==', userId), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { success: true, data: { id: doc.id, ...doc.data() } };
    }
    return { success: false, error: 'Nenhuma sala encontrada' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getRoomByNumericId = async (numericId) => {
  try {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where('roomNumericId', '==', numericId), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { success: true, data: { id: doc.id, ...doc.data() } };
    }
    return { success: false, error: 'Sala não encontrada' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getActiveRooms = async () => {
  try {
    const q = query(collection(db, 'rooms'), where('isActive', '==', true), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const rooms = [];
    querySnapshot.forEach((doc) => {
      rooms.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: rooms };
  } catch (error) {
    try {
      const q2 = query(collection(db, 'rooms'), where('isActive', '==', true));
      const snapshot2 = await getDocs(q2);
      const rooms2 = [];
      snapshot2.forEach((doc) => {
        rooms2.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: rooms2 };
    } catch (e) {
      return { success: false, error: error.message };
    }
  }
};

export const getPopularRooms = async (limitCount = 30) => {
  try {
    const q = query(collection(db, 'rooms'), where('isActive', '==', true), orderBy('popularity', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    const rooms = [];
    querySnapshot.forEach((doc) => {
      rooms.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: rooms };
  } catch (error) {
    try {
      const q2 = query(collection(db, 'rooms'), where('isActive', '==', true), orderBy('members', 'desc'), limit(limitCount));
      const snapshot2 = await getDocs(q2);
      const rooms2 = [];
      snapshot2.forEach((doc) => {
        rooms2.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: rooms2 };
    } catch (e) {
      return { success: false, error: error.message };
    }
  }
};

export const getNewRooms = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const q = query(collection(db, 'rooms'), where('isActive', '==', true), where('createdAt', '>=', sevenDaysAgo.toISOString()), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const rooms = [];
    querySnapshot.forEach((doc) => {
      rooms.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: rooms };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getRecentRooms = async (limitCount = 10) => {
  try {
    const q = query(collection(db, 'rooms'), where('isActive', '==', true), orderBy('createdAt', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    const rooms = [];
    querySnapshot.forEach((doc) => {
      rooms.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: rooms };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getFollowedRooms = async (followingList) => {
  try {
    if (!followingList || followingList.length === 0) return { success: true, data: [] };
    const rooms = [];
    for (const uid of followingList) {
      const q = query(collection(db, 'rooms'), where('ownerId', '==', uid), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        rooms.push({ id: doc.id, ...doc.data() });
      });
    }
    return { success: true, data: rooms };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const searchRooms = async (searchTerm) => {
  try {
    const roomsRef = collection(db, 'rooms');
    const term = searchTerm.toLowerCase().trim();
    const q = query(roomsRef, where('isActive', '==', true), where('name', '>=', term), where('name', '<=', term + '\uf8ff'), limit(20));
    const querySnapshot = await getDocs(q);
    const rooms = [];
    querySnapshot.forEach((doc) => {
      rooms.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: rooms };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUserVoiceRoom = async (roomId, data) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      name: data.name,
      description: data.description,
      coverImage: data.coverImage,
      settings: data.settings
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteUserVoiceRoom = async (roomId) => {
  try {
    await deleteDoc(doc(db, 'rooms', roomId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateRoomPopularity = async (roomId, incrementValue = 1) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { popularity: increment(incrementValue) });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getRoomSeats = async (roomId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) {
      return { success: true, seats: roomSnap.data()?.seats || Array(10).fill(null) };
    }
    return { success: false, error: 'Sala não encontrada' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateRoomSeats = async (roomId, seats) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { seats: seats });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const sendRoomMessage = async (roomId, userId, userName, userAvatar, text) => {
  try {
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    await addDoc(messagesRef, {
      userId: userId,
      userName: userName,
      userAvatar: userAvatar || null,
      text: text,
      timestamp: serverTimestamp(),
      type: 'user'
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getRoomMessages = async (roomId, limitCount = 100) => {
  try {
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    const messages = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userAvatar: data.userAvatar,
        text: data.text,
        timestamp: data.timestamp?.toDate?.() || new Date(),
        type: data.type || 'user'
      });
    });
    return { success: true, data: messages };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const listenToRoomMessages = (roomId, callback) => {
  const messagesRef = collection(db, 'rooms', roomId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  return onSnapshot(q, (querySnapshot) => {
    const messages = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userAvatar: data.userAvatar,
        text: data.text,
        timestamp: data.timestamp?.toDate?.() || new Date(),
        type: data.type || 'user'
      });
    });
    callback(messages);
  });
};
