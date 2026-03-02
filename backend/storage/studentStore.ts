import { StudentProfile } from '../types';

class StudentStore {
  private readonly memory = new Map<string, StudentProfile>();

  async connect(): Promise<void> {
    return;
  }

  async save(profile: StudentProfile): Promise<void> {
    this.memory.set(profile.id, profile);
  }

  async get(id: string): Promise<StudentProfile | null> {
    return this.memory.get(id) ?? null;
  }

  async latest(): Promise<StudentProfile | null> {
    const latest = [...this.memory.values()].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];
    return latest ?? null;
  }
}

export const studentStore = new StudentStore();
