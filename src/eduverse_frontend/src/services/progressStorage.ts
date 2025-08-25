// services/progressStorage.ts
// FIXED: User-specific progress storage service

export interface LearningProgress {
  courseId: number;
  moduleId: number;
  readingProgress: number; // 0-100
  timeSpent: number; // in seconds
  isCompleted: boolean;
  completedAt?: number;
  lastAccessedAt: number;
}

export interface CourseProgress {
  courseId: number;
  courseName: string;
  currentModuleIndex: number;
  totalModules: number;
  overallProgress: number; // 0-100
  moduleProgresses: { [moduleId: number]: LearningProgress };
  bookmarks: number[];
  notes: { [moduleId: number]: string };
  lastAccessedAt: number;
  isCompleted: boolean;
  certificateId?: number;
}

// FIXED: Now truly user-specific
export interface UserProgressData {
  userId: string;
  courses: { [courseId: number]: CourseProgress };
  lastSyncAt: number;
  version: string;
}

// FIXED: Global storage format for multiple users
export interface GlobalProgressData {
  users: { [userId: string]: UserProgressData };
  version: string;
  lastUpdated: number;
}

export class ProgressStorageService {
  // FIXED: User-specific storage keys
  private readonly BASE_STORAGE_KEY = 'eduverse_learning_progress';
  private readonly BASE_SYNC_KEY = 'eduverse_sync_queue';
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
  private readonly STORAGE_VERSION = '3.0'; // Bumped version for user-specific storage

  constructor(private userId: string) {
    if (!this.userId) {
      throw new Error('UserId is required for ProgressStorageService');
    }
    this.migrateFromOldStorage();
  }

  // FIXED: User-specific storage key
  private getUserStorageKey(): string {
    return `${this.BASE_STORAGE_KEY}_${this.userId}`;
  }

  // FIXED: User-specific sync key
  private getUserSyncKey(): string {
    return `${this.BASE_SYNC_KEY}_${this.userId}`;
  }

  /**
   * FIXED: Migration now preserves user-specific data
   */
  private migrateFromOldStorage(): void {
    try {
      const oldGlobalKey = 'eduverse_learning_progress';
      const userSpecificKey = this.getUserStorageKey();

      // Don't migrate if user-specific storage already exists
      if (localStorage.getItem(userSpecificKey)) {
        console.log(`✅ User-specific storage already exists for: ${this.userId.slice(0, 20)}...`);
        return;
      }

      // Check for old global storage
      const oldGlobalData = localStorage.getItem(oldGlobalKey);
      if (oldGlobalData) {
        try {
          const parsed = JSON.parse(oldGlobalData);

          // If old data belongs to this user, migrate it
          if (parsed.userId === this.userId) {
            console.log(`📦 Migrating old data for user: ${this.userId.slice(0, 20)}...`);

            const userSpecificData: UserProgressData = {
              userId: this.userId,
              courses: parsed.courses || {},
              lastSyncAt: parsed.lastSyncAt || Date.now(),
              version: this.STORAGE_VERSION,
            };

            localStorage.setItem(userSpecificKey, JSON.stringify(userSpecificData));
            console.log('✅ Migration completed successfully');
          } else {
            console.log(
              `ℹ️  Old data belongs to different user, creating fresh storage for: ${this.userId.slice(0, 20)}...`
            );
          }
        } catch (error) {
          console.warn('⚠️  Error parsing old storage data:', error);
        }
      }

      // Create fresh storage for this user if no data exists
      if (!localStorage.getItem(userSpecificKey)) {
        this.createFreshUserStorage();
      }
    } catch (error) {
      console.warn('⚠️  Error during storage migration:', error);
      this.createFreshUserStorage();
    }
  }

  /**
   * FIXED: Create fresh user-specific storage
   */
  private createFreshUserStorage(): void {
    const freshData: UserProgressData = {
      userId: this.userId,
      courses: {},
      lastSyncAt: Date.now(),
      version: this.STORAGE_VERSION,
    };

    localStorage.setItem(this.getUserStorageKey(), JSON.stringify(freshData));
    console.log(`✅ Created fresh storage for user: ${this.userId.slice(0, 20)}...`);
  }

