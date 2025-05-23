/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import supabase from '../config/supabaseClient';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

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
  user_id: string;
  departmentid: string | null;
  content: string;
  deadline: string | null;
  status: 'in_progress' | 'completed' | 'overdue';
  completed_at: string | null;
  profiles?: { name: string };
};


interface AuthContextType {
  session: any | null;
  departments: Department[];
  profile: { user_id: string; role: 'admin' | 'user'; departmentid: string | null; name: string } | null;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<{ user_id: string; role: 'admin' | 'user'; departmentid: string | null; name: string } | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; departmentId: string | null }[]>([]);
  const [statusFilter, setStatusFilter] = useState<Recommendation['status'] | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = useRef(true);


  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        console.log('Fetching departments in AuthProvider...');
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id, acronym, name')
          .order('name');
        if (deptError) {
          console.error('Supabase error:', deptError.message, deptError.details);
          throw deptError;
        }
        console.log('Departments fetched:', deptData);
        setDepartments(Array.isArray(deptData) ? deptData : []);
      } catch (error) {
        console.error('Error fetching departments:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch departments');
      }
    };

    const fetchUsers = async () => {
      try {
        console.log('Fetching users in AuthProvider...');
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('user_id, name, departmentid')
          .eq('role', 'user');
          
          console.log("The users are",userData)
        if (userError) throw userError;
        setUsers(
          userData?.map(u => ({
            id: u.user_id,
            name: u.name,
            departmentId: u.departmentid || null,
          })) || []
        );
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch users');
      }
    };

    const fetchRecommendations = async () => {
      try {
        console.log('Fetching recommendations in AuthProvider...');
        if (session && profile) {
          let query = supabase
            .from('recommendations')
            .select(`
              id,
              user_id,
              departmentid,
              content,
              deadline,
              status,
              completed_at,
              profiles!recommendations_user_id_fkey(name)
            `)
            .order('created_at', { ascending: false });

          if (profile.role !== 'admin') {
            query = query.or(`user_id.eq.${session.user.id},departmentid.eq.${profile.departmentid}`);
          }

          const { data: recData, error: recError } = await query as PostgrestSingleResponse<RecommendationResponse[]>;
          if (recError) throw recError;

          setRecommendations(
            recData?.map(rec => ({
              id: rec.id,
              title: rec.content.split('\n')[0] || rec.content,
              description: rec.content.split('\n').slice(1).join('\n') || '',
              userId: rec.user_id,
              createdBy: rec.profiles?.name ?? 'Unknown',
              departmentId: rec.departmentid || null,
              deadline: rec.deadline || null,
              status: rec.status,
              completedAt: rec.completed_at || undefined,
            })) || []
          );
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch recommendations');
      }
    };

    const fetchSessionAndProfile = async () => {
      try {
        console.log('Fetching session and profile in AuthProvider...');
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (!newSession && session) return; // Avoid clearing session unnecessarily
        setSession(newSession);

        if (newSession) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('user_id, role, departmentid, name')
            .eq('user_id', newSession.user.id)
            .single();
          if (error) {
            console.error('Profile fetch error:', error.message, error.details);
            throw error;
          }
          setProfile(profileData as { user_id: string; role: 'admin' | 'user'; departmentid: string | null; name: string });
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error fetching session/profile:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch session/profile');
      }
    };

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        await fetchSessionAndProfile();
        await Promise.all([fetchDepartments(), fetchUsers()]);
        if (session && profile) {
          await fetchRecommendations();
        }
      } finally {
        setLoading(false);
      }
    }

    if (isInitialMount.current) {
      fetchData();
      isInitialMount.current = false;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log('Auth state change:', _event);
      if (newSession?.access_token !== session?.access_token) {
        setSession(newSession);
        if (newSession) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('user_id, role, departmentid, name')
              .eq('user_id', newSession.user.id)
              .single();
            if (error) {
              console.error('Profile fetch error in auth state change:', error.message, error.details);
              throw error;
            }
            setProfile(data as { user_id: string; role: 'admin' | 'user'; departmentid: string | null; name: string });
            await fetchRecommendations();
          } catch (error) {
            console.error('Auth state change error:', error);
            setError(error instanceof Error ? error.message : 'Authentication error');
            setProfile(null);
          }
        } else {
          setProfile(null);
          setRecommendations([]);
          setUsers([]);
        }
      }
    });

    const deptChannel = supabase
      .channel('departments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'departments' },
        payload => {
          console.log('Department change:', payload);
          if (payload.eventType === 'INSERT') {
            setDepartments(prev => [...prev, payload.new as Department]);
          } else if (payload.eventType === 'UPDATE') {
            setDepartments(prev =>
              prev.map(d => (d.id === payload.new.id ? (payload.new as Department) : d))
            );
          } else if (payload.eventType === 'DELETE') {
            setDepartments(prev => prev.filter(d => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const recChannel = supabase
      .channel('recommendations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recommendations' },
        async payload => {
          console.log('Recommendation change:', payload);
          if (payload.eventType === 'INSERT') {
            const newRec = payload.new as RecommendationResponse;
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name')
              .eq('user_id', newRec.user_id)
              .single();

            if (
              profile?.role === 'admin' ||
              newRec.user_id === session?.user.id ||
              newRec.departmentid === profile?.departmentid
            ) {
              setRecommendations(prev => [
                {
                  id: newRec.id,
                  title: newRec.content.split('\n')[0] || newRec.content,
                  description: newRec.content.split('\n').slice(1).join('\n') || '',
                  userId: newRec.user_id,
                  createdBy: profileData?.name ?? 'Unknown',
                  departmentId: newRec.departmentid || null,
                  deadline: newRec.deadline || null,
                  status: newRec.status,
                  completedAt: newRec.completed_at || undefined,
                },
                ...prev,
              ]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedRec = payload.new as RecommendationResponse;
            setRecommendations(prev =>
              prev.map(r =>
                r.id === updatedRec.id
                  ? {
                      ...r,
                      title: updatedRec.content.split('\n')[0] || updatedRec.content,
                      description: updatedRec.content.split('\n').slice(1).join('\n') || '',
                      departmentId: updatedRec.departmentid || null,
                      deadline: updatedRec.deadline || null,
                      status: updatedRec.status,
                      completedAt: updatedRec.completed_at || undefined,
                    }
                  : r
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setRecommendations(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(deptChannel);
      supabase.removeChannel(recChannel);
    };
  }, []); // Empty dependency array to run only once

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign-in with:', { email });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase sign-in error:', error.message);
        throw new Error(error.message);
      }

      if (!data.user?.id) {
        console.error('No user ID returned from Supabase');
        throw new Error('No user ID returned');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, role, departmentid, name')
        .eq('user_id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError.message, profileError.details, { user_id: data.user.id });
        throw new Error(profileError.message || 'Failed to fetch user profile');
      }

      if (!profile) {
        console.error('No profile found for user:', { user_id: data.user.id });
        throw new Error('No profile found');
      }

      setSession(data.session);
      setProfile(profile as { user_id: string; role: 'admin' | 'user'; departmentid: string | null; name: string });
      console.log('Sign-in successful:', { session: data.session, profile });
    } catch (error) {
      console.error('Sign-in error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
      throw error instanceof Error ? error : new Error('Login failed');
    }
  };

  const signUp = async (email: string, password: string, name: string, departmentId: string) => {
    try {
      console.log('Attempting sign-up with:', { email, name, departmentId });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role: 'user', departmentId },
        },
      });
      



      if (error) {
        console.error('Supabase sign-up error:', error.message);
        throw new Error(error.message);
      }

      if (!data.user) {
        console.error('No user returned from Supabase sign-up');
        throw new Error('Sign-up failed: No user created');
      }

      console.log('Sign-up successful:', { user: data.user });
    } catch (error) {
      console.error('Sign-up error:', error);
      setError(error instanceof Error ? error.message : 'Signup failed');
      throw error instanceof Error ? error : new Error('Signup failed');
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      setRecommendations([]);
      setUsers([]);
      setError(null);
      console.log('Sign-out successful');
    } catch (error) {
      console.error('Sign-out error:', error);
      setError(error instanceof Error ? error.message : 'Sign-out failed');
      throw error instanceof Error ? error : new Error('Sign-out failed');
    }
  };

  const addRecommendation = async (newRecommendation: Omit<Recommendation, 'id' | 'status' | 'createdBy'>) => {
    if (!session || !profile) {
      setError('You must be logged in to add a recommendation');
      throw new Error('You must be logged in to add a recommendation');
    }
  
    try {
      const content = `${newRecommendation.title}\n${newRecommendation.description}`.trim();
      const { data: recommendation, error: insertError } = await supabase
        .from('recommendations')
        .insert({
          user_id: newRecommendation.userId,
          departmentid: newRecommendation.departmentId || null,
          content,
          deadline: newRecommendation.deadline || null,
          status: 'in_progress',
        })
        .select('id, user_id, departmentid, content, deadline, status, completed_at')
        .single();
  
      if (insertError) {
        console.error('Supabase error adding recommendation:', insertError.message, insertError.details);
        throw insertError;
      }
  
      // Fetch profile name
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', newRecommendation.userId)
        .single();
  
      if (profileError) {
        console.error('Error fetching profile:', profileError.message, profileError.details);
        throw profileError;
      }
  
      const response: RecommendationResponse = {
        ...recommendation,
        profiles: profileData ? { name: profileData.name } : undefined,
      };
  
      if (recommendation) {
        setRecommendations(prev => [
          {
            id: recommendation.id,
            title: recommendation.content.split('\n')[0] || recommendation.content,
            description: recommendation.content.split('\n').slice(1).join('\n') || '',
            userId: recommendation.user_id,
            createdBy: profileData?.name ?? 'Unknown',
            departmentId: recommendation.departmentid || null,
            deadline: recommendation.deadline || null,
            status: recommendation.status,
            completedAt: recommendation.completed_at || undefined,
          },
          ...prev,
        ]);
      }
  
      return response;
    } catch (err) {
      console.error('Error adding recommendation:', err);
      setError(err instanceof Error ? err.message : 'Failed to add recommendation');
      throw err instanceof Error ? err : new Error('Failed to add recommendation');
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

      const updateData: any = {
        ...(content && { content }),
        ...(data.departmentId !== undefined && { departmentid: data.departmentId || null }),
        ...(data.deadline !== undefined && { deadline: data.deadline || null }),
      };

      const { error } = await supabase
        .from('recommendations')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Supabase error updating recommendation:', error.message, error.details);
        throw error;
      }

      setRecommendations(prev =>
        prev.map(rec =>
          rec.id === id
            ? {
                ...rec,
                ...(data.title && { title: data.title }),
                ...(data.description && { description: data.description }),
                ...(data.departmentId !== undefined && { departmentId: data.departmentId || null }),
                ...(data.deadline !== undefined && { deadline: data.deadline || null }),
              }
            : rec
        )
      );
    } catch (err) {
      console.error('Error updating recommendation:', err);
      setError(err instanceof Error ? err.message : 'Failed to update recommendation');
      throw err instanceof Error ? err : new Error('Failed to update recommendation');
    }
  };

  const deleteRecommendation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recommendations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting recommendation:', error.message, error.details);
        throw error;
      }

      setRecommendations(prev => prev.filter(rec => rec.id !== id));
    } catch (err) {
      console.error('Error deleting recommendation:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete recommendation');
      throw err instanceof Error ? err : new Error('Failed to delete recommendation');
    }
  };

  const updateRecommendationStatus = async (
    id: string,
    status: Recommendation['status'],
    completedAt?: string
  ) => {
    try {
      const updateData: any = {
        status,
        ...(completedAt !== undefined && { completed_at: completedAt || null }),
      };

      const { error } = await supabase
        .from('recommendations')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Supabase error updating recommendation status:', error.message, error.details);
        throw error;
      }

      setRecommendations(prev =>
        prev.map(rec =>
          rec.id === id
            ? { ...rec, status, ...(completedAt !== undefined && { completedAt }) }
            : rec
        )
      );
    } catch (err) {
      console.error('Error updating recommendation status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update recommendation status');
      throw err instanceof Error ? err : new Error('Failed to update recommendation status');
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
      const { data, error } = await supabase
        .from('departments')
        .insert({ acronym: department.acronym, name: department.name })
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding department:', error.message, error.details);
        throw error;
      }

      if (data) {
        setDepartments(prev => [...prev, data]);
      }
    } catch (err) {
      console.error('Error adding department:', err);
      setError(err instanceof Error ? err.message : 'Failed to add department');
      throw err instanceof Error ? err : new Error('Failed to add department');
    }
  };

  const getFilteredRecommendations = () => {
    let filtered = recommendations;

    if (profile && profile.role === 'user') {
      filtered = filtered.filter(
        rec => rec.userId === session?.user.id || rec.departmentId === profile.departmentid
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

  console.log('AuthProvider mounted');
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