// services/progressStorage.ts
// Enhanced progress storage service with unified keys and better error handling

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

export interface ProgressSyncData {
  userId: string;
  courses: { [courseId: number]: CourseProgress };
  lastSyncAt: number;
  version: string; // For migration purposes
}

export class ProgressStorageService {
  // Unified storage keys - same as original LearningProgressManager
  private readonly STORAGE_KEY = 'eduverse_learning_progress';
  private readonly SYNC_KEY = 'eduverse_sync_queue';
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
  private readonly STORAGE_VERSION = '2.0';

  constructor(private userId?: string) {
    this.migrateFromOldStorage();
  }

  // ===== MIGRATION FROM OLD STORAGE =====

  /**
   * Migrate from old storage format to new unified format
   */
  private migrateFromOldStorage(): void {
    try {
      const oldStorageKey = 'eduverse_progress_v2';
      const oldData = localStorage.getItem(oldStorageKey);
      const currentData = localStorage.getItem(this.STORAGE_KEY);

      if (oldData && !currentData) {
        console.log('Migrating progress data to unified format...');

        // Parse old data
        const parsed = JSON.parse(oldData);

        // Convert to new format
        const newData: ProgressSyncData = {
          userId: this.userId || parsed.userId || 'anonymous',
          courses: parsed.courses || {},
          lastSyncAt: parsed.lastSyncAt || Date.now(),
          version: this.STORAGE_VERSION,
        };

        // Save in new format
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newData));

        // Remove old storage
        localStorage.removeItem(oldStorageKey);

        console.log('Migration completed successfully');
      }

