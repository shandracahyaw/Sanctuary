import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  type User 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { saveUserProfile, getUserProfile } from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
  username: string | null;
  userId: string | null;
  profile: any | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithUsername: (username: string, pass: string) => Promise<void>;
  registerWithUsername: (username: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfileState: (data: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(localStorage.getItem('studelle_session_user'));
  const [profile, setProfile] = useState<any | null>(() => {
    try {
      const cached = localStorage.getItem('studelle_cached_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (uid: string) => {
    try {
      const data = await getUserProfile(uid);
      setProfile(data);
      if (data) localStorage.setItem('studelle_cached_profile', JSON.stringify(data));
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return profile; // Fallback to current state
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUsername(null);
        localStorage.removeItem('studelle_session_user');
        
        let localProfile = await fetchProfile(currentUser.uid);
        if (!localProfile) {
          const initialProfile = {
            displayName: currentUser.displayName || 'Mahasiswa Terhormat',
            nim: '000000000',
            faculty: 'Fakultas Belum Set',
            programStudy: 'Prodi Belum Set',
            username: `@${currentUser.email?.split('@')[0].toUpperCase()}`,
            semester: 1,
            status: 'Aktif' as const,
            photoURL: currentUser.photoURL || '',
          };
          await saveUserProfile(currentUser.uid, initialProfile);
          await fetchProfile(currentUser.uid);
        }
      } else {
        setUser(null);
        // Check for manual username session
        const storedUsername = localStorage.getItem('studelle_session_user');
        if (storedUsername) {
          setUsername(storedUsername);
          await fetchProfile(storedUsername);
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      handleAuthError(err);
    }
  };

  const loginWithUsername = async (identifier: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      const cleanId = identifier.toLowerCase().trim().replace('@', '');
      const userData = await getUserProfile(cleanId);
      
      if (!userData) {
        throw new Error('Username tidak ditemukan.');
      }

      if (userData.password !== pass) {
        throw new Error('Password salah.');
      }

      // Success
      localStorage.setItem('studelle_session_user', cleanId);
      setUsername(cleanId);
      setProfile(userData);
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Login gagal.');
    } finally {
      setLoading(false);
    }
  };

  const registerWithUsername = async (identifier: string, pass: string, name: string) => {
    setError(null);
    setLoading(true);
    try {
      const cleanId = identifier.toLowerCase().trim().replace('@', '');
      const existing = await getUserProfile(cleanId);
      if (existing) {
        throw new Error('Username sudah digunakan.');
      }
      
      const initialProfile = {
        displayName: name,
        nim: '000000000',
        faculty: 'Fakultas Belum Set',
        programStudy: 'Prodi Belum Set',
        username: `@${cleanId.toUpperCase()}`,
        password: pass, // Manual store
        semester: 1,
        status: 'Aktif' as const,
        photoURL: '',
      };
      
      await saveUserProfile(cleanId, initialProfile);
      
      localStorage.setItem('studelle_session_user', cleanId);
      setUsername(cleanId);
      setProfile(initialProfile);
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Registrasi gagal.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (err: any) => {
    if (err.code === 'auth/popup-closed-by-user') {
      setError('Jendela login ditutup.');
    } else {
      setError(err.message || 'Terjadi kesalahan.');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('studelle_session_user');
      localStorage.removeItem('studelle_cached_profile');
      setUsername(null);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const refreshProfile = async () => {
    const uid = user?.uid || username;
    if (uid) await fetchProfile(uid);
  };

  const setProfileState = (data: any) => {
    setProfile(data);
    if (data) localStorage.setItem('studelle_cached_profile', JSON.stringify(data));
  };

  const userId = user?.uid || username;

  return (
    <AuthContext.Provider value={{ user, username, userId, profile, loading, error, loginWithGoogle, loginWithUsername, registerWithUsername, logout, refreshProfile, setProfileState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
