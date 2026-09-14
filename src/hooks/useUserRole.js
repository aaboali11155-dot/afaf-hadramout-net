import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function useUserRole(userId) {
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    async function loadUserData() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        setRole(null);
        setProfile(null);
      } else {
        const isAdmin = data?.is_admin === true;
        setRole(isAdmin ? 'admin' : 'user');
        setProfile(data || null);
      }
      setLoading(false);
    }

    loadUserData();
  }, [userId]);

  return { role, profile, loading };
}
