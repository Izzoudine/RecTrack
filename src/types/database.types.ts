export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string
          acronym: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          acronym: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          acronym?: string
          name?: string
          created_at?: string
        }
      }
      recommendations: {
        Row: {
          id: string
          title: string
          description: string
          user_id: string
          created_by: string
          department_id: string
          deadline: string
          status: 'in_progress' | 'completed' | 'overdue'
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          user_id: string
          created_by: string
          department_id: string
          deadline: string
          status?: 'in_progress' | 'completed' | 'overdue'
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          user_id?: string
          created_by?: string
          department_id?: string
          deadline?: string
          status?: 'in_progress' | 'completed' | 'overdue'
          completed_at?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          username: string
          name: string
          role: 'admin' | 'user'
          department_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          name: string
          role?: 'admin' | 'user'
          department_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          name?: string
          role?: 'admin' | 'user'
          department_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}