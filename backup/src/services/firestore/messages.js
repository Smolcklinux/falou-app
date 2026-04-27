/**
 * ============================================
 * FALOU - FIRESTORE MESSAGES SERVICE
 * ============================================
 */

import { 
  db, collection, doc, addDoc, getDocs, query, where,
  updateDoc, orderBy, limit, onSnapshot, increment, setDoc,
  serverTimestamp
} from './config';
import { getUserProfile } from './user';

export const sendMessage = async (fromUserId, toUserId, text, imageUrl = null) => {
  try {
    const chatId = [fromUserId, toUserId].sort().join('_');
    const message = {
      from: fromUserId,
      to: toUserId,
      text: text,
      imageUrl: imageUrl,
      timestamp: serverTimestamp(),
      read: false,
      delivered: true
    };
    
    await addDoc(collection(db, 'chats', chatId, 'messages'), message);
    
    await setDoc(doc(db, 'chats', chatId), {
      participants: [fromUserId, toUserId],
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      lastSender: fromUserId,
      [`unreadCount.${toUserId}`]: increment(1)
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getMessages = async (currentUserId, otherUserId, limitCount = 50) => {
  try {
    const chatId = [currentUserId, otherUserId].sort().join('_');
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const messages = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: messages };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const listenToMessages = (currentUserId, otherUserId, callback) => {
  const chatId = [currentUserId, otherUserId].sort().join('_');
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(q, (querySnapshot) => {
    const messages = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });
};

export const markMessagesAsRead = async (currentUserId, otherUserId) => {
  try {
    const chatId = [currentUserId, otherUserId].sort().join('_');
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      where('to', '==', currentUserId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    
    const updatePromises = [];
    querySnapshot.forEach((doc) => {
      updatePromises.push(updateDoc(doc.ref, { read: true }));
    });
    
    await Promise.all(updatePromises);
    
    await setDoc(doc(db, 'chats', chatId), {
      [`unreadCount.${currentUserId}`]: 0
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getChats = async (userId) => {
  try {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    const chats = [];
    for (const doc of querySnapshot.docs) {
      const chatData = doc.data();
      const otherUserId = chatData.participants.find(id => id !== userId);
      const userProfile = await getUserProfile(otherUserId);
      if (userProfile.success) {
        chats.push({
          id: doc.id,
          uid: otherUserId,
          nick: userProfile.data.nick,
          avatarUrl: userProfile.data.avatarUrl,
          lastMessage: chatData.lastMessage,
          lastMessageTime: chatData.lastMessageTime?.toDate?.()?.toLocaleTimeString() || '',
          unreadCount: chatData.unreadCount?.[userId] || 0
        });
      }
    }
    return { success: true, data: chats };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
