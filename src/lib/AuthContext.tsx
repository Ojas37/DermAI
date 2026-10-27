import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  UserCredential
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential | void>;
  signUp: (email: string, password: string) => Promise<UserCredential | void>;
  signInWithGoogle: () => Promise<UserCredential | void>;
  signInAsDemo: (demoEmail?: string) => void;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isApiKeyError(err: any): boolean {
  if (!err) return false;
  const code = (err.code || '').toLowerCase();
  const message = (err.message || '').toLowerCase();
  return (
    code.includes('api-key') ||
    code.includes('invalid-api-key') ||
    message.includes('api-key') ||
    message.includes('api key')
  );
}

function createMockUser(email: string, name?: string): User {
  return {
    uid: 'demo_user_' + Math.random().toString(36).substring(2, 9),
    email: email || 'demo@dermai.test',
    displayName: name || (email ? email.split('@')[0] : 'Demo User'),
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
    emailVerified: true
  } as unknown as User;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there is a cached demo user in localStorage
    const demoUserJson = localStorage.getItem('derm_ai_demo_user');
    let hasLocalDemoUser = false;
    if (demoUserJson) {
      try {
        const parsed = JSON.parse(demoUserJson);
        setUser(parsed as unknown as User);
        hasLocalDemoUser = true;
      } catch {
        // ignore
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.removeItem('derm_ai_demo_user');
      } else if (!hasLocalDemoUser) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInAsDemo = (demoEmail: string = 'demo@dermai.test') => {
    const mock = createMockUser(demoEmail, 'Demo Dermatologist');
    setUser(mock);
    localStorage.setItem('derm_ai_demo_user', JSON.stringify(mock));
  };

  const signIn = async (email: string, password: string) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (isApiKeyError(err)) {
        const mock = createMockUser(email);
        setUser(mock);
        localStorage.setItem('derm_ai_demo_user', JSON.stringify(mock));
        return;
      }
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (isApiKeyError(err)) {
        const mock = createMockUser(email);
        setUser(mock);
        localStorage.setItem('derm_ai_demo_user', JSON.stringify(mock));
        return;
      }
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (isApiKeyError(err)) {
        const mock = createMockUser('google.user@dermai.test', 'Google User');
        setUser(mock);
        localStorage.setItem('derm_ai_demo_user', JSON.stringify(mock));
        return;
      }
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
    localStorage.removeItem('derm_ai_demo_user');
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      if (isApiKeyError(err)) {
        return;
      }
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInAsDemo,
        signOut,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
