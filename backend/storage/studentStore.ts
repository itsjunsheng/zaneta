import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StudentProfile } from '../types';

type StudentProfileRow = {
  id: string;
  user_id: string;
  student_name: string;
  uploaded_at: string;
  events: StudentProfile['events'];
  insights: StudentProfile['insights'];
  latest_goal: StudentProfile['latestGoal'] | null;
  recommendations: StudentProfile['recommendations'];
};

class StudentStore {
  private client: SupabaseClient | null = null;

  async connect(): Promise<void> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }

    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  private getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('StudentStore is not connected.');
    }
    return this.client;
  }

  private toRow(profile: StudentProfile): StudentProfileRow {
    return {
      id: profile.id,
      user_id: profile.userId,
      student_name: profile.studentName,
      uploaded_at: profile.uploadedAt,
      events: profile.events,
      insights: profile.insights,
      latest_goal: profile.latestGoal ?? null,
      recommendations: profile.recommendations,
    };
  }

  private fromRow(row: StudentProfileRow): StudentProfile {
    return {
      id: row.id,
      userId: row.user_id,
      studentName: row.student_name,
      uploadedAt: row.uploaded_at,
      events: row.events ?? [],
      insights: row.insights,
      latestGoal: row.latest_goal ?? undefined,
      recommendations: row.recommendations ?? [],
    };
  }

  async save(profile: StudentProfile): Promise<void> {
    const { error } = await this.getClient()
      .from('student_profiles')
      .upsert(this.toRow(profile), { onConflict: 'user_id' });

    if (error) {
      throw new Error(`Failed to save student profile: ${error.message}`);
    }
  }

  async getByUserId(userId: string): Promise<StudentProfile | null> {
    const { data, error } = await this.getClient()
      .from('student_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle<StudentProfileRow>();

    if (error) {
      throw new Error(`Failed to fetch student profile: ${error.message}`);
    }

    return data ? this.fromRow(data) : null;
  }

  async get(id: string): Promise<StudentProfile | null> {
    const { data, error } = await this.getClient()
      .from('student_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle<StudentProfileRow>();

    if (error) {
      throw new Error(`Failed to fetch student profile by id: ${error.message}`);
    }

    return data ? this.fromRow(data) : null;
  }
}

export const studentStore = new StudentStore();
