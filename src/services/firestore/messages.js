/**
 * ============================================
 * FALOU - FIRESTORE MESSAGES SERVICE
 * ============================================
 */

import { db, collection, doc, addDoc, getDocs, query, where, updateDoc, orderBy, limit, onSnapshot, increment, setDoc, serverTimestamp } from 'firebase/firestore';
import { getUserProfile } from './user';

export const sendMessage = async (fromUserId, toUserId, text, imageUrl = null) => {
  try {
    const chatId = [fromUserId, toUserId].sort().join('_');
    const message = { from: fromUserId, to: toUserId, text, imageUrl, timestamp: serverTimestamp(), read: false, delivered: true };
    await addDoc(collection(db, 'chats', chatId, 'messages'), message);
    await setDoc(doc(db, 'chats', chatId), {
      participants: [fromUserId, toUserId],
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      lastSender: fromUserId,
      [`unreadCount.${toUserId}`]: increment(1)
    }, { merge: true });
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};

export const getMessages = async (currentUserId, otherUserId, limitCount = 50) => {
  try {
    const chatId = [currentUserId, otherUserId].sort().join('_');
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'), limit(limitCount));
    const snapshot = await getDocs(q);
    const messages = [];
    snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
    return { success: true, data: messages };
  } catch (error) { return { success: false, error: error.message }; }
};

export const listenToMessages = (currentUserId, otherUserId, callback) => {
  const chatId = [currentUserId, otherUserId].sort().join('_');
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
};

export const markMessagesAsRead = async (currentUserId, otherUserId) => {
  try {
    const chatId = [currentUserId, otherUserId].sort().join('_');
    const q = query(collection(db, 'chats', chatId, 'messages'), where('to', '==', currentUserId), where('read', '==', false));
    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map(d => updateDoc(d.ref, { read: true }));
    await Promise.all(updates);
    await setDoc(doc(db, 'chats', chatId), { [`unreadCount.${currentUserId}`]: 0 }, { merge: true });
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};

export const getChats = async (userId) => {
  try {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
    const snapshot = await getDocs(q);
    const chats = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const otherUserId = data.participants.find(id => id !== userId);
      const profile = await getUserProfile(otherUserId);
      if (profile.success) chats.push({
        id: doc.id, uid: otherUserId, nick: profile.data.nick, avatarUrl: profile.data.avatarUrl,
        lastMessage: data.lastMessage, lastMessageTime: data.lastMessageTime?.toDate?.()?.toLocaleTimeString() || '',
        unreadCount: data.unreadCount?.[userId] || 0
      });
    }
    return { success: true, data: chats };
  } catch (error) { return { success: false, error: error.message }; }
};
