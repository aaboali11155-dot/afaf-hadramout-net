import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('useLocalStorage error:', error);
    }
  };

  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('useLocalStorage remove error:', error);
    }
  };

  return [storedValue, setValue, removeValue];
}

export function useSyncExternalStorage() {
  const [currentUser, setCurrentUser] = useLocalStorage('afaf_current_user', null);
  const [profiles, setProfiles] = useLocalStorage('afaf_profiles', []);
  const [messages, setMessages] = useLocalStorage('afaf_messages', []);
  const [users, setUsers] = useLocalStorage('afaf_users', []);

  // لا توجد حسابات تجريبية أو بيانات دخول ثابتة.
  // تسجيل الدخول الحقيقي يتم عبر Supabase Auth ومدخلات المستخدم.

  return {
    currentUser,
    setCurrentUser,
    profiles,
    setProfiles,
    messages,
    setMessages,
    users,
    setUsers,
  };
}