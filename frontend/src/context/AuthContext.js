import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { getProfile } from '../api/user';
import { onboardProfile } from '../api/auth';

const AuthContext = createContext(null);

function formatFirebaseAuthError(err) {
  const code = err?.code;
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google sign-in popup was closed before completing sign-in.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by the browser. Please allow popups for this site and try again.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized for Google Sign-In in Firebase Authentication.';
  }
  return err?.message || 'Google sign-in failed. Please try again.';
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [dbError, setDbError] = useState('');
  const [authError, setAuthError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const inFlightProfileRef = useRef(null);

  const fetchDomainProfile = useCallback(async (fbUser) => {
    if (!fbUser) {
      setUser(null);
      setNeedsOnboarding(false);
      setDbError('');
      return;
    }
    if (inFlightProfileRef.current && inFlightProfileRef.current.uid === fbUser.uid) {
      return inFlightProfileRef.current.promise;
    }
    const promise = (async () => {
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
      } finally {
        if (inFlightProfileRef.current?.uid === fbUser.uid) {
          inFlightProfileRef.current = null;
        }
      }
    })();
    inFlightProfileRef.current = { uid: fbUser.uid, promise };
    return promise;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      await fetchDomainProfile(fbUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchDomainProfile]);

  const signInWithGoogle = async () => {
    setAuthError('');
    setSigningIn(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      setFirebaseUser(cred.user);
      await fetchDomainProfile(cred.user);
      return cred.user;
    } catch (err) {
      const msg = formatFirebaseAuthError(err);
      setAuthError(msg);
      throw err;
    } finally {
      setSigningIn(false);
    }
  };

  const clearAuthError = useCallback(() => setAuthError(''), []);

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
    setAuthError('');
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        needsOnboarding,
        dbError,
        authError,
        clearAuthError,
        signingIn,
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