  /**
   * FIXED: Get progress data for THIS SPECIFIC USER
   */
  getAllProgress(): UserProgressData {
    try {
      const userStorageKey = this.getUserStorageKey();
      const stored = localStorage.getItem(userStorageKey);

      const defaultData: UserProgressData = {
        userId: this.userId,
        courses: {},
        lastSyncAt: 0,
        version: this.STORAGE_VERSION,
      };

      if (!stored) {
        console.log(
          `ℹ️  No stored data found for user: ${this.userId.slice(0, 20)}..., creating default`
        );
        this.saveAllProgress(defaultData);
        return defaultData;
      }

      const parsed = JSON.parse(stored);

      // Validate that this data belongs to the current user
      if (parsed.userId !== this.userId) {
        console.warn(
          `⚠️  Storage data user mismatch! Expected: ${this.userId.slice(0, 20)}..., Found: ${parsed.userId?.slice(0, 20) || 'unknown'}...`
        );
        this.createFreshUserStorage();
        return defaultData;
      }

      // Ensure version is set
      if (!parsed.version) {
        parsed.version = this.STORAGE_VERSION;
      }

      console.log(
        `📊 Loaded progress for user: ${this.userId.slice(0, 20)}..., ${Object.keys(parsed.courses || {}).length} courses`
      );
      return { ...defaultData, ...parsed };
    } catch (error) {
      console.error(
        `❌ Error getting progress data for user ${this.userId.slice(0, 20)}...:`,
        error
      );
      this.handleStorageError('get');
      return {
        userId: this.userId,
        courses: {},
        lastSyncAt: 0,
        version: this.STORAGE_VERSION,
      };
    }
  }

  /**
   * FIXED: Save progress data for THIS SPECIFIC USER
   */
  saveAllProgress(data: UserProgressData): boolean {
    try {
      // CRITICAL: Ensure data belongs to current user
      if (data.userId !== this.userId) {
        console.error(
          `❌ Attempted to save data for different user! Current: ${this.userId.slice(0, 20)}..., Data: ${data.userId?.slice(0, 20) || 'unknown'}...`
        );
        return false;
      }

      // Validate data structure
      if (!this.validateProgressData(data)) {
        console.error(
          `❌ Invalid progress data for user ${this.userId.slice(0, 20)}..., not saving`
        );
        return false;
      }

      data.version = this.STORAGE_VERSION;
      data.lastSyncAt = Date.now();

      const serialized = JSON.stringify(data);
      const userStorageKey = this.getUserStorageKey();

      // Check storage size
      if (serialized.length > this.MAX_STORAGE_SIZE) {
        console.warn(
          `⚠️  Progress data exceeds storage limit for user ${this.userId.slice(0, 20)}..., cleaning up...`
        );
        this.cleanupOldData(data);
        const cleanedSerialized = JSON.stringify(data);

        if (cleanedSerialized.length > this.MAX_STORAGE_SIZE) {
          console.error(
            `❌ Data still too large after cleanup for user ${this.userId.slice(0, 20)}...`
          );
          return false;
        }

        localStorage.setItem(userStorageKey, cleanedSerialized);
      } else {
        localStorage.setItem(userStorageKey, serialized);
      }

      console.log(
        `✅ Progress saved for user: ${this.userId.slice(0, 20)}..., ${Object.keys(data.courses).length} courses`
      );
      return true;
    } catch (error) {
      console.error(
        `❌ Error saving progress data for user ${this.userId.slice(0, 20)}...:`,
        error
      );
      this.handleStorageError('save');
      return false;
    }
  }

  /**
   * FIXED: Validate progress data with user verification
   */
  private validateProgressData(data: UserProgressData): boolean {
    try {
      if (!data || typeof data !== 'object') return false;
      if (data.userId !== this.userId) {
        console.error(
          `❌ User ID mismatch in validation! Expected: ${this.userId.slice(0, 20)}..., Got: ${data.userId?.slice(0, 20) || 'unknown'}...`
        );
        return false;
      }
      if (!data.courses || typeof data.courses !== 'object') return false;
      if (typeof data.lastSyncAt !== 'number') return false;

      // Validate each course
      for (const [courseId, courseProgress] of Object.entries(data.courses)) {
        if (!this.validateCourseProgress(courseProgress)) {
          console.warn(
            `⚠️  Invalid course progress for user ${this.userId.slice(0, 20)}... course ${courseId}`
          );
          delete data.courses[parseInt(courseId)];
        }
      }

      return true;
    } catch (error) {
      console.error(
        `❌ Error validating progress data for user ${this.userId.slice(0, 20)}...:`,
        error
      );
      return false;
    }
  }

  /**
   * Handle storage errors with user-specific error tracking
   */
  private handleStorageError(operation: 'get' | 'save'): void {
    try {
      const errorKey = `eduverse_storage_error_${operation}_${this.userId}`;
      const errorCount = parseInt(localStorage.getItem(errorKey) || '0') + 1;

      if (errorCount > 5) {
        console.warn(
          `⚠️  Storage ${operation} errors exceeded limit for user ${this.userId.slice(0, 20)}..., clearing user storage`
        );
        this.clearAllProgress();
        localStorage.removeItem(errorKey);
      } else {
        localStorage.setItem(errorKey, errorCount.toString());
      }
    } catch (error) {
      console.error(
        `❌ Error handling storage error for user ${this.userId.slice(0, 20)}...:`,
        error
      );
    }
  }

