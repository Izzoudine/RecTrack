/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import supabase from '../config/supabaseClient';
import { useAuth } from './AuthContext';
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

interface RecommendationsContextType {
  recommendations: Recommendation[];
  departments: Department[];
  users: { id: string; name: string; departmentId: string | null }[];
  addRecommendation: (recommendation: Omit<Recommendation, 'id' | 'status' | 'createdBy'>) => Promise<void>;
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
  loading: boolean;
  error: string | null;
}

const RecommendationsContext = createContext<RecommendationsContextType>({} as RecommendationsContextType);

export const useRecommendations = () => {
  const context = useContext(RecommendationsContext);
  if (!context) {
    throw new Error('useRecommendations must be used within a RecommendationsProvider');
  }
  return context;
};

export function RecommendationsProvider ({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; departmentId: string | null }[]>([]);
  const [statusFilter, setStatusFilter] = useState<Recommendation['status'] | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define type for recommendation query response
  type RecommendationResponse = {
    id: string;
    user_id: string;
    departmentid: string | null;
    content: string;
    deadline: string | null;
    status: 'in_progress' | 'completed' | 'overdue';
    completed_at: string | null;
    profiles: { name: string } | null;
  };

  // Fetch initial data and set up real-time subscriptions
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching departments in RecommendationsProvider...');
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id, acronym, name')
          .order('name');
        if (deptError) throw deptError;
        console.log('Departments fetched:', deptData);
        setDepartments(deptData || []);

        // Fetch users
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('user_id, name, departmentid')
          .eq('role', 'user');
        if (userError) throw userError;
        setUsers(
          userData?.map(u => ({
            id: u.user_id,
            name: u.name,
            departmentId: u.departmentid || null,
          })) || []
        );

        // Fetch recommendations
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Real-time subscriptions
    const deptChannel = supabase
      .channel('departments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'departments' },
        payload => {
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
      supabase.removeChannel(deptChannel);
      supabase.removeChannel(recChannel);
    };
  }, [supabase, session, profile]);

  // Add a new recommendation
  const addRecommendation = async (newRecommendation: Omit<Recommendation, 'id' | 'status' | 'createdBy'>) => {
    if (!session || !profile) {
      setError('You must be logged in to add a recommendation');
      return;
    }

    try {
      const content = `${newRecommendation.title}\n${newRecommendation.description}`.trim();
      const { data, error } = await supabase
        .from('recommendations')
        .insert({
          user_id: newRecommendation.userId, // Use form userId
          departmentid: newRecommendation.departmentId || null,
          content,
          deadline: newRecommendation.deadline || null,
          status: 'in_progress',
        })
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
        .single() as PostgrestSingleResponse<RecommendationResponse>;

      if (error) throw error;

      if (data) {
        setRecommendations(prev => [
          {
            id: data.id,
            title: data.content.split('\n')[0] || data.content,
            description: data.content.split('\n').slice(1).join('\n') || '',
            userId: data.user_id,
            createdBy: data.profiles?.name ?? 'Unknown',
            departmentId: data.departmentid || null,
            deadline: data.deadline || null,
            status: data.status,
            completedAt: data.completed_at || undefined,
          },
          ...prev,
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add recommendation');
    }
  };

  // Update recommendation
  const updateRecommendation = async (id: string, data: Partial<Recommendation>) => {
    try {
      const currentRec = recommendations.find(r => r.id === id);
      if (!currentRec) {
        setError('Recommendation not found');
        return;
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

      if (error) throw error;

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
      setError(err instanceof Error ? err.message : 'Failed to update recommendation');
    }
  };

  // Delete recommendation
  const deleteRecommendation = async (id: string) => {
    try {
      const { error } = await supabase.from('recommendations').delete().eq('id', id);
      if (error) throw error;

      setRecommendations(prev => prev.filter(rec => rec.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recommendation');
    }
  };

  // Update recommendation status
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

      if (error) throw error;

      setRecommendations(prev =>
        prev.map(rec =>
          rec.id === id
            ? { ...rec, status, ...(completedAt !== undefined && { completedAt }) }
            : rec
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // Get recommendations by department
  const getRecommendationsByDepartment = (departmentId: string) => {
    return recommendations.filter(rec => rec.departmentId === departmentId);
  };

  // Get recommendations by status
  const getRecommendationsByStatus = (status: Recommendation['status']) => {
    return recommendations.filter(rec => rec.status === status);
  };

  // Get recommendations by user
  const getRecommendationsByUser = (userId: string) => {
    return recommendations.filter(rec => rec.userId === userId);
  };

  // Add a new department
  const addDepartment = async (department: Omit<Department, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .insert({ acronym: department.acronym, name: department.name })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setDepartments(prev => [...prev, data]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add department');
    }
  };

  // Get filtered recommendations
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

  return (
    <RecommendationsContext.Provider
      value={{
        recommendations,
        departments,
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
        loading,
        error,
      }}
    >
      {children}
    </RecommendationsContext.Provider>
  );
};