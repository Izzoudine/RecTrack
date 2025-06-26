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

export type Mission = {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdByName: string;
  departmentId: string | null;
  deadline: string | null;
  createdAt: string;
  completedAt?: string | null;
  status: 'active' | 'completed' | 'overdue';
  
};

export type Recommendation = {
  id: string;
  title: string;
  description: string;
  userId: string;
  createdBy: string;
  departmentId: string | null;
  missionId: string; // New field linking to mission
  deadline: string | null;
  status: 'in_progress' | 'pending' | 'confirmed' | 'completed' | 'overdue';
  completedAt?: string;
  confirmedAt?: string;
  confirmedBy?: string;
};

export type RecommendationResponse = {
  id: string;
  userId: string;
  departmentId: string | null;
  missionId: string;
  content: string;
  deadline: string | null;
  status: 'in_progress' | 'pending' | 'confirmed' | 'completed' | 'overdue';
  completedAt: string | null;
  confirmedAt?: string | null;
  confirmedBy?: string | null;
  createdBy?: string;
};

interface Profile {
  id: string;
  role: 'admin' | 'user' | 'chief';
  departmentId: string | null;
  name: string;
}

interface UserDoc {
  id: string;
  role: 'admin' | 'user' | 'chief';
  name: string;
  departmentId: string | null;
}

interface MissionDoc {
  title: string;
  description: string;
  createdBy: string;
  departmentId: string | null;
  deadline: string | null;
  createdAt: string;
  completedAt?: string | null;
  status: 'active' | 'completed' | 'overdue';
}

interface RecommendationDoc {
  userId: string;
  departmentId: string | null;
  missionId: string;
  content: string;
  deadline: string | null;
  status: 'in_progress' | 'pending' | 'confirmed' | 'completed' | 'overdue';
  completedAt: string | null;
  confirmedAt?: string | null;
  confirmedBy?: string | null;
}