  /**
   * FIXED: User-specific sync queue
   */
  private addToSyncQueue(action: {
    type: string;
    courseId: number;
    moduleId?: number;
    certificateId?: number;
    timestamp: number;
  }): void {
    try {
      const queue = this.getSyncQueue();
      const actionWithUser = { ...action, userId: this.userId };
      queue.push(actionWithUser);

      // Limit queue size
      if (queue.length > 50) {
        queue.splice(0, queue.length - 50);
      }

      localStorage.setItem(this.getUserSyncKey(), JSON.stringify(queue));
      console.log(`📋 Added to sync queue for user ${this.userId.slice(0, 20)}...: ${action.type}`);
    } catch (error) {
      console.error(
        `❌ Error adding to sync queue for user ${this.userId.slice(0, 20)}...:`,
        error
      );
    }
  }

  /**
   * FIXED: Get user-specific sync queue
   */
  getSyncQueue(): Array<any> {
    try {
      const stored = localStorage.getItem(this.getUserSyncKey());
      const queue = stored ? JSON.parse(stored) : [];

      // Filter out actions that don't belong to this user (safety check)
      return queue.filter((action: any) => !action.userId || action.userId === this.userId);
    } catch (error) {
      console.error(`❌ Error getting sync queue for user ${this.userId.slice(0, 20)}...:`, error);
      return [];
    }
  }

  /**
   * FIXED: Clear user-specific sync queue
   */
  clearSyncQueue(): void {
    try {
      localStorage.removeItem(this.getUserSyncKey());
      console.log(`🗑️  Cleared sync queue for user: ${this.userId.slice(0, 20)}...`);
    } catch (error) {
      console.error(`❌ Error clearing sync queue for user ${this.userId.slice(0, 20)}...:`, error);
    }
  }

  /**
   * FIXED: Update reading progress with user verification
   */
  updateReadingProgress(
    courseId: number,
    moduleId: number,
    progress: number,
    courseName?: string
  ): boolean {
    try {
      const courseProgress =
        this.getCourseProgress(courseId) || this.createEmptyCourseProgress(courseId, courseName);

      if (!courseProgress.moduleProgresses[moduleId]) {
        courseProgress.moduleProgresses[moduleId] = {
          courseId,
          moduleId,
          readingProgress: 0,
          timeSpent: 0,
          isCompleted: false,
          lastAccessedAt: Date.now(),
        };
      }

      // Only update if progress increased
      const currentProgress = courseProgress.moduleProgresses[moduleId].readingProgress;
      const newProgress = Math.max(currentProgress, Math.max(0, Math.min(100, progress)));

      courseProgress.moduleProgresses[moduleId].readingProgress = newProgress;
      courseProgress.moduleProgresses[moduleId].lastAccessedAt = Date.now();
      courseProgress.lastAccessedAt = Date.now();

      // Update overall progress
      this.recalculateOverallProgress(courseProgress);

      const success = this.saveCourseProgress(courseProgress);

      if (success) {
        console.log(
          `📖 Reading progress updated for user ${this.userId.slice(0, 20)}...: Course ${courseId}, Module ${moduleId}, Progress: ${newProgress}%`
        );
      }

      return success;
    } catch (error) {
      console.error(
        `❌ Error updating reading progress for user ${this.userId.slice(0, 20)}...:`,
        error
      );
      return false;
    }
  }

  /**
   * FIXED: Complete module with user verification
   */
  completeModule(courseId: number, moduleId: number, courseName?: string): boolean {
    try {
      const courseProgress =
        this.getCourseProgress(courseId) || this.createEmptyCourseProgress(courseId, courseName);

      if (!courseProgress.moduleProgresses[moduleId]) {
        courseProgress.moduleProgresses[moduleId] = {
          courseId,
          moduleId,
          readingProgress: 100,
          timeSpent: 0,
          isCompleted: false,
          lastAccessedAt: Date.now(),
        };
      }

      const moduleProgress = courseProgress.moduleProgresses[moduleId];
      if (!moduleProgress.isCompleted) {
        moduleProgress.isCompleted = true;
        moduleProgress.completedAt = Date.now();
        moduleProgress.readingProgress = 100;
        moduleProgress.lastAccessedAt = Date.now();

        // Update overall progress
        this.recalculateOverallProgress(courseProgress);

        // Add to sync queue with user info
        this.addToSyncQueue({
          type: 'module_completed',
          courseId,
          moduleId,
          timestamp: Date.now(),
        });

        console.log(
          `✅ Module completed by user ${this.userId.slice(0, 20)}...: Course ${courseId}, Module ${moduleId}`
        );
      }

      courseProgress.lastAccessedAt = Date.now();
      return this.saveCourseProgress(courseProgress);
    } catch (error) {
      console.error(`❌ Error completing module for user ${this.userId.slice(0, 20)}...:`, error);
      return false;
    }
  }

