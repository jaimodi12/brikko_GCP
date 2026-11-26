import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { getProfile } from '../api/user';
import { onboardProfile } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [dbError, setDbError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDomainProfile = useCallback(async (fbUser) => {
    if (!fbUser) {
      setUser(null);
      setNeedsOnboarding(false);
      setDbError('');
      return;
    }
    try {
      const res = await getProfile();
      setUser(res.data);
      setNeedsOnboarding(false);
      setDbError('');
    } catch (err) {
      const status = err.response?.status;
      if (status === 404 && err.response?.data?.needsOnboarding) {
        setUser(null);
        setNeedsOnboarding(true);
        setDbError('');
      } else if (status === 503 || status === 500) {
        setDbError(err.response?.data?.error || 'Unable to reach Supabase database.');
      } else {
        setDbError(err.response?.data?.error || 'Unable to load account profile.');
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      setFirebaseUser(fbUser);
      await fetchDomainProfile(fbUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchDomainProfile]);

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    setFirebaseUser(cred.user);
    await fetchDomainProfile(cred.user);
    return cred.user;
  };

  const completeOnboarding = async (payload) => {
    const res = await onboardProfile(payload);
    setUser(res.data);
    setNeedsOnboarding(false);
    setDbError('');
    return res.data;
  };

  const updateUser = (updatedFields) => {
    setUser((current) => (current ? { ...current, ...updatedFields } : current));
  };

  const refreshProfile = async () => {
    if (firebaseUser) {
      await fetchDomainProfile(firebaseUser);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setUser(null);
    setNeedsOnboarding(false);
    setDbError('');
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        needsOnboarding,
        dbError,
        loading,
        signInWithGoogle,
        completeOnboarding,
        updateUser,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
