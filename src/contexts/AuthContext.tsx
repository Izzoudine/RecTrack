import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
  query,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export type Department = {
  id: string;
  acronym: string;
  name: string;
};

export type Recommendation = {
  id: string;
  title: string;
  description: string;
  userId: string;
  createdBy: string;
  departmentId: string | null;
  deadline: string | null;
  status: 'in_progress' | 'completed' | 'overdue';
  completedAt?: string;
};

export type RecommendationResponse = {
  id: string;
  userId: string;
  departmentId: string | null;
  content: string;
  deadline: string | null;
  status: 'in_progress' | 'completed' | 'overdue';
  completedAt: string | null;
  createdBy?: string;
};

interface Profile {
  id: string;
  role: 'admin' | 'user';
  departmentId: string | null;
  name: string;
}

interface UserDoc {
  id: string;
  role: 'admin' | 'user';
  name: string;
  departmentId: string | null;
}

interface RecommendationDoc {
  userId: string;
  departmentId: string | null;
  content: string;
  deadline: string | null;
  status: 'in_progress' | 'completed' | 'overdue';
  completedAt: string | null;
}

interface AuthContextType {
  session: User | null;
  departments: Department[];
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, departmentId: string) => Promise<void>;
  signOut: () => Promise<void>;
  recommendations: Recommendation[];
  users: { id: string; name: string; departmentId: string | null }[];
  addRecommendation: (recommendation: Omit<Recommendation, 'id' | 'status' | 'createdBy'>) => Promise<RecommendationResponse>;
  updateRecommendation: (id: string, data: Partial<Recommendation>) => Promise<void>;
  deleteRecommendation: (id: string) => Promise<void>;
  updateRecommendationStatus: (id: string, status: Recommendation['status'], completedAt?: string) => Promise<void>;
  getRecommendationsByDepartment: (departmentId: string) => Recommendation[];
  getRecommendationsByStatus: (status: Recommendation['status']) => Recommendation[];
  getRecommendationsByUser: (userId: string) => Recommendation[];
  addDepartment: (department: Omit<Department, 'id'>) => Promise<void>;
  statusFilter: Recommendation['status'] | 'all';
  setStatusFilter: (status: Recommendation['status'] | 'all') => void;
  departmentFilter: string | 'all';
  setDepartmentFilter: (departmentId: string | 'all') => void;
  getFilteredRecommendations: () => Recommendation[];
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; departmentId: string | null }[]>([]);
  const [statusFilter, setStatusFilter] = useState<Recommendation['status'] | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  // Create profile if it doesn't exist
  const createProfileIfNeeded = async (userId: string, userEmail: string) => {
    try {
      console.log('Creating profile for user:', userId, userEmail);
      const newProfile: UserDoc = {
        id: userId,
        role: 'user',
        name: userEmail.split('@')[0],
        departmentId: null,
      };
      await setDoc(doc(db, 'users', userId), newProfile);
      setProfile(newProfile);
      return newProfile;
    } catch (err) {
      console.error('Error creating profile:', err);
      throw err;
    }
  };

  // Fetch profile
  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const profileData = { id: userDoc.id, ...userDoc.data() } as Profile;
        console.log('Profile fetched successfully:', profileData);
        setProfile(profileData);
        return profileData;
      } else if (userEmail) {
        console.log('No profile found, creating one...');
        return await createProfileIfNeeded(userId, userEmail);
      } else {
        throw new Error('No profile found and no email provided');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      setProfile(null);
      throw err;
    }
  };

  // Initialize session and profile
  useEffect(() => {
    if (isInitialMount.current) {
      const initializeAuth = async () => {
        try {
          console.log('Initializing auth...');
          setLoading(true);
          const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setSession(user);
            if (user) {
              await fetchProfile(user.uid, user.email || undefined);
            } else {
              setProfile(null);
            }
            setLoading(false);
          });
          isInitialMount.current = false;
          return () => unsubscribe();
        } catch (err) {
          console.error('Auth initialization error:', err);
          setError(err instanceof Error ? err.message : 'Failed to initialize auth');
          setLoading(false);
        }
      };
      initializeAuth();
    }
  }, []);

  // Fetch departments and users
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        console.log('Fetching departments...');
        const querySnapshot = await getDocs(collection(db, 'departments'));
        const deptData = querySnapshot.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        })) as Department[];
        console.log('Departments fetched:', deptData);
        setDepartments(deptData);
      } catch (err) {
        console.error('Error fetching departments:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch departments');
      }
    };

    const fetchUsers = async () => {
      try {
        console.log('Fetching users...');
        const querySnapshot = await getDocs(collection(db, 'users'));
        const userData = querySnapshot.docs
          .filter(docSnapshot => docSnapshot.data().role === 'user')
          .map(docSnapshot => ({
            id: docSnapshot.id,
            name: docSnapshot.data().name,
            departmentId: docSnapshot.data().departmentId || null,
          }));
        console.log('Users fetched:', userData);
        setUsers(userData);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
      }
    };
    if (profile?.role === 'admin') {
    fetchDepartments();
    fetchUsers();
  }

    // Real-time subscriptions
    const deptUnsubscribe = onSnapshot(collection(db, 'departments'), (snapshot) => {
      snapshot.docChanges().forEach(change => {
        const dept = { id: change.doc.id, ...change.doc.data() } as Department;
        if (change.type === 'added') {
          setDepartments(prev => [...prev, dept]);
        } else if (change.type === 'modified') {
          setDepartments(prev => prev.map(d => (d.id === dept.id ? dept : d)));
        } else if (change.type === 'removed') {
          setDepartments(prev => prev.filter(d => d.id !== dept.id));
        }
      });
    });

    return () => {
      deptUnsubscribe();
    };
  }, []);

  // Fetch recommendations
  useEffect(() => {
    if (!session || !profile) {
      console.log('No session or profile, skipping recommendations fetch');
      return;
    }

    const fetchRecommendations = async () => {
      try {
        console.log('Fetching recommendations...');
        // Use a query for non-admins, no query for admins
        let recQuery: Query<DocumentData, DocumentData> = collection(db, 'recommendations');
        if (profile?.role !== 'admin' && session?.uid) {
          recQuery = query(recQuery, where('userId', '==', session.uid));
        }
        const querySnapshot = await getDocs(recQuery);
        const recData = await Promise.all(
          querySnapshot.docs.map(async docSnapshot => {
            const data = docSnapshot.data() as RecommendationDoc;
            const userDoc = await getDoc(doc(db, 'users', data.userId));
            return {
              id: docSnapshot.id,
              title: data.content.split('\n')[0] || data.content,
              description: data.content.split('\n').slice(1).join('\n') || '',
              userId: data.userId,
              createdBy: userDoc.exists() ? (userDoc.data() as UserDoc).name : 'Unknown',
              departmentId: data.departmentId || null,
              deadline: data.deadline || null,
              status: data.status,
              completedAt: data.completedAt || undefined,
            } as Recommendation;
          })
        );
    
        console.log('Fetched recommendations:', recData);
        setRecommendations(recData);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
      }
    };

    fetchRecommendations();

    // Real-time subscription for recommendations
    const recUnsubscribe = onSnapshot(collection(db, 'recommendations'), (snapshot) => {
      const changes = snapshot.docChanges();
      changes.forEach(change => {
        const data = change.doc.data() as RecommendationDoc;
        getDoc(doc(db, 'users', data.userId)).then(userDoc => {
          const rec = {
            id: change.doc.id,
            title: data.content.split('\n')[0] || data.content,
            description: data.content.split('\n').slice(1).join('\n') || '',
            userId: data.userId,
            createdBy: userDoc.exists() ? (userDoc.data() as UserDoc).name : 'Unknown',
            departmentId: data.departmentId || null,
            deadline: data.deadline || null,
            status: data.status,
            completedAt: data.completedAt || undefined,
          } as Recommendation;

          if (profile.role === 'admin' || rec.userId === session.uid || rec.departmentId === profile.departmentId) {
            if (change.type === 'added') {
              setRecommendations(prev => [rec, ...prev]);
            } else if (change.type === 'modified') {
              setRecommendations(prev => prev.map(r => (r.id === rec.id ? rec : r)));
            } else if (change.type === 'removed') {
              setRecommendations(prev => prev.filter(r => r.id !== rec.id));
            }
          }
        }).catch(err => {
          console.error('Error fetching user for recommendation:', err);
        });
      });
    });

    return () => {
      recUnsubscribe();
    };
  }, [session, profile]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign-in with:', { email });
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign-in successful, waiting for auth state change...');
    } catch (err) {
      console.error('Sign-in error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, departmentId: string) => {
    try {
      console.log('Attempting sign-up with:', { email, name, departmentId });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        role: 'admin' as const,
        name,
        departmentId: departmentId || null,
      });
      console.log('Sign-up successful:', { user });
    } catch (err) {
      console.error('Sign-up error:', err);
      setError(err instanceof Error ? err.message : 'Signup failed');
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setSession(null);
      setProfile(null);
      setRecommendations([]);
      setUsers([]);
      setError(null);
      console.log('Sign-out successful');
    } catch (err) {
      console.error('Sign-out error:', err);
      setError(err instanceof Error ? err.message : 'Sign-out failed');
      throw err;
    }
  };

  const addRecommendation = async (newRecommendation: Omit<Recommendation, 'id' | 'status' | 'createdBy'>) => {
    if (!session || !profile) {
      setError('You must be logged in to add a recommendation');
      throw new Error('You must be logged in to add a recommendation');
    }

    try {
      const content = `${newRecommendation.title}\n${newRecommendation.description}`.trim();
      const recommendation: RecommendationDoc = {
        userId: newRecommendation.userId,
        departmentId: newRecommendation.departmentId || null,
        content,
        deadline: newRecommendation.deadline || null,
        status: 'in_progress',
        completedAt: null,
      };
      const docRef = await addDoc(collection(db, 'recommendations'), recommendation);
      const userDoc = await getDoc(doc(db, 'users', newRecommendation.userId));
      const response: RecommendationResponse = {
        id: docRef.id,
        userId: newRecommendation.userId,
        departmentId: newRecommendation.departmentId || null,
        content,
        deadline: newRecommendation.deadline || null,
        status: 'in_progress',
        completedAt: null,
        createdBy: userDoc.exists() ? (userDoc.data() as UserDoc).name : 'Unknown',
      };
      return response;
    } catch (err) {
      console.error('Error adding recommendation:', err);
      setError(err instanceof Error ? err.message : 'Failed to add recommendation');
      throw err;
    }
  };

  const updateRecommendation = async (id: string, data: Partial<Recommendation>) => {
    try {
      const currentRec = recommendations.find(r => r.id === id);
      if (!currentRec) {
        setError('Recommendation not found');
        throw new Error('Recommendation not found');
      }

      const content = data.title && data.description
        ? `${data.title}\n${data.description}`.trim()
        : data.title
        ? `${data.title}\n${currentRec.description}`.trim()
        : data.description
        ? `${currentRec.title}\n${data.description}`.trim()
        : undefined;

      const updateData: Partial<RecommendationDoc> = {
        ...(content && { content }),
        ...(data.departmentId !== undefined && { departmentId: data.departmentId || null }),
        ...(data.deadline !== undefined && { deadline: data.deadline || null }),
      };

      await updateDoc(doc(db, 'recommendations', id), updateData);
    } catch (err) {
      console.error('Error updating recommendation:', err);
      setError(err instanceof Error ? err.message : 'Failed to update recommendation');
      throw err;
    }
  };

  const deleteRecommendation = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'recommendations', id));
    } catch (err) {
      console.error('Error deleting recommendation:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete recommendation');
      throw err;
    }
  };

  const updateRecommendationStatus = async (id: string, status: Recommendation['status'], completedAt?: string) => {
    try {
      const updateData: Partial<RecommendationDoc> = {
        status,
        ...(completedAt !== undefined && { completedAt: completedAt || null }),
      };
      await updateDoc(doc(db, 'recommendations', id), updateData);
    } catch (err) {
      console.error('Error updating recommendation status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update recommendation status');
      throw err;
    }
  };

  const getRecommendationsByDepartment = (departmentId: string) => {
    return recommendations.filter(rec => rec.departmentId === departmentId);
  };

  const getRecommendationsByStatus = (status: Recommendation['status']) => {
    return recommendations.filter(rec => rec.status === status);
  };

  const getRecommendationsByUser = (userId: string) => {
    return recommendations.filter(rec => rec.userId === userId);
  };

  const addDepartment = async (department: Omit<Department, 'id'>) => {
    try {
      console.log('Adding department:', department);
      const docRef = await addDoc(collection(db, 'departments'), department);
      setDepartments(prev => [...prev, { id: docRef.id, ...department }]);
    } catch (err) {
      console.error('Error adding department:', err);
      setError(err instanceof Error ? err.message : 'Failed to add department');
      throw err;
    }
  };

  const getFilteredRecommendations = () => {
    let filtered = recommendations;

    if (profile && profile.role === 'user') {
      filtered = filtered.filter(
        rec => rec.userId === session?.uid || rec.departmentId === profile.departmentId
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(rec => rec.status === statusFilter);
    }

    if (profile?.role === 'admin' && departmentFilter !== 'all') {
      filtered = filtered.filter(rec => rec.departmentId === departmentFilter);
    }

    return filtered;
  };

  console.log('AuthProvider render - Session:', !!session, 'Profile:', !!profile, 'Loading:', loading);

  return (
    <AuthContext.Provider
      value={{
        session,
        departments,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        recommendations,
        users,
        addRecommendation,
        updateRecommendation,
        deleteRecommendation,
        updateRecommendationStatus,
        getRecommendationsByDepartment,
        getRecommendationsByStatus,
        getRecommendationsByUser,
        addDepartment,
        statusFilter,
        setStatusFilter,
        departmentFilter,
        setDepartmentFilter,
        getFilteredRecommendations,
        error,
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