  /**
   * FIXED: Clear all progress for THIS USER only
   */
  clearAllProgress(): boolean {
    try {
      const userStorageKey = this.getUserStorageKey();
      const userSyncKey = this.getUserSyncKey();

      localStorage.removeItem(userStorageKey);
      localStorage.removeItem(userSyncKey);

      // Clear user-specific error counters
      const errorKeys = [
        `eduverse_storage_error_get_${this.userId}`,
        `eduverse_storage_error_save_${this.userId}`,
      ];
      errorKeys.forEach((key) => localStorage.removeItem(key));

      console.log(`🗑️  All progress data cleared for user: ${this.userId.slice(0, 20)}...`);
      return true;
    } catch (error) {
      console.error(`❌ Error clearing progress for user ${this.userId.slice(0, 20)}...:`, error);
      return false;
    }
  }

  /**
   * FIXED: Export progress for THIS USER
   */
  exportProgress(): string {
    const allData = this.getAllProgress();
    return JSON.stringify(
      {
        ...allData,
        exportedAt: Date.now(),
        exportedBy: this.userId,
      },
      null,
      2
    );
  }

  /**
   * FIXED: Import progress with user verification
   */
  importProgress(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      // Verify that imported data belongs to current user
      if (data.userId && data.userId !== this.userId) {
        throw new Error(
          `Cannot import data from different user. Expected: ${this.userId.slice(0, 20)}..., Found: ${data.userId.slice(0, 20)}...`
        );
      }

      // Ensure user ID is set
      data.userId = this.userId;

      // Validate data structure
      if (!this.validateProgressData(data)) {
        throw new Error('Invalid progress data format');
      }

      console.log(`📥 Importing progress data for user: ${this.userId.slice(0, 20)}...`);
      return this.saveAllProgress(data);
    } catch (error) {
      console.error(`❌ Error importing progress for user ${this.userId.slice(0, 20)}...:`, error);
      return false;
    }
  }

  /**
   * FIXED: Debug method with user context
   */
  debugLogState(courseId?: number): void {
    console.log(`🐛 DEBUG STATE for user: ${this.userId.slice(0, 20)}...${this.userId.slice(-8)}`);

    if (courseId) {
      const courseProgress = this.getCourseProgress(courseId);
      console.log(`Course ${courseId} progress:`, courseProgress);
      console.log(`Course ${courseId} statistics:`, this.getCourseStatistics(courseId));
    } else {
      const allData = this.getAllProgress();
      console.log('All progress data:', allData);
      console.log('Learning statistics:', this.getLearningStatistics());
      console.log('Storage info:', this.getStorageInfo());
    }

    console.log('Storage keys used:', {
      progress: this.getUserStorageKey(),
      sync: this.getUserSyncKey(),
    });
  }

  // ... (other methods remain the same but should include user verification where appropriate)

  private validateCourseProgress(courseProgress: any): boolean {
    try {
      if (!courseProgress || typeof courseProgress !== 'object') return false;
      if (typeof courseProgress.courseId !== 'number') return false;
      if (typeof courseProgress.courseName !== 'string') return false;
      if (typeof courseProgress.currentModuleIndex !== 'number') return false;
      if (typeof courseProgress.overallProgress !== 'number') return false;
      if (!Array.isArray(courseProgress.bookmarks)) return false;
      if (!courseProgress.moduleProgresses || typeof courseProgress.moduleProgresses !== 'object')
        return false;
      if (!courseProgress.notes || typeof courseProgress.notes !== 'object') return false;
      return true;
    } catch (error) {
      return false;
    }
  }

  getCourseProgress(courseId: number): CourseProgress | null {
    const allData = this.getAllProgress();
    return allData.courses[courseId] || null;
  }

  saveCourseProgress(courseProgress: CourseProgress): boolean {
    try {
      if (!this.validateCourseProgress(courseProgress)) {
        console.error(`❌ Invalid course progress data for user ${this.userId.slice(0, 20)}...`);
        return false;
      }

      const allData = this.getAllProgress();
      courseProgress.lastAccessedAt = Date.now();
      allData.courses[courseProgress.courseId] = courseProgress;
      allData.lastSyncAt = Date.now();

      return this.saveAllProgress(allData);
    } catch (error) {
      console.error(
        `❌ Error saving course progress for user ${this.userId.slice(0, 20)}...:`,
        error
      );
      return false;
    }
  }

  private createEmptyCourseProgress(courseId: number, courseName?: string): CourseProgress {
    const courseProgress: CourseProgress = {
      courseId,
      courseName: courseName || `Course ${courseId}`,
      currentModuleIndex: 0,
      totalModules: 0,
      overallProgress: 0,
      moduleProgresses: {},
      bookmarks: [],
      notes: {},
      lastAccessedAt: Date.now(),
      isCompleted: false,
    };

    console.log(
      `📝 Created empty course progress for user ${this.userId.slice(0, 20)}..., Course ${courseId}`
    );
    return courseProgress;
  }

  private recalculateOverallProgress(courseProgress: CourseProgress): void {
    const modules = Object.values(courseProgress.moduleProgresses);
    if (modules.length === 0) {
      courseProgress.overallProgress = 0;
      return;
    }

    const completedModules = modules.filter((m) => m.isCompleted).length;
    const readingProgress =
      modules.reduce((sum, module) => sum + module.readingProgress, 0) / modules.length;

    // Calculate progress based on both completion and reading progress
    const completionProgress = (completedModules / modules.length) * 100;
    const averageReadingProgress = readingProgress;

    // Weighted average: 70% completion, 30% reading progress
    courseProgress.overallProgress = Math.round(
      completionProgress * 0.7 + averageReadingProgress * 0.3
    );

    // Update total modules if needed
    if (courseProgress.totalModules < modules.length) {
      courseProgress.totalModules = modules.length;
    }

    console.log(
      `📊 Progress recalculated for user ${this.userId.slice(0, 20)}...: Course ${courseProgress.courseId}, Overall: ${courseProgress.overallProgress}%`
    );
  }

  private cleanupOldData(data: UserProgressData): void {
    console.log(`🧹 Cleaning up old data for user: ${this.userId.slice(0, 20)}...`);

    const courses = Object.values(data.courses);
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let cleanedCount = 0;

    // Remove courses not accessed in the last month and not completed
    for (const course of courses) {
      if (!course.isCompleted && course.lastAccessedAt < oneMonthAgo) {
        delete data.courses[course.courseId];
        cleanedCount++;
      }
    }

    // Limit notes to 100 characters each
    for (const course of Object.values(data.courses)) {
      for (const [moduleId, note] of Object.entries(course.notes)) {
        if (note.length > 100) {
          course.notes[parseInt(moduleId)] = note.substring(0, 100) + '...';
        }
      }
    }

    console.log(
      `✅ Cleanup completed for user ${this.userId.slice(0, 20)}...: removed ${cleanedCount} old courses`
    );
  }

  addTimeSpent(courseId: number, moduleId: number, seconds: number, courseName?: string): boolean {
    try {
      if (seconds <= 0) return true; // No need to save zero time

      const courseProgress =
        this.getCourseProgress(courseId) || this.createEmptyCourseProgress(courseId, courseName);

      if (!courseProgress.moduleProgresses[moduleId]) {
        courseProgress.moduleProgresses[moduleId] = {
          courseId,
          moduleId,
          readingProgress: 0,
          timeSpent: 0,
          isCompleted: false,
          lastAccessedAt: Date.now(),
        };
      }

      courseProgress.moduleProgresses[moduleId].timeSpent += seconds;
      courseProgress.moduleProgresses[moduleId].lastAccessedAt = Date.now();
      courseProgress.lastAccessedAt = Date.now();

      const success = this.saveCourseProgress(courseProgress);

      if (success) {
        console.log(
          `⏱️  Time spent updated for user ${this.userId.slice(0, 20)}...: Course ${courseId}, Module ${moduleId}, Added: ${seconds}s`
        );
      }

      return success;
    } catch (error) {
      console.error(`❌ Error adding time spent for user ${this.userId.slice(0, 20)}...:`, error);
      return false;
    }
  }

  setCurrentModule(courseId: number, moduleIndex: number, courseName?: string): boolean {
    try {
      const courseProgress =
        this.getCourseProgress(courseId) || this.createEmptyCourseProgress(courseId, courseName);

      // Only update if moving forward
      const newIndex = Math.max(courseProgress.currentModuleIndex, Math.max(0, moduleIndex));
      courseProgress.currentModuleIndex = newIndex;
      courseProgress.lastAccessedAt = Date.now();

      const success = this.saveCourseProgress(courseProgress);

      if (success) {
        console.log(
          `📍 Current module updated for user ${this.userId.slice(0, 20)}...: Course ${courseId}, Module Index: ${newIndex}`
        );
      }

      return success;
    } catch (error) {
      console.error(
        `❌ Error setting current module for user ${this.userId.slice(0, 20)}...:`,
        error
      );
      return false;
    }
  }

  toggleBookmark(courseId: number, moduleId: number, courseName?: string): boolean {
    try {
      const courseProgress =
        this.getCourseProgress(courseId) || this.createEmptyCourseProgress(courseId, courseName);
      const bookmarkIndex = courseProgress.bookmarks.indexOf(moduleId);

      if (bookmarkIndex > -1) {
        courseProgress.bookmarks.splice(bookmarkIndex, 1);
        console.log(
          `🔖 Bookmark removed by user ${this.userId.slice(0, 20)}...: Course ${courseId}, Module ${moduleId}`
        );
      } else {
        courseProgress.bookmarks.push(moduleId);
        console.log(
          `🔖 Bookmark added by user ${this.userId.slice(0, 20)}...: Course ${courseId}, Module ${moduleId}`
        );
      }

      courseProgress.lastAccessedAt = Date.now();
      return this.saveCourseProgress(courseProgress);
    } catch (error) {
      console.error(`❌ Error toggling bookmark for user ${this.userId.slice(0, 20)}...:`, error);
      return false;
    }
  }

  saveNote(courseId: number, moduleId: number, note: string, courseName?: string): boolean {
    try {
      const courseProgress =
        this.getCourseProgress(courseId) || this.createEmptyCourseProgress(courseId, courseName);

      if (note.trim()) {
        courseProgress.notes[moduleId] = note.trim();
        console.log(
          `📝 Note saved by user ${this.userId.slice(0, 20)}...: Course ${courseId}, Module ${moduleId}`
        );
      } else {
        delete courseProgress.notes[moduleId];
        console.log(
          `🗑️  Note deleted by user ${this.userId.slice(0, 20)}...: Course ${courseId}, Module ${moduleId}`
        );
      }

      courseProgress.lastAccessedAt = Date.now();
      return this.saveCourseProgress(courseProgress);
    } catch (error) {
      console.error(`❌ Error saving note for user ${this.userId.slice(0, 20)}...:`, error);
      return false;
    }
  }

  completeCourse(courseId: number, certificateId?: number): boolean {
    try {
      const courseProgress = this.getCourseProgress(courseId);
      if (!courseProgress) {
        console.error(
          `❌ Cannot complete course ${courseId} for user ${this.userId.slice(0, 20)}...: no progress found`
        );
        return false;
      }

      courseProgress.isCompleted = true;
      courseProgress.overallProgress = 100;
      courseProgress.lastAccessedAt = Date.now();

      if (certificateId) {
        courseProgress.certificateId = certificateId;
      }

      // Add to sync queue
      this.addToSyncQueue({
        type: 'course_completed',
        courseId,
        certificateId,
        timestamp: Date.now(),
      });

      console.log(
        `🎓 Course completed by user ${this.userId.slice(0, 20)}...: Course ${courseId}${certificateId ? `, Certificate ${certificateId}` : ''}`
      );

      return this.saveCourseProgress(courseProgress);
    } catch (error) {
      console.error(`❌ Error completing course for user ${this.userId.slice(0, 20)}...:`, error);
      return false;
    }
  }

  getLearningStatistics(): {
    totalCourses: number;
    completedCourses: number;
    totalTimeSpent: number;
    averageProgress: number;
    totalBookmarks: number;
    totalNotes: number;
    recentActivity: Array<{
      courseId: number;
      courseName: string;
      lastAccessed: number;
      progress: number;
    }>;
  } {
    const allData = this.getAllProgress();
    const courses = Object.values(allData.courses);

    const totalTimeSpent = courses.reduce((total, course) => {
      return (
        total +
        Object.values(course.moduleProgresses).reduce(
          (courseTime, module) => courseTime + module.timeSpent,
          0
        )
      );
    }, 0);

    const totalBookmarks = courses.reduce((total, course) => total + course.bookmarks.length, 0);
    const totalNotes = courses.reduce(
      (total, course) => total + Object.keys(course.notes).length,
      0
    );
    const averageProgress =
      courses.length > 0
        ? courses.reduce((sum, course) => sum + course.overallProgress, 0) / courses.length
        : 0;

    const recentActivity = courses
      .map((course) => ({
        courseId: course.courseId,
        courseName: course.courseName,
        lastAccessed: course.lastAccessedAt,
        progress: course.overallProgress,
      }))
      .sort((a, b) => b.lastAccessed - a.lastAccessed)
      .slice(0, 5);

    console.log(`📊 Learning statistics for user ${this.userId.slice(0, 20)}...:`, {
      totalCourses: courses.length,
      completedCourses: courses.filter((c) => c.isCompleted).length,
      totalTimeSpent: Math.floor(totalTimeSpent / 60),
      averageProgress: Math.round(averageProgress),
    });

    return {
      totalCourses: courses.length,
      completedCourses: courses.filter((c) => c.isCompleted).length,
      totalTimeSpent,
      averageProgress,
      totalBookmarks,
      totalNotes,
      recentActivity,
    };
  }

  getCourseStatistics(courseId: number): {
    totalModules: number;
    completedModules: number;
    totalTimeSpent: number;
    averageReadingProgress: number;
    bookmarkCount: number;
    noteCount: number;
    lastAccessed: number;
    completionRate: number;
  } | null {
    const courseProgress = this.getCourseProgress(courseId);
    if (!courseProgress) return null;

    const modules = Object.values(courseProgress.moduleProgresses);
    const completedModules = modules.filter((m) => m.isCompleted).length;
    const totalTimeSpent = modules.reduce((total, module) => total + module.timeSpent, 0);
    const averageReadingProgress =
      modules.length > 0
        ? modules.reduce((sum, module) => sum + module.readingProgress, 0) / modules.length
        : 0;

    return {
      totalModules: courseProgress.totalModules,
      completedModules,
      totalTimeSpent,
      averageReadingProgress,
      bookmarkCount: courseProgress.bookmarks.length,
      noteCount: Object.keys(courseProgress.notes).length,
      lastAccessed: courseProgress.lastAccessedAt,
      completionRate: courseProgress.overallProgress,
    };
  }

  getStorageInfo(): {
    used: number;
    total: number;
    percentage: number;
    canStore: boolean;
    userId: string;
  } {
    try {
      const data = this.getAllProgress();
      const used = JSON.stringify(data).length;
      const total = this.MAX_STORAGE_SIZE;

      return {
        used,
        total,
        percentage: (used / total) * 100,
        canStore: used < total * 0.9, // 90% threshold
        userId: this.userId,
      };
    } catch (error) {
      return {
        used: 0,
        total: this.MAX_STORAGE_SIZE,
        percentage: 0,
        canStore: true,
        userId: this.userId,
      };
    }
  }
}