interface AuthContextType {
  session: User | null;
  departments: Department[];
  missions: Mission[];
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, departmentId: string, userType:string) => Promise<void>;
  signOut: () => Promise<void>;
  recommendations: Recommendation[];
  chiefRecommendations: Recommendation[];
  users: { id: string; name: string; departmentId: string | null }[];
  chiefUsers: { id: string; name: string; departmentId: string | null }[];
  
  // Mission functions
  addMission: (mission: Omit<Mission, 'id' | 'createdBy' | 'createdByName' | 'createdAt' | 'status'>) => Promise<Mission>;
  updateMission: (id: string, data: Partial<Mission>) => Promise<void>;
  deleteMission: (id: string) => Promise<void>;
  updateMissionStatus: (id: string, status: Mission['status']) => Promise<void>;
  getMissionsByDepartment: (departmentId: string) => Mission[];
  getMissionsByStatus: (status: Mission['status']) => Mission[];
  
  // Recommendation functions
  addRecommendation: (recommendation: Omit<Recommendation, 'id' | 'status' | 'createdBy' | 'confirmedAt' | 'confirmedBy'>) => Promise<RecommendationResponse>;
  updateRecommendation: (id: string, data: Partial<Recommendation>) => Promise<void>;
  deleteRecommendation: (id: string) => Promise<void>;
  updateRecommendationStatus: (id: string, status: Recommendation['status'], completedAt?: string) => Promise<void>;
  
  confirmRecommendation: (id: string) => Promise<void>;
  submitForConfirmation: (id: string) => Promise<void>;
  
  getRecommendationsByDepartment: (departmentId: string) => Recommendation[];
  getRecommendationsByStatus: (status: Recommendation['status']) => Recommendation[];
  getRecommendationsByUser: (userId: string) => Recommendation[];
  getRecommendationsByMission: (missionId: string) => Recommendation[];
  getChiefRecommendationsByDepartment: (departmentId: string) => Recommendation[];
  getPendingRecommendations: () => Recommendation[];
  getChiefPendingRecommendations: () => Recommendation[];
  addDepartment: (department: Omit<Department, 'id'>) => Promise<void>;
  statusFilter: Recommendation['status'] | 'all';
  setStatusFilter: (status: Recommendation['status'] | 'all') => void;
  departmentFilter: string | 'all';
  setDepartmentFilter: (departmentId: string | 'all') => void;
  getFilteredRecommendations: () => Recommendation[];
  getFilteredChiefRecommendations: () => Recommendation[];
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [chiefRecommendations, setChiefRecommendations] = useState<Recommendation[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; departmentId: string | null }[]>([]);
  const [chiefUsers, setChiefUsers] = useState<{ id: string; name: string; departmentId: string | null }[]>([]);
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

  // Fetch departments, users and missions with real-time listeners
  useEffect(() => {
    // Real-time subscription for departments
    const deptUnsubscribe = onSnapshot(collection(db, 'departments'), (snapshot) => {
      console.log('Departments snapshot received');
      const deptData = snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as Department[];
      setDepartments(deptData);
    });

    // Real-time subscription for missions
    const missionsUnsubscribe = onSnapshot(collection(db, 'missions'), async (snapshot) => {
      console.log('Missions snapshot received');
      try {
        const missionsData = await Promise.all(
          snapshot.docs.map(async docSnapshot => {
            const data = docSnapshot.data() as MissionDoc;
            const createdByDoc = await getDoc(doc(db, 'users', data.createdBy));
            
            return {
              id: docSnapshot.id,
              title: data.title,
              description: data.description,
              createdBy: data.createdBy,
              createdByName: createdByDoc.exists() ? (createdByDoc.data() as UserDoc).name : 'Inconnu',
              departmentId: data.departmentId,
              deadline: data.deadline,
              createdAt: data.createdAt,
              status: data.status,
            } as Mission;
          })
        );

        // Filter missions based on user role
        let filteredMissions = missionsData;
        if (profile && profile.role !== 'admin') {
          if (profile.role === 'chief' && profile.departmentId) {
            // Chiefs see missions from their department
            filteredMissions = missionsData.filter(mission => 
              mission.departmentId === profile.departmentId || mission.createdBy === profile.id
            );
          } else if (profile.role === 'user') {
            // Users see missions from their department
            filteredMissions = missionsData.filter(mission => 
              mission.departmentId === profile.departmentId
            );
          }
        }

        setMissions(filteredMissions);
      } catch (err) {
        console.error('Error processing missions:', err);
        setError(err instanceof Error ? err.message : 'Failed to process missions');
      }
    });

    // Real-time subscription for users (only for admins)
    let userUnsubscribe: (() => void) | undefined;
    if (profile?.role === 'admin') {
      userUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        console.log('Users snapshot received');
        const userData = snapshot.docs
          .filter(docSnapshot => docSnapshot.data().role === 'user')
          .map(docSnapshot => ({
            id: docSnapshot.id,
            name: docSnapshot.data().name,
            departmentId: docSnapshot.data().departmentId || null,
          }));
        setUsers(userData);
      });
    } else {
      setUsers([]);
    }

    // Real-time subscription for chief users
    let chiefUserUnsubscribe: (() => void) | undefined;
    if (profile?.role === 'chief' && profile?.departmentId) {
      const chiefUserQuery = query(
        collection(db, 'users'),
        where('departmentId', '==', profile.departmentId)
      );
      
      chiefUserUnsubscribe = onSnapshot(chiefUserQuery, (snapshot) => {
        console.log('Chief users snapshot received for department:', profile.departmentId);
        const chiefUserData = snapshot.docs
          .filter(docSnapshot => {
            const userData = docSnapshot.data();
            return (userData.role === 'user' || userData.role === 'chief') && 
                   docSnapshot.id !== profile.id;
          })
          .map(docSnapshot => ({
            id: docSnapshot.id,
            name: docSnapshot.data().name,
            departmentId: docSnapshot.data().departmentId || null,
          }));
        setChiefUsers(chiefUserData);
      });
    } else {
      setChiefUsers([]);
    }

    return () => {
      deptUnsubscribe();
      missionsUnsubscribe();
      if (userUnsubscribe) userUnsubscribe();
      if (chiefUserUnsubscribe) chiefUserUnsubscribe();
    };
  }, [profile?.role, profile?.departmentId, profile?.id]);

  // Fetch recommendations with real-time listener
  useEffect(() => {
    if (!session || !profile) {
      console.log('No session or profile, clearing recommendations');
      setRecommendations([]);
      setChiefRecommendations([]);
      return;
    }

    // Real-time subscription for recommendations
    let recQuery: Query<DocumentData, DocumentData> = collection(db, 'recommendations');
    if (profile?.role !== 'admin' && session?.uid) {
      recQuery = query(recQuery, where('userId', '==', session.uid));
    }

    const recUnsubscribe = onSnapshot(recQuery, async (snapshot) => {
      console.log('Recommendations snapshot received');
      try {
        const recData = await Promise.all(
          snapshot.docs.map(async docSnapshot => {
            const data = docSnapshot.data() as RecommendationDoc;
            const userDoc = await getDoc(doc(db, 'users', data.userId));
            
            // Get confirmedBy user name if exists
            let confirmedByName = undefined;
            if (data.confirmedBy) {
              const confirmedByDoc = await getDoc(doc(db, 'users', data.confirmedBy));
              confirmedByName = confirmedByDoc.exists() ? (confirmedByDoc.data() as UserDoc).name : 'Inconnu';
            }
            
            return {
              id: docSnapshot.id,
              title: data.content.split('\n')[0] || data.content,
              description: data.content.split('\n').slice(1).join('\n') || '',
              userId: data.userId,
              createdBy: userDoc.exists() ? (userDoc.data() as UserDoc).name : 'Inconnu',
              departmentId: data.departmentId || null,
              missionId: data.missionId,
              deadline: data.deadline || null,
              status: data.status,
              completedAt: data.completedAt || undefined,
              confirmedAt: data.confirmedAt || undefined,
              confirmedBy: confirmedByName,
            } as Recommendation;
          })
        );

        // Filter recommendations based on user role and permissions
        let filteredRecs = recData;
        if (profile.role !== 'admin') {
          filteredRecs = recData.filter(
            rec => rec.userId === session.uid || 
                   (rec.departmentId && rec.departmentId === profile.departmentId)
          );
        }

        console.log('Filtered recommendations:', filteredRecs);
        setRecommendations(filteredRecs);
        setError(null);
      } catch (err) {
        console.error('Error processing recommendations:', err);
        setError(err instanceof Error ? err.message : 'Failed to process recommendations');
      }
    });

    return () => {
      recUnsubscribe();
    };
  }, [session?.uid, profile?.role, profile?.departmentId]);

  // Fetch chief recommendations based on department
  useEffect(() => {
    if (!session || !profile || profile.role !== 'chief' || !profile.departmentId) {
      console.log('Not a chief or no department, clearing chief recommendations');
      setChiefRecommendations([]);
      return;
    }

    const chiefRecQuery = query(
      collection(db, 'recommendations'),
      where('departmentId', '==', profile.departmentId)
    );

    const chiefRecUnsubscribe = onSnapshot(chiefRecQuery, async (snapshot) => {
      console.log('Chief recommendations snapshot received for department:', profile.departmentId);
      try {
        const chiefRecData = await Promise.all(
          snapshot.docs.map(async docSnapshot => {
            const data = docSnapshot.data() as RecommendationDoc;
            const userDoc = await getDoc(doc(db, 'users', data.userId));
            
            let confirmedByName = undefined;
            if (data.confirmedBy) {
              const confirmedByDoc = await getDoc(doc(db, 'users', data.confirmedBy));
              confirmedByName = confirmedByDoc.exists() ? (confirmedByDoc.data() as UserDoc).name : 'Inconnu';
            }
            
            return {
              id: docSnapshot.id,
              title: data.content.split('\n')[0] || data.content,
              description: data.content.split('\n').slice(1).join('\n') || '',
              userId: data.userId,
              createdBy: userDoc.exists() ? (userDoc.data() as UserDoc).name : 'Inconnu',
              departmentId: data.departmentId || null,
              missionId: data.missionId,
              deadline: data.deadline || null,
              status: data.status,
              completedAt: data.completedAt || undefined,
              confirmedAt: data.confirmedAt || undefined,
              confirmedBy: confirmedByName,
            } as Recommendation;
          })
        );

        console.log('Chief recommendations processed:', chiefRecData);
        setChiefRecommendations(chiefRecData);
      } catch (err) {
        console.error('Error processing chief recommendations:', err);
        setError(err instanceof Error ? err.message : 'Failed to process chief recommendations');
      }
    });

    return () => {
      chiefRecUnsubscribe();
    };
  }, [session?.uid, profile?.role, profile?.departmentId]);

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

  const signUp = async (email: string, password: string, name: string, departmentId: string, userType: string) => {
    try {
      console.log('Attempting sign-up with:', { email, name, departmentId, userType });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const role: "user" | "chief" = userType === 'department_head' ? 'chief' : 'user';
      
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        role,
        name,
        departmentId: departmentId || null,
      });
      
      console.log('Sign-up successful:', { user, role });
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
      setChiefRecommendations([]);
      setMissions([]);
      setUsers([]);
      setChiefUsers([]);
      setError(null);
      console.log('Sign-out successful');
    } catch (err) {
      console.error('Sign-out error:', err);
      setError(err instanceof Error ? err.message : 'Sign-out failed');
      throw err;
    }
  };

  // Mission functions
  const addMission = async (newMission: Omit<Mission, 'id' | 'createdBy' | 'createdByName' | 'createdAt' | 'status'>) => {
    if (!session || !profile) {
      setError('Vous devez être connecté pour créer une mission');
      throw new Error('Vous devez être connecté pour créer une mission');
    }

    // Only admin and chief can create missions
    if (profile.role !== 'admin' && profile.role !== 'chief') {
      setError('Seuls les administrateurs et chefs de département peuvent créer des missions');
      throw new Error('Seuls les administrateurs et chefs de département peuvent créer des missions');
    }

    try {
      const missionDoc: MissionDoc = {
        title: newMission.title,
        description: newMission.description,
        createdBy: session.uid,
        departmentId: newMission.departmentId || null,
        deadline: newMission.deadline || null,
        createdAt: new Date().toISOString(),
        completedAt: null,
        status: 'active',
      };

      const docRef = await addDoc(collection(db, 'missions'), missionDoc);
      
      const mission: Mission = {
        id: docRef.id,
        title: newMission.title,
        description: newMission.description,
        createdBy: session.uid,
        createdByName: profile.name,
        departmentId: newMission.departmentId || null,
        deadline: newMission.deadline || null,
        createdAt: missionDoc.createdAt,
        completedAt: null,
        status: 'active',
      };

      return mission;
    } catch (err) {
      console.error('Error adding mission:', err);
      setError(err instanceof Error ? err.message : 'Échec de la création de la mission');
      throw err;
    }
  };

  const updateMission = async (id: string, data: Partial<Mission>) => {
    try {
      const updateData: Partial<MissionDoc> = {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.departmentId !== undefined && { departmentId: data.departmentId || null }),
        ...(data.deadline !== undefined && { deadline: data.deadline || null }),
        ...(data.status && { status: data.status }),
      };

      await updateDoc(doc(db, 'missions', id), updateData);
    } catch (err) {
      console.error('Error updating mission:', err);
      setError(err instanceof Error ? err.message : 'Échec de la mise à jour de la mission');
      throw err;
    }
  };

  const deleteMission = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'missions', id));
    } catch (err) {
      console.error('Error deleting mission:', err);
      setError(err instanceof Error ? err.message : 'Échec de la suppression de la mission');
      throw err;
    }
  };

  const updateMissionStatus = async (id: string, status: Mission['status']) => {
    try {
      await updateDoc(doc(db, 'missions', id), { status });
    } catch (err) {
      console.error('Error updating mission status:', err);
      setError(err instanceof Error ? err.message : 'Échec de la mise à jour du statut de la mission');
      throw err;
    }
  };

  // Recommendation functions
  const addRecommendation = async (newRecommendation: Omit<Recommendation, 'id' | 'status' | 'createdBy' | 'confirmedAt' | 'confirmedBy'>) => {
    if (!session || !profile) {
      setError('Vous devez être connecté pour ajouter une recommandation');
      throw new Error('Vous devez être connecté pour ajouter une recommandation');
    }

    try {
      const content = `${newRecommendation.title}\n${newRecommendation.description}`.trim();
      const recommendation: RecommendationDoc = {
        userId: newRecommendation.userId,
        departmentId: newRecommendation.departmentId || null,
        missionId: newRecommendation.missionId,
        content,
        deadline: newRecommendation.deadline || null,
        status: 'in_progress',
        completedAt: null,
        confirmedAt: null,
        confirmedBy: null,
      };
      const docRef = await addDoc(collection(db, 'recommendations'), recommendation);
      const userDoc = await getDoc(doc(db, 'users', newRecommendation.userId));
      const response: RecommendationResponse = {
        id: docRef.id,
        userId: newRecommendation.userId,
        departmentId: newRecommendation.departmentId || null,
        missionId: newRecommendation.missionId,
        content,
        deadline: newRecommendation.deadline || null,
        status: 'in_progress',
        completedAt: null,
        confirmedAt: null,
        confirmedBy: null,
        createdBy: userDoc.exists() ? (userDoc.data() as UserDoc).name : 'Inconnu',
      };
      return response;
    } catch (err) {
      console.error('Error adding recommendation:', err);
      setError(err instanceof Error ? err.message : 'Échec de l\'ajout de la recommandation');
      throw err;
    }
  };

 const updateRecommendation = async (id: string, data: Partial<Recommendation>) => {
  try {
    console.log('Trying to update recommendation with id:', id);

    const updateData: Partial<RecommendationDoc> = {};

    if (data.title || data.description) {
      const currentRec = recommendations.find(r => r.id === id);
      const title = data.title ?? currentRec?.title ?? '';
      const description = data.description ?? currentRec?.description ?? '';
      updateData.content = `${title}\n${description}`.trim();
    }

    if ('departmentId' in data) {
      updateData.departmentId = data.departmentId || null;
    }

    if ('missionId' in data) {
      updateData.missionId = data.missionId!;
    }

    if ('deadline' in data) {
      updateData.deadline = data.deadline || null;
    }

    await updateDoc(doc(db, 'recommendations', id), updateData);
  } catch (err) {
    console.error('Error updating recommendation:', err);
    setError(err instanceof Error ? err.message : 'Échec de la mise à jour de la recommandation');
    throw err;
  }
};


  const deleteRecommendation = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'recommendations', id));
    } catch (err) {
      console.error('Error deleting recommendation:', err);
      setError(err instanceof Error ? err.message : 'Échec de la suppression de la recommandation');
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
      setError(err instanceof Error ? err.message : 'Échec de la mise à jour du statut de la recommandation');
      throw err;
    }
  };

  const submitForConfirmation = async (id: string) => {
    if (!session || !profile) {
      setError('Vous devez être connecté pour soumettre une recommandation');
      throw new Error('Vous devez être connecté pour soumettre une recommandation');
    }

    try {
      const recommendation = recommendations.find(r => r.id === id);
      if (!recommendation) {
        throw new Error('Recommandation introuvable');
      }

      if (recommendation.userId !== session.uid) {
        throw new Error('Vous ne pouvez soumettre que vos propres recommandations pour confirmation');
      }

      if (recommendation.status !== 'in_progress') {
        throw new Error('Seules les recommandations en cours peuvent être soumises pour confirmation');
      }

      await updateDoc(doc(db, 'recommendations', id), {
        status: 'pending'
      });

      console.log('Recommendation submitted for confirmation:', id);
    } catch (err) {
      console.error('Error submitting recommendation for confirmation:', err);
      setError(err instanceof Error ? err.message : 'Échec de la soumission de la recommandation pour confirmation');
      throw err;
    }
  };

  const confirmRecommendation = async (id: string) => {
    if (!session || !profile) {
      setError('Vous devez être connecté pour confirmer une recommandation');
      throw new Error('Vous devez être connecté pour confirmer une recommandation');
    }

    try {
      const recommendation = recommendations.find(r => r.id === id) || 
                            chiefRecommendations.find(r => r.id === id);
      
      if (!recommendation) {
        throw new Error('Recommendation not found');
      }

      // Check permissions: admin can confirm all, chief can only confirm from their department
      const canConfirm = profile.role === 'admin' || 
                        (profile.role === 'chief' && recommendation.departmentId === profile.departmentId);
      
      if (!canConfirm) {
        throw new Error('You do not have permission to confirm this recommendation');
      }

      // Only allow confirmation if status is 'pending'
      if (recommendation.status !== 'pending') {
        throw new Error('Only pending recommendations can be confirmed');
      }

      const now = new Date().toISOString();
      await updateDoc(doc(db, 'recommendations', id), {
        status: 'confirmed',
        confirmedAt: now,
        confirmedBy: session.uid
      });

      console.log('Recommendation confirmed:', id);
    } catch (err) {
      console.error('Error confirming recommendation:', err);
      setError(err instanceof Error ? err.message : 'Failed to confirm recommendation');
      throw err;
    }
  };

  const getRecommendationsByDepartment = (departmentId: string) => {
    return recommendations.filter(rec => rec.departmentId === departmentId);
  };
  const getRecommendationsByMission = (missionId: string) => {
    return recommendations.filter(rec => rec.missionId === missionId);
  };
  

  const getRecommendationsByStatus = (status: Recommendation['status']) => {
    return recommendations.filter(rec => rec.status === status);
  };

  const getRecommendationsByUser = (userId: string) => {
    return recommendations.filter(rec => rec.userId === userId);
  };

  const getChiefRecommendationsByDepartment = (departmentId: string) => {
    return chiefRecommendations.filter(rec => rec.departmentId === departmentId);
  };

  // New function to get pending recommendations for admin
  const getPendingRecommendations = () => {
    if (profile?.role !== 'admin') return [];
    return recommendations.filter(rec => rec.status === 'pending');
  };

  // New function to get pending recommendations for chief (department specific)
  const getChiefPendingRecommendations = () => {
    if (profile?.role !== 'chief' || !profile.departmentId) return [];
    return chiefRecommendations.filter(rec => rec.status === 'pending');
  };

  const addDepartment = async (department: Omit<Department, 'id'>) => {
    try {
      console.log('Adding department:', department);
      await addDoc(collection(db, 'departments'), department);
      // Don't manually update state - let the listener handle it
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

  const getFilteredChiefRecommendations = () => {
    let filtered = chiefRecommendations;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(rec => rec.status === statusFilter);
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
        chiefRecommendations,
        users,
        chiefUsers,
        missions,                     //  ←  NEW
        addMission,                   //  ←  NEW
        updateMission,                //  ←  NEW
        deleteMission,                //  ←  NEW
        updateMissionStatus,          //  ←  NEW
       
        addRecommendation,
        updateRecommendation,
        deleteRecommendation,
        updateRecommendationStatus,
        confirmRecommendation,
        submitForConfirmation,
        getRecommendationsByDepartment,
        getRecommendationsByStatus,
        getRecommendationsByUser,
        getChiefRecommendationsByDepartment,
        getPendingRecommendations,
        getChiefPendingRecommendations,
        addDepartment,
        statusFilter,
        setStatusFilter,
        departmentFilter,
        setDepartmentFilter,
        getFilteredRecommendations,
        getFilteredChiefRecommendations,
        getRecommendationsByMission,
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