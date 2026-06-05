export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string | null
          date: string | null
          description: string | null
          employee_id: string | null
          id: string
          level: string
          title: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          level: string
          title: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          level?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          opening_text: string | null
          schema: Json
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          opening_text?: string | null
          schema: Json
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          opening_text?: string | null
          schema?: Json
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      career_interests: {
        Row: {
          created_at: string | null
          department: string
          employee_id: string | null
          id: string
          position: string
        }
        Insert: {
          created_at?: string | null
          department: string
          employee_id?: string | null
          id?: string
          position: string
        }
        Update: {
          created_at?: string | null
          department?: string
          employee_id?: string | null
          id?: string
          position?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_interests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_experiences: {
        Row: {
          created_at: string | null
          employee_id: string | null
          event: string
          id: string
          role: string
          year: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          event: string
          id?: string
          role: string
          year?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          event?: string
          id?: string
          role?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committee_experiences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      educations: {
        Row: {
          created_at: string | null
          employee_id: string | null
          field: string | null
          id: string
          institution: string
          level: string
          year: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          field?: string | null
          id?: string
          institution: string
          level: string
          year?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          field?: string | null
          id?: string
          institution?: string
          level?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "educations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          address: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          name: string
          phone: string
          relationship: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          name: string
          phone: string
          relationship: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          name?: string
          phone?: string
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_assessments: {
        Row: {
          answers: Json | null
          created_at: string | null
          deadline: string | null
          employee_id: string | null
          feedback: string | null
          id: string
          score: number | null
          status: string
          submitted_at: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          deadline?: string | null
          employee_id?: string | null
          feedback?: string | null
          id?: string
          score?: number | null
          status?: string
          submitted_at?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          deadline?: string | null
          employee_id?: string | null
          feedback?: string | null
          id?: string
          score?: number | null
          status?: string
          submitted_at?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_assessments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_assessments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "assessment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          category: string
          created_at: string | null
          date: string | null
          employee_id: string | null
          file_url: string | null
          files: Json | null
          id: string
          size: string | null
          sub_category: string | null
          title: string
          type: string
        }
        Insert: {
          category: string
          created_at?: string | null
          date?: string | null
          employee_id?: string | null
          file_url?: string | null
          files?: Json | null
          id?: string
          size?: string | null
          sub_category?: string | null
          title: string
          type: string
        }
        Update: {
          category?: string
          created_at?: string | null
          date?: string | null
          employee_id?: string | null
          file_url?: string | null
          files?: Json | null
          id?: string
          size?: string | null
          sub_category?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          attendance_late: number | null
          attendance_present: number | null
          bank: string | null
          birth_date: string | null
          blood_type: string | null
          city: string | null
          country: string | null
          created_at: string | null
          dept: string | null
          email: string
          employee_code: string | null
          gender: string | null
          id: string
          join_date: string | null
          ktp_address: string | null
          leave_total: number | null
          leave_used: number | null
          level: string | null
          manager: string | null
          marital_status: string | null
          name: string
          nationality: string | null
          nik: string | null
          phone: string | null
          photo_url: string | null
          postal_code: string | null
          province: string | null
          religion: string | null
          role: string | null
          status: string | null
          tenure: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          attendance_late?: number | null
          attendance_present?: number | null
          bank?: string | null
          birth_date?: string | null
          blood_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          dept?: string | null
          email: string
          employee_code?: string | null
          gender?: string | null
          id: string
          join_date?: string | null
          ktp_address?: string | null
          leave_total?: number | null
          leave_used?: number | null
          level?: string | null
          manager?: string | null
          marital_status?: string | null
          name: string
          nationality?: string | null
          nik?: string | null
          phone?: string | null
          photo_url?: string | null
          postal_code?: string | null
          province?: string | null
          religion?: string | null
          role?: string | null
          status?: string | null
          tenure?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          attendance_late?: number | null
          attendance_present?: number | null
          bank?: string | null
          birth_date?: string | null
          blood_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          dept?: string | null
          email?: string
          employee_code?: string | null
          gender?: string | null
          id?: string
          join_date?: string | null
          ktp_address?: string | null
          leave_total?: number | null
          leave_used?: number | null
          level?: string | null
          manager?: string | null
          marital_status?: string | null
          name?: string
          nationality?: string | null
          nik?: string | null
          phone?: string | null
          photo_url?: string | null
          postal_code?: string | null
          province?: string | null
          religion?: string | null
          role?: string | null
          status?: string | null
          tenure?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      family_members: {
        Row: {
          birth_date: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          name: string
          occupation: string | null
          phone: string | null
          relationship: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          name: string
          occupation?: string | null
          phone?: string | null
          relationship: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          name?: string
          occupation?: string | null
          phone?: string | null
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          name: string
          proficiency: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          name: string
          proficiency: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          name?: string
          proficiency?: string
        }
        Relationships: [
          {
            foreignKeyName: "languages_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      non_formal_educations: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          institution: string
          name: string
          year: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          institution: string
          name: string
          year?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          institution?: string
          name?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "non_formal_educations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      org_experiences: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          organization: string
          period: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          organization: string
          period?: string | null
          role: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          organization?: string
          period?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_experiences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_histories: {
        Row: {
          created_at: string | null
          date: string
          employee_id: string | null
          from_position: string | null
          id: string
          to_position: string
          type: string
        }
        Insert: {
          created_at?: string | null
          date: string
          employee_id?: string | null
          from_position?: string | null
          id?: string
          to_position: string
          type: string
        }
        Update: {
          created_at?: string | null
          date?: string
          employee_id?: string | null
          from_position?: string | null
          id?: string
          to_position?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_histories_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          name: string
          proficiency: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          name: string
          proficiency: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          name?: string
          proficiency?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      social_activities: {
        Row: {
          activity: string
          created_at: string | null
          employee_id: string | null
          end_date: string | null
          id: string
          organization: string
          role: string
          start_date: string | null
        }
        Insert: {
          activity: string
          created_at?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          organization: string
          role: string
          start_date?: string | null
        }
        Update: {
          activity?: string
          created_at?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          organization?: string
          role?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_activities_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          created_at: string | null
          date: string | null
          employee_id: string | null
          id: string
          name: string
          provider: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          employee_id?: string | null
          id?: string
          name: string
          provider: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          employee_id?: string | null
          id?: string
          name?: string
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      work_experiences: {
        Row: {
          company: string
          created_at: string | null
          description: string | null
          employee_id: string | null
          end_date: string | null
          id: string
          position: string
          start_date: string | null
        }
        Insert: {
          company: string
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          position: string
          start_date?: string | null
        }
        Update: {
          company?: string
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          position?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_experiences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