// FIXED: Updated hooks to ensure user-specific storage
export const useProgressStorage = (userId: string) => {
  if (!userId) {
    throw new Error('userId is required for useProgressStorage');
  }
  return new ProgressStorageService(userId);
};

export const useCourseProgress = (courseId: number, userId: string) => {
  if (!userId) {
    throw new Error('userId is required for useCourseProgress');
  }

  const storage = useProgressStorage(userId);

  const getCourseProgress = () => storage.getCourseProgress(courseId);
  const updateReadingProgress = (moduleId: number, progress: number, courseName?: string) =>
    storage.updateReadingProgress(courseId, moduleId, progress, courseName);
  const addTimeSpent = (moduleId: number, seconds: number, courseName?: string) =>
    storage.addTimeSpent(courseId, moduleId, seconds, courseName);
  const completeModule = (moduleId: number, courseName?: string) =>
    storage.completeModule(courseId, moduleId, courseName);
  const setCurrentModule = (moduleIndex: number, courseName?: string) =>
    storage.setCurrentModule(courseId, moduleIndex, courseName);
  const toggleBookmark = (moduleId: number, courseName?: string) =>
    storage.toggleBookmark(courseId, moduleId, courseName);
  const saveNote = (moduleId: number, note: string, courseName?: string) =>
    storage.saveNote(courseId, moduleId, note, courseName);
  const completeCourse = (certificateId?: number) =>
    storage.completeCourse(courseId, certificateId);
  const getStatistics = () => storage.getCourseStatistics(courseId);

  return {
    getCourseProgress,
    updateReadingProgress,
    addTimeSpent,
    completeModule,
    setCurrentModule,
    toggleBookmark,
    saveNote,
    completeCourse,
    getStatistics,
  };
};

