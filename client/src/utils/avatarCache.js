// Утилита для кеширования аватарок пользователей
const AVATAR_CACHE_KEY = 'userAvatarCache';
const CACHE_VERSION_KEY = 'avatarCacheVersion';
const CURRENT_CACHE_VERSION = '1.0';

/**
 * Сохраняет аватарку пользователя в localStorage
 * @param {string} userId - ID пользователя
 * @param {string} avatar - base64 строка аватарки или URL
 */
export const cacheUserAvatar = (userId, avatar) => {
  if (!userId || !avatar) return;
  
  try {
    // Проверяем версию кеша
    const cacheVersion = localStorage.getItem(CACHE_VERSION_KEY);
    if (cacheVersion !== CURRENT_CACHE_VERSION) {
      // Очищаем старый кеш при обновлении версии
      localStorage.removeItem(AVATAR_CACHE_KEY);
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
    }
    
    const cache = JSON.parse(localStorage.getItem(AVATAR_CACHE_KEY) || '{}');
    cache[userId] = {
      avatar: avatar,
      timestamp: Date.now(),
      version: CURRENT_CACHE_VERSION
    };
    
    localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache));
    console.log('💾 Avatar cached for user:', userId);
  } catch (error) {
    console.error('Error caching avatar:', error);
  }
};

/**
 * Получает кешированную аватарку пользователя
 * @param {string} userId - ID пользователя
 * @returns {string|null} - аватарка или null если не найдена
 */
export const getCachedUserAvatar = (userId) => {
  if (!userId) return null;
  
  try {
    const cache = JSON.parse(localStorage.getItem(AVATAR_CACHE_KEY) || '{}');
    const userCache = cache[userId];
    
    if (userCache) {
      // Проверяем возраст кеша (30 дней)
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 дней в миллисекундах
      const isExpired = Date.now() - userCache.timestamp > maxAge;
      
      if (!isExpired) {
        console.log('🎯 Using cached avatar for user:', userId);
        return userCache.avatar;
      } else {
        // Удаляем устаревший кеш
        delete cache[userId];
        localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache));
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached avatar:', error);
    return null;
  }
};

/**
 * Удаляет кешированную аватарку пользователя
 * @param {string} userId - ID пользователя
 */
export const removeCachedUserAvatar = (userId) => {
  if (!userId) return;
  
  try {
    const cache = JSON.parse(localStorage.getItem(AVATAR_CACHE_KEY) || '{}');
    if (cache[userId]) {
      delete cache[userId];
      localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache));
      console.log('🗑️ Removed cached avatar for user:', userId);
    }
  } catch (error) {
    console.error('Error removing cached avatar:', error);
  }
};

/**
 * Очищает весь кеш аватарок
 */
export const clearAvatarCache = () => {
  try {
    localStorage.removeItem(AVATAR_CACHE_KEY);
    console.log('🧹 Avatar cache cleared');
  } catch (error) {
    console.error('Error clearing avatar cache:', error);
  }
};

/**
 * Получает размер кеша аватарок
 * @returns {number} - размер в байтах
 */
export const getAvatarCacheSize = () => {
  try {
    const cache = localStorage.getItem(AVATAR_CACHE_KEY);
    return cache ? new Blob([cache]).size : 0;
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
};

/**
 * Получает количество кешированных аватарок
 * @returns {number} - количество аватарок в кеше
 */
export const getCachedAvatarsCount = () => {
  try {
    const cache = JSON.parse(localStorage.getItem(AVATAR_CACHE_KEY) || '{}');
    return Object.keys(cache).length;
  } catch (error) {
    console.error('Error getting cached avatars count:', error);
    return 0;
  }
};