      // Also check for very old format (LocalLearningState)
      const veryOldData = this.getAllProgress();
      if (veryOldData.courses && Object.keys(veryOldData.courses).length === 0) {
        this.migrateVeryOldFormat();
      }
    } catch (error) {
      console.warn('Error during storage migration:', error);
    }
  }

  /**
   * Migrate from very old LocalLearningState format
   */
  private migrateVeryOldFormat(): void {
    try {
      // Look for individual course progress stored with different keys
      const storageKeys = Object.keys(localStorage);
      const courseKeys = storageKeys.filter(
        (key) => key.startsWith('eduverse_course_') || key.startsWith('course_progress_')
      );

      if (courseKeys.length > 0) {
        console.log('Migrating very old progress format...');

        const allData = this.getAllProgress();

        courseKeys.forEach((key) => {
          try {
            const courseData = localStorage.getItem(key);
            if (courseData) {
              const parsed = JSON.parse(courseData);
              if (parsed.courseId) {
                // Convert old format to new CourseProgress format
                const courseProgress: CourseProgress = this.convertOldToNewFormat(parsed);
                allData.courses[courseProgress.courseId] = courseProgress;
              }
            }
          } catch (error) {
            console.warn(`Error migrating course data from ${key}:`, error);
          }
        });

        // Save migrated data
        this.saveAllProgress(allData);

        // Clean up old keys
        courseKeys.forEach((key) => {
          localStorage.removeItem(key);
        });

        console.log('Very old format migration completed');
      }
    } catch (error) {
      console.warn('Error during very old format migration:', error);
    }
  }

  /**
   * Convert old LocalLearningState format to new CourseProgress format
   */
  private convertOldToNewFormat(oldData: any): CourseProgress {
    return {
      courseId: oldData.courseId,
      courseName: oldData.courseName || `Course ${oldData.courseId}`,
      currentModuleIndex: oldData.currentModuleIndex || 0,
      totalModules: oldData.totalModules || 0,
      overallProgress: oldData.overallProgress || 0,
      moduleProgresses: oldData.readingProgress
        ? this.convertReadingProgressToModuleProgresses(oldData)
        : {},
      bookmarks: oldData.bookmarks || [],
      notes: oldData.notes || {},
      lastAccessedAt: oldData.lastAccessedAt || Date.now(),
      isCompleted: oldData.isCompleted || false,
      certificateId: oldData.certificateId,
    };
  }

  /**
   * Convert old reading progress format to new module progresses format
   */
  private convertReadingProgressToModuleProgresses(oldData: any): {
    [moduleId: number]: LearningProgress;
  } {
    const moduleProgresses: { [moduleId: number]: LearningProgress } = {};

    if (oldData.readingProgress) {
      Object.entries(oldData.readingProgress).forEach(([moduleId, progress]) => {
        const moduleIdNum = parseInt(moduleId);
        const timeSpent = oldData.timeSpent?.[moduleId] || 0;

        moduleProgresses[moduleIdNum] = {
          courseId: oldData.courseId,
          moduleId: moduleIdNum,
          readingProgress: Number(progress) || 0,
          timeSpent: Number(timeSpent) || 0,
          isCompleted: Number(progress) >= 100,
          lastAccessedAt: Date.now(),
        };
      });
    }

    return moduleProgresses;
  }

  // ===== CORE STORAGE METHODS =====

  /**
   * Get all progress data for the current user
   */
  getAllProgress(): ProgressSyncData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const defaultData: ProgressSyncData = {
        userId: this.userId || 'anonymous',
        courses: {},
        lastSyncAt: 0,
        version: this.STORAGE_VERSION,
      };

      if (!stored) return defaultData;

      const parsed = JSON.parse(stored);

      // Ensure version is set
      if (!parsed.version) {
        parsed.version = this.STORAGE_VERSION;
      }

      return { ...defaultData, ...parsed };
    } catch (error) {
      console.error('Error getting progress data:', error);
      this.handleStorageError('get');
      return {
        userId: this.userId || 'anonymous',
        courses: {},
        lastSyncAt: 0,
        version: this.STORAGE_VERSION,
      };
    }
  }

  /**
   * Save all progress data with validation
   */
  saveAllProgress(data: ProgressSyncData): boolean {
    try {
      // Validate data
      if (!this.validateProgressData(data)) {
        console.error('Invalid progress data, not saving');
        return false;
      }

      data.version = this.STORAGE_VERSION;
      data.lastSyncAt = Date.now();

      const serialized = JSON.stringify(data);

      // Check storage size
      if (serialized.length > this.MAX_STORAGE_SIZE) {
        console.warn('Progress data exceeds storage limit, cleaning up...');
        this.cleanupOldData(data);
        const cleanedSerialized = JSON.stringify(data);

        if (cleanedSerialized.length > this.MAX_STORAGE_SIZE) {
          console.error('Data still too large after cleanup');
          return false;
        }

        localStorage.setItem(this.STORAGE_KEY, cleanedSerialized);
      } else {
        localStorage.setItem(this.STORAGE_KEY, serialized);
      }

      return true;
    } catch (error) {
      console.error('Error saving progress data:', error);
      this.handleStorageError('save');
      return false;
    }
  }

  /**
   * Validate progress data structure
   */
  private validateProgressData(data: ProgressSyncData): boolean {
    try {
      if (!data || typeof data !== 'object') return false;
      if (!data.courses || typeof data.courses !== 'object') return false;
      if (typeof data.userId !== 'string') return false;
      if (typeof data.lastSyncAt !== 'number') return false;

      // Validate each course
      for (const [courseId, courseProgress] of Object.entries(data.courses)) {
        if (!this.validateCourseProgress(courseProgress)) {
          console.warn(`Invalid course progress for course ${courseId}`);
          delete data.courses[parseInt(courseId)];
        }
      }

      return true;
    } catch (error) {
      console.error('Error validating progress data:', error);
      return false;
    }
  }

  /**
   * Validate individual course progress
   */
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

  /**
   * Handle storage errors gracefully
   */
  private handleStorageError(operation: 'get' | 'save'): void {
    try {
      const errorKey = `eduverse_storage_error_${operation}`;
      const errorCount = parseInt(localStorage.getItem(errorKey) || '0') + 1;

      if (errorCount > 5) {
        console.warn(`Storage ${operation} errors exceeded limit, clearing storage`);
        this.clearAllProgress();
        localStorage.removeItem(errorKey);
      } else {
        localStorage.setItem(errorKey, errorCount.toString());
      }
    } catch (error) {
      console.error('Error handling storage error:', error);
    }
  }

  /**
   * Get progress for specific course
   */
  getCourseProgress(courseId: number): CourseProgress | null {
    const allData = this.getAllProgress();
    return allData.courses[courseId] || null;
  }

  /**
   * Save progress for specific course
   */
  saveCourseProgress(courseProgress: CourseProgress): boolean {
    try {
      if (!this.validateCourseProgress(courseProgress)) {
        console.error('Invalid course progress data');
        return false;
      }

      const allData = this.getAllProgress();
      courseProgress.lastAccessedAt = Date.now();
      allData.courses[courseProgress.courseId] = courseProgress;
      allData.lastSyncAt = Date.now();

      return this.saveAllProgress(allData);
    } catch (error) {
      console.error('Error saving course progress:', error);
      return false;
    }
  }

  // ===== MODULE PROGRESS METHODS =====

  /**
   * Update reading progress for a module
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
          `Reading progress updated: Course ${courseId}, Module ${moduleId}, Progress: ${newProgress}%`
        );
      }

      return success;
    } catch (error) {
      console.error('Error updating reading progress:', error);
      return false;
    }
  }

  /**
   * Add time spent on a module
   */
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
          `Time spent updated: Course ${courseId}, Module ${moduleId}, Added: ${seconds}s`
        );
      }

      return success;
    } catch (error) {
      console.error('Error adding time spent:', error);
      return false;
    }
  }

  /**
   * Mark module as completed
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

        // Add to sync queue for backend
        this.addToSyncQueue({
          type: 'module_completed',
          courseId,
          moduleId,
          timestamp: Date.now(),
        });

        console.log(`Module completed: Course ${courseId}, Module ${moduleId}`);
      }

      courseProgress.lastAccessedAt = Date.now();
      return this.saveCourseProgress(courseProgress);
    } catch (error) {
      console.error('Error completing module:', error);
      return false;
    }
  }

  /**
   * Set current module index
   */
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
        console.log(`Current module updated: Course ${courseId}, Module Index: ${newIndex}`);
      }

      return success;
    } catch (error) {
      console.error('Error setting current module:', error);
      return false;
    }
  }

  // ===== BOOKMARK AND NOTES METHODS =====

  /**
   * Toggle bookmark for module
   */
  toggleBookmark(courseId: number, moduleId: number, courseName?: string): boolean {
    try {
      const courseProgress =
        this.getCourseProgress(courseId) || this.createEmptyCourseProgress(courseId, courseName);
      const bookmarkIndex = courseProgress.bookmarks.indexOf(moduleId);

      if (bookmarkIndex > -1) {
        courseProgress.bookmarks.splice(bookmarkIndex, 1);
        console.log(`Bookmark removed: Course ${courseId}, Module ${moduleId}`);
      } else {
        courseProgress.bookmarks.push(moduleId);
        console.log(`Bookmark added: Course ${courseId}, Module ${moduleId}`);
      }

      courseProgress.lastAccessedAt = Date.now();
      return this.saveCourseProgress(courseProgress);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      return false;
    }
  }

  /**
   * Save note for module
   */
  saveNote(courseId: number, moduleId: number, note: string, courseName?: string): boolean {
    try {
      const courseProgress =
        this.getCourseProgress(courseId) || this.createEmptyCourseProgress(courseId, courseName);

      if (note.trim()) {
        courseProgress.notes[moduleId] = note.trim();
        console.log(`Note saved: Course ${courseId}, Module ${moduleId}`);
      } else {
        delete courseProgress.notes[moduleId];
        console.log(`Note deleted: Course ${courseId}, Module ${moduleId}`);
      }

      courseProgress.lastAccessedAt = Date.now();
      return this.saveCourseProgress(courseProgress);
    } catch (error) {
      console.error('Error saving note:', error);
      return false;
    }
  }

  // ===== COURSE COMPLETION METHODS =====

  /**
   * Mark course as completed
   */
  completeCourse(courseId: number, certificateId?: number): boolean {
    try {
      const courseProgress = this.getCourseProgress(courseId);
      if (!courseProgress) {
        console.error(`Cannot complete course ${courseId}: no progress found`);
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
        `Course completed: Course ${courseId}${certificateId ? `, Certificate ${certificateId}` : ''}`
      );

      return this.saveCourseProgress(courseProgress);
    } catch (error) {
      console.error('Error completing course:', error);
      return false;
    }
  }

  // ===== STATISTICS AND ANALYTICS =====

  /**
   * Get learning statistics
   */
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

  /**
   * Get course statistics
   */
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

  // ===== SYNC AND BACKUP METHODS =====

  /**
   * Add action to sync queue for backend synchronization
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
      queue.push(action);

      // Limit queue size
      if (queue.length > 50) {
        queue.splice(0, queue.length - 50); // Keep only last 50 actions
      }

      localStorage.setItem(this.SYNC_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  /**
   * Get sync queue
   */
  getSyncQueue(): Array<any> {
    try {
      const stored = localStorage.getItem(this.SYNC_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  }

  /**
   * Clear sync queue after successful sync
   */
  clearSyncQueue(): void {
    try {
      localStorage.removeItem(this.SYNC_KEY);
    } catch (error) {
      console.error('Error clearing sync queue:', error);
    }
  }

  /**
   * Export progress data for backup
   */
  exportProgress(): string {
    const allData = this.getAllProgress();
    return JSON.stringify(allData, null, 2);
  }

  /**
   * Import progress data from backup
   */
  importProgress(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData) as ProgressSyncData;

      // Validate data structure
      if (!this.validateProgressData(data)) {
        throw new Error('Invalid progress data format');
      }

      console.log('Importing progress data...');
      return this.saveAllProgress(data);
    } catch (error) {
      console.error('Error importing progress:', error);
      return false;
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Create empty course progress
   */
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

    console.log(`Created empty course progress for Course ${courseId}`);
    return courseProgress;
  }

  /**
   * Recalculate overall progress for course
   */
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
      `Progress recalculated: Course ${courseProgress.courseId}, Overall: ${courseProgress.overallProgress}%`
    );
  }

  /**
   * Clean up old data to free storage space
   */
  private cleanupOldData(data: ProgressSyncData): void {
    console.log('Cleaning up old data...');

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

    console.log(`Cleanup completed: removed ${cleanedCount} old courses`);
  }

  /**
   * Clear all progress data
   */
  clearAllProgress(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.SYNC_KEY);

      // Clear error counters
      const errorKeys = ['eduverse_storage_error_get', 'eduverse_storage_error_save'];
      errorKeys.forEach((key) => localStorage.removeItem(key));

      console.log('All progress data cleared');
      return true;
    } catch (error) {
      console.error('Error clearing progress:', error);
      return false;
    }
  }

  /**
   * Get storage usage info
   */
  getStorageInfo(): {
    used: number;
    total: number;
    percentage: number;
    canStore: boolean;
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
      };
    } catch (error) {
      return {
        used: 0,
        total: this.MAX_STORAGE_SIZE,
        percentage: 0,
        canStore: true,
      };
    }
  }

  /**
   * Debug method to log current state
   */
  debugLogState(courseId?: number): void {
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
  }
}