// FIXED: Background sync service with user-specific handling
export class BackgroundSyncService {
  private static instances: Map<string, BackgroundSyncService> = new Map();
  private storage: ProgressStorageService;
  private syncInterval: number | null = null;

  constructor(
    private actor: any,
    private userId: string
  ) {
    if (!userId) {
      throw new Error('userId is required for BackgroundSyncService');
    }
    this.storage = new ProgressStorageService(userId);
  }

  static getInstance(actor: any, userId: string): BackgroundSyncService {
    if (!userId) {
      throw new Error('userId is required for BackgroundSyncService.getInstance');
    }

    if (!BackgroundSyncService.instances.has(userId)) {
      BackgroundSyncService.instances.set(userId, new BackgroundSyncService(actor, userId));
    }
    return BackgroundSyncService.instances.get(userId)!;
  }

  startSync(intervalMinutes: number = 5): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log(`🔄 Starting background sync for user: ${this.userId.slice(0, 20)}...`);

    this.syncInterval = window.setInterval(
      () => {
        this.syncWithBackend();
      },
      intervalMinutes * 60 * 1000
    );

    // Initial sync
    this.syncWithBackend();
  }

  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log(`⏹️  Stopped background sync for user: ${this.userId.slice(0, 20)}...`);
    }
  }

  async syncWithBackend(): Promise<boolean> {
    try {
      const queue = this.storage.getSyncQueue();
      if (queue.length === 0) return true;

      console.log(
        `🔄 Syncing ${queue.length} actions with backend for user: ${this.userId.slice(0, 20)}...`
      );

      // Process sync queue
      for (const action of queue) {
        await this.processAction(action);
      }

      // Clear queue after successful sync
      this.storage.clearSyncQueue();
      console.log(`✅ Sync completed successfully for user: ${this.userId.slice(0, 20)}...`);
      return true;
    } catch (error) {
      console.error(`❌ Sync failed for user ${this.userId.slice(0, 20)}...:`, error);
      return false;
    }
  }

  private async processAction(action: any): Promise<void> {
    // Verify action belongs to current user
    if (action.userId && action.userId !== this.userId) {
      console.warn(
        `⚠️  Skipping action from different user: ${action.userId?.slice(0, 20) || 'unknown'}...`
      );
      return;
    }

    switch (action.type) {
      case 'module_completed':
        console.log(`📝 Module completed sync for user ${this.userId.slice(0, 20)}...:`, action);
        break;
      case 'course_completed':
        console.log(`🎓 Course completed sync for user ${this.userId.slice(0, 20)}...:`, action);
        break;
      default:
        console.log(`❓ Unknown sync action for user ${this.userId.slice(0, 20)}...:`, action);
    }
  }

  // Clean up instance when user logs out
  static cleanupInstance(userId: string): void {
    const instance = BackgroundSyncService.instances.get(userId);
    if (instance) {
      instance.stopSync();
      BackgroundSyncService.instances.delete(userId);
      console.log(`🧹 Cleaned up BackgroundSyncService for user: ${userId.slice(0, 20)}...`);
    }
  }
}

