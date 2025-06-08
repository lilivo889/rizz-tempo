import { useState, useEffect } from 'react';
import { supabase, db } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return { user, loading, signUp, signIn, signOut };
};

export const useProfile = (userId?: string) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await db.select('profiles', '*', { id: userId });
        setProfile(data?.[0] || null);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const updateProfile = async (updates: Record<string, any>) => {
    if (!userId) return { error: 'No user ID' };
    
    try {
      const data = await db.update('profiles', updates, { id: userId });
      setProfile(data?.[0] || null);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  return { profile, loading, updateProfile };
};

export const usePracticeSessions = (userId?: string) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchSessions = async () => {
      try {
        const data = await db.select('practice_sessions', '*', { user_id: userId });
        setSessions(data || []);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [userId]);

  const addSession = async (sessionData: Record<string, any>) => {
    if (!userId) return { error: 'No user ID' };

    try {
      const data = await db.insert('practice_sessions', {
        ...sessionData,
        user_id: userId
      });
      setSessions(prev => [...prev, ...data]);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  return { sessions, loading, addSession };
};

export const useConversationScenarios = () => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const data = await db.select('conversation_scenarios');
        setScenarios(data || []);
      } catch (error) {
        console.error('Error fetching scenarios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, []);

  return { scenarios, loading };
}; 