// ===== HOOKS FOR REACT COMPONENTS =====

export const useProgressStorage = (userId?: string) => {
  return new ProgressStorageService(userId);
};

export const useCourseProgress = (courseId: number, userId?: string) => {
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

// ===== BACKGROUND SYNC SERVICE =====

export class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private storage: ProgressStorageService;
  private syncInterval: number | null = null;

  constructor(
    private actor: any,
    userId?: string
  ) {
    this.storage = new ProgressStorageService(userId);
  }

  static getInstance(actor: any, userId?: string): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService(actor, userId);
    }
    return BackgroundSyncService.instance;
  }

  /**
   * Start background sync
   */
  startSync(intervalMinutes: number = 5): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = window.setInterval(
      () => {
        this.syncWithBackend();
      },
      intervalMinutes * 60 * 1000
    );

    // Initial sync
    this.syncWithBackend();
  }

  /**
   * Stop background sync
   */
  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Manually sync with backend
   */
  async syncWithBackend(): Promise<boolean> {
    try {
      const queue = this.storage.getSyncQueue();
      if (queue.length === 0) return true;

      console.log(`Syncing ${queue.length} actions with backend...`);

      // Process sync queue
      for (const action of queue) {
        await this.processAction(action);
      }

      // Clear queue after successful sync
      this.storage.clearSyncQueue();
      console.log('Sync completed successfully');
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      return false;
    }
  }

  /**
   * Process individual sync action
   */
  private async processAction(action: any): Promise<void> {
    switch (action.type) {
      case 'module_completed':
        // Could sync with backend that module was completed
        // For now, just log
        console.log('Module completed sync:', action);
        break;
      case 'course_completed':
        // Could sync with backend that course was completed
        console.log('Course completed sync:', action);
        break;
      default:
        console.log('Unknown sync action:', action);
    }
  }
}