// FIXED: Utility functions for multi-user storage management
export class StorageManager {
  private static readonly GLOBAL_STORAGE_KEY = 'eduverse_all_users';
  private static readonly MAX_USERS = 10; // Limit number of users stored locally

  /**
   * Get list of all user IDs that have local storage
   */
  static getAllUserIds(): string[] {
    try {
      const keys = Object.keys(localStorage);
      const userIds: string[] = [];

      keys.forEach((key) => {
        const match = key.match(/^eduverse_learning_progress_(.+)$/);
        if (match) {
          userIds.push(match[1]);
        }
      });

      console.log(
        `📋 Found ${userIds.length} users with local storage:`,
        userIds.map((id) => id.slice(0, 20) + '...')
      );
      return userIds;
    } catch (error) {
      console.error('❌ Error getting all user IDs:', error);
      return [];
    }
  }

  /**
   * Clean up storage for inactive users
   */
  static cleanupInactiveUsers(currentUserId: string): void {
    try {
      const allUserIds = this.getAllUserIds();

      if (allUserIds.length <= this.MAX_USERS) {
        return; // No cleanup needed
      }

      console.log(`🧹 Cleaning up inactive users (keeping max ${this.MAX_USERS})...`);

      // Get last access time for each user
      const userActivity: Array<{ userId: string; lastAccess: number }> = [];

      allUserIds.forEach((userId) => {
        try {
          const storage = new ProgressStorageService(userId);
          const data = storage.getAllProgress();
          userActivity.push({
            userId,
            lastAccess: data.lastSyncAt || 0,
          });
        } catch (error) {
          console.warn(`⚠️  Error getting activity for user ${userId.slice(0, 20)}...:`, error);
          userActivity.push({
            userId,
            lastAccess: 0,
          });
        }
      });

      // Sort by last access (most recent first)
      userActivity.sort((a, b) => b.lastAccess - a.lastAccess);

      // Keep current user + most active users
      const usersToKeep = new Set([currentUserId]);
      userActivity.slice(0, this.MAX_USERS - 1).forEach((user) => {
        usersToKeep.add(user.userId);
      });

      // Remove inactive users
      let removedCount = 0;
      allUserIds.forEach((userId) => {
        if (!usersToKeep.has(userId)) {
          try {
            const storage = new ProgressStorageService(userId);
            storage.clearAllProgress();
            removedCount++;
            console.log(`🗑️  Removed storage for inactive user: ${userId.slice(0, 20)}...`);
          } catch (error) {
            console.warn(`⚠️  Error removing storage for user ${userId.slice(0, 20)}...:`, error);
          }
        }
      });

      console.log(`✅ Cleanup completed: removed ${removedCount} inactive users`);
    } catch (error) {
      console.error('❌ Error during storage cleanup:', error);
    }
  }

  /**
   * Get storage usage summary for all users
   */
  static getStorageUsageSummary(): {
    totalUsers: number;
    totalSize: number;
    userSizes: Array<{ userId: string; size: number; lastAccess: number }>;
  } {
    const allUserIds = this.getAllUserIds();
    const userSizes: Array<{ userId: string; size: number; lastAccess: number }> = [];
    let totalSize = 0;

    allUserIds.forEach((userId) => {
      try {
        const storage = new ProgressStorageService(userId);
        const data = storage.getAllProgress();
        const size = JSON.stringify(data).length;

        userSizes.push({
          userId,
          size,
          lastAccess: data.lastSyncAt || 0,
        });

        totalSize += size;
      } catch (error) {
        console.warn(`⚠️  Error getting size for user ${userId.slice(0, 20)}...:`, error);
      }
    });

    return {
      totalUsers: allUserIds.length,
      totalSize,
      userSizes: userSizes.sort((a, b) => b.size - a.size),
    };
  }
}
