/**
 * ============================================
 * FALOU - FIRESTORE SERVICE (ÍNDICE)
 * ============================================
 * Exporta todas as funções dos sub-módulos
 * Mantém compatibilidade com código existente
 * ============================================
 */

export * from './user';
export * from './friends';
export * from './messages';
export * from './rooms';
export * from './moments';
export * from './visitors';

// Re-exportar funções específicas para garantir compatibilidade
export { 
  createUserProfile,
  completeUserProfile,
  getUserProfile,
  searchUsers,
  updateUserProfile,
  updateUserStats,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  getFriends,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  checkIsFollowing,
  sendMessage,
  getMessages,
  listenToMessages,
  markMessagesAsRead,
  getChats,
  createVoiceRoom,
  getUserVoiceRoom,
  getRoomByNumericId,
  getActiveRooms,
  getPopularRooms,
  getNewRooms,
  getRecentRooms,
  getFollowedRooms,
  searchRooms,
  updateUserVoiceRoom,
  deleteUserVoiceRoom,
  updateRoomPopularity,
  getRoomSeats,
  updateRoomSeats,
  sendRoomMessage,
  getRoomMessages,
  listenToRoomMessages,
  getMoments,
  createMoment,
  likeMoment,
  listenToMoments,
  getFollowingMoments,
  getPopularMoments,
  addVisitor,
  getVisitors
};
