// UserStateManager.ts
interface UserProfile {
  id: any;
  name: string;
  email: string[];
  createdAt: bigint;
  updatedAt: any[];
}

interface PersistentUserState {
  userId: string;
  userName: string;
  principal: string;
  lastSeen: number;
  profileData?: UserProfile;
}

class UserStateManager {
  private static instance: UserStateManager;
  private readonly STORAGE_KEY = 'eduverse_user_state';
  private readonly SESSION_KEY = 'eduverse_session_active';

  static getInstance(): UserStateManager {
    if (!UserStateManager.instance) {
      UserStateManager.instance = new UserStateManager();
    }
    return UserStateManager.instance;
  }

  // Save user state to localStorage
  saveUserState(state: PersistentUserState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      sessionStorage.setItem(this.SESSION_KEY, 'true');
      console.log('💾 User state saved:', state.userId.slice(0, 20) + '...');
    } catch (error) {
      console.error('❌ Failed to save user state:', error);
    }
  }

  // Load user state from localStorage
  loadUserState(): PersistentUserState | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return null;

      const state: PersistentUserState = JSON.parse(saved);

      // Check if session is still valid (within 24 hours)
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (now - state.lastSeen > maxAge) {
        console.log('⏰ User state expired, clearing...');
        this.clearUserState();
        return null;
      }

      console.log('♻️ User state loaded:', state.userId.slice(0, 20) + '...');
      return state;
    } catch (error) {
      console.error('❌ Failed to load user state:', error);
      return null;
    }
  }

  // Update last seen timestamp
  updateLastSeen(userId: string): void {
    const existing = this.loadUserState();
    if (existing && existing.userId === userId) {
      existing.lastSeen = Date.now();
      this.saveUserState(existing);
    }
  }

  // Clear user state
  clearUserState(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.SESSION_KEY);
    console.log('🗑️ User state cleared');
  }

  // Check if session is active
  isSessionActive(): boolean {
    return sessionStorage.getItem(this.SESSION_KEY) === 'true';
  }
}

export { UserStateManager, type PersistentUserState, type UserProfile };
