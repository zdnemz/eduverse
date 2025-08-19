// hooks/useLearningProgress.ts
// React hooks for managing learning progress with offline support and real-time updates
// Enhanced with proper User ID integration from Internet Identity
// FIXED: Resolved TypeScript errors and improved type safety

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  ProgressStorageService,
  CourseProgress,
  LearningProgress, // This is the correct import - represents module progress
  useProgressStorage,
  useCourseProgress,
  BackgroundSyncService,
} from '../services/progressStorage';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from 'declarations/eduverse_backend/eduverse_backend.did';
import { getAuthClient } from '@/lib/authClient';

// ===== MAIN LEARNING PROGRESS HOOK =====

export interface LearningProgressState {
  // Current state
  currentModuleIndex: number;
  currentModule: any;
  courseProgress: CourseProgress | null;

  // Progress tracking
  overallProgress: number;
  readingProgress: number;
  timeSpent: number;

  // Module states
  completedModules: number[];
  bookmarkedModules: number[];
  moduleNotes: { [moduleId: number]: string };

  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;

  // User identification
  userId: string | null;

  // Statistics
  statistics: any;
}

export interface LearningProgressActions {
  // Navigation
  goToModule: (index: number) => void;
  goToNextModule: () => void;
  goToPreviousModule: () => void;

  // Progress updates
  updateReadingProgress: (progress: number) => void;
  addTimeSpent: (seconds: number) => void;
  completeCurrentModule: () => Promise<boolean>;

  // Module management
  toggleBookmark: (moduleId?: number) => boolean;
  saveNote: (note: string, moduleId?: number) => boolean;
  deleteNote: (moduleId?: number) => boolean;

  // Course completion
  completeCourse: (certificateId?: number) => Promise<boolean>;

  // Sync and data
  syncWithBackend: () => Promise<boolean>;
  resetProgress: () => boolean;
  exportProgress: () => string;

  // Refresh data
  refresh: () => Promise<void>;
}

export const useLearningProgress = (
  courseId: number,
  courseMaterial: any,
  actor: ActorSubclass<_SERVICE> | null,
  providedUserId?: string
): [LearningProgressState, LearningProgressActions] => {
  // State for user ID - this will be the source of truth
  const [currentUserId, setCurrentUserId] = useState<string | null>(providedUserId || null);

  // Storage service refs
  const storage = useRef<ProgressStorageService | null>(null);
  const courseProgressHook = useRef<any>(null);
  const backgroundSync = useRef<BackgroundSyncService | null>(null);

  // Initialize storage services when userId is available
  useEffect(() => {
    if (currentUserId) {
      try {
        // Create user-specific storage service
        storage.current = useProgressStorage(currentUserId);
        courseProgressHook.current = useCourseProgress(courseId, currentUserId);

        // Initialize background sync service
        if (actor) {
          backgroundSync.current = BackgroundSyncService.getInstance(actor, currentUserId);
          backgroundSync.current.startSync(5); // Sync every 5 minutes
        }

        console.log(`✅ Initialized storage services for user: ${currentUserId.slice(0, 20)}...`);
      } catch (error) {
        console.error(
          `❌ Failed to initialize storage for user ${currentUserId.slice(0, 20)}...:`,
          error
        );
        toast.error('Failed to initialize user storage');
      }
    }

    return () => {
      // Cleanup background sync
      if (backgroundSync.current && currentUserId) {
        backgroundSync.current.stopSync();
      }
    };
  }, [currentUserId, courseId, actor]);

  // Get user ID from Internet Identity
  const getCurrentUserId = useCallback(async (): Promise<string | null> => {
    try {
      const authClient = await getAuthClient();
      const identity = authClient.getIdentity();
      const principal = identity.getPrincipal();

      if (principal.isAnonymous()) {
        console.warn('⚠️  User is anonymous, using fallback ID');
        return `anonymous-${Date.now()}`;
      }

      const userIdStr = principal.toString();
      console.log(`✅ Got user ID from Internet Identity: ${userIdStr.slice(0, 20)}...`);
      return userIdStr;
    } catch (error) {
      console.error('❌ Error getting user ID:', error);
      return `fallback-${Date.now()}`;
    }
  }, []);

  // Initialize user ID
  useEffect(() => {
    const initUserId = async () => {
      if (!currentUserId && !providedUserId) {
        console.log('🔍 No user ID provided, getting from Internet Identity...');
        const userId = await getCurrentUserId();
        setCurrentUserId(userId);
      } else if (providedUserId && providedUserId !== currentUserId) {
        console.log(`🔄 Switching to provided user ID: ${providedUserId.slice(0, 20)}...`);
        setCurrentUserId(providedUserId);
      }
    };

    initUserId();
  }, [providedUserId, currentUserId, getCurrentUserId]);

  // State
  const [state, setState] = useState<LearningProgressState>({
    currentModuleIndex: 0,
    currentModule: null,
    courseProgress: null,
    overallProgress: 0,
    readingProgress: 0,
    timeSpent: 0,
    completedModules: [],
    bookmarkedModules: [],
    moduleNotes: {},
    isLoading: true,
    isSyncing: false,
    lastSyncTime: null,
    userId: currentUserId,
    statistics: null,
  });

  // Refs for tracking
  const sessionStartTime = useRef<number>(Date.now());
  const autoSaveInterval = useRef<number | null>(null);

  // Update state when userId changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      userId: currentUserId,
    }));
  }, [currentUserId]);

  // Initialize progress data using the user-specific storage
  const initializeProgress = useCallback(async () => {
    if (!courseMaterial || !courseId || !storage.current || !currentUserId) {
      console.log('⏳ Waiting for initialization requirements...');
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      console.log(
        `📖 Initializing progress for user: ${currentUserId.slice(0, 20)}..., course: ${courseId}`
      );

      // Get user-specific course progress
      let courseProgress = courseProgressHook.current.getCourseProgress();

      // Create new progress if none exists
      if (!courseProgress) {
        console.log(`📝 Creating new course progress for user: ${currentUserId.slice(0, 20)}...`);
        courseProgress = {
          courseId,
          courseName: courseMaterial.title || `Course ${courseId}`,
          currentModuleIndex: 0,
          totalModules: courseMaterial.modules?.length || 0,
          overallProgress: 0,
          moduleProgresses: {},
          bookmarks: [],
          notes: {},
          lastAccessedAt: Date.now(),
          isCompleted: false,
        };

        // Save the new progress using user-specific storage
        storage.current.saveCourseProgress(courseProgress);
      } else {
        console.log(
          `📊 Loaded existing progress for user: ${currentUserId.slice(0, 20)}..., course: ${courseId}`
        );

        // Update total modules if course structure changed
        if (
          courseMaterial.modules &&
          courseProgress.totalModules !== courseMaterial.modules.length
        ) {
          courseProgress.totalModules = courseMaterial.modules.length;
          storage.current.saveCourseProgress(courseProgress);
          console.log(`🔄 Updated total modules count to ${courseMaterial.modules.length}`);
        }
      }

      // Get current module
      const currentModule = courseMaterial.modules?.[courseProgress.currentModuleIndex] || null;
      const currentModuleProgress = courseProgress.moduleProgresses[currentModule?.moduleId];

      // Extract completed modules - FIXED: Use LearningProgress type
      const completedModules = Object.values(courseProgress.moduleProgresses ?? {})
        .filter((p): p is LearningProgress => Boolean(p && (p as LearningProgress).isCompleted))
        .map((p) => p.moduleId);

      // Get statistics using user-specific storage
      const statistics = storage.current.getCourseStatistics(courseId);

      setState((prev) => ({
        ...prev,
        currentModuleIndex: courseProgress!.currentModuleIndex,
        currentModule,
        courseProgress,
        overallProgress: courseProgress!.overallProgress,
        readingProgress: currentModuleProgress?.readingProgress || 0,
        timeSpent: currentModuleProgress?.timeSpent || 0,
        completedModules,
        bookmarkedModules: courseProgress!.bookmarks,
        moduleNotes: courseProgress!.notes,
        isLoading: false,
        statistics,
        userId: currentUserId,
      }));

      // Show restored progress message if significant time passed
      if (courseProgress.lastAccessedAt && Date.now() - courseProgress.lastAccessedAt > 300000) {
        const lastAccessed = new Date(courseProgress.lastAccessedAt).toLocaleString();
        toast.success(`Welcome back! Progress restored from ${lastAccessed}`, {
          description: `You're at Module ${courseProgress.currentModuleIndex + 1} with ${Math.round(courseProgress.overallProgress)}% complete`,
        });
      }

      console.log(
        `✅ Progress initialization completed for user: ${currentUserId.slice(0, 20)}...`
      );
    } catch (error) {
      console.error(
        `❌ Error initializing progress for user: ${currentUserId.slice(0, 20)}...:`,
        error
      );
      setState((prev) => ({ ...prev, isLoading: false }));
      toast.error('Failed to load learning progress');
    }
  }, [courseId, courseMaterial, currentUserId]);

  // Auto-save progress using user-specific storage
  const autoSaveProgress = useCallback(() => {
    if (!state.currentModule || state.isLoading || !storage.current || !currentUserId) {
      return;
    }

    const sessionTime = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    if (sessionTime > 30) {
      // Only save if session is longer than 30 seconds
      courseProgressHook.current.addTimeSpent(
        state.currentModule.moduleId,
        sessionTime,
        courseMaterial?.title
      );
      sessionStartTime.current = Date.now();

      // Update state silently
      setState((prev) => ({
        ...prev,
        timeSpent: prev.timeSpent + sessionTime,
      }));

      console.log(
        `⏱️  Auto-saved ${sessionTime}s for user: ${currentUserId.slice(0, 20)}..., module: ${state.currentModule.moduleId}`
      );
    }
  }, [courseId, state.currentModule, state.isLoading, currentUserId, courseMaterial?.title]);

  // Setup auto-save interval
  useEffect(() => {
    if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current);
    }

    autoSaveInterval.current = window.setInterval(autoSaveProgress, 30000); // Every 30 seconds

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [autoSaveProgress]);

  // Initialize when user ID is available
  useEffect(() => {
    if (currentUserId && storage.current) {
      initializeProgress();
    }
  }, [initializeProgress, currentUserId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Save final session time
      if (state.currentModule && !state.isLoading && storage.current && currentUserId) {
        const sessionTime = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        if (sessionTime > 0) {
          courseProgressHook.current.addTimeSpent(
            state.currentModule.moduleId,
            sessionTime,
            courseMaterial?.title
          );
          console.log(
            `💾 Final save ${sessionTime}s for user: ${currentUserId.slice(0, 20)}..., course: ${courseId}`
          );
        }
      }

      // Clear intervals
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }

      // Stop background sync
      if (backgroundSync.current) {
        backgroundSync.current.stopSync();
      }
    };
  }, [courseId, state.currentModule, state.isLoading, currentUserId, courseMaterial?.title]);

  // ===== ACTIONS =====

  const goToModule = useCallback(
    (index: number) => {
      if (
        !courseMaterial?.modules ||
        index < 0 ||
        index >= courseMaterial.modules.length ||
        !storage.current ||
        !currentUserId
      ) {
        console.warn('⚠️  Invalid module navigation attempt');
        return;
      }

      const module = courseMaterial.modules[index];
      const moduleProgress = state.courseProgress?.moduleProgresses[module.moduleId];

      // Save current session time before switching
      if (state.currentModule) {
        const sessionTime = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        if (sessionTime > 0) {
          courseProgressHook.current.addTimeSpent(
            state.currentModule.moduleId,
            sessionTime,
            courseMaterial?.title
          );
        }
      }

      // Update using user-specific storage
      courseProgressHook.current.setCurrentModule(index, courseMaterial.title);

      // Reset session timer
      sessionStartTime.current = Date.now();

      // Update state
      setState((prev) => ({
        ...prev,
        currentModuleIndex: index,
        currentModule: module,
        readingProgress: moduleProgress?.readingProgress || 0,
        timeSpent: moduleProgress?.timeSpent || 0,
      }));

      toast.success(`Switched to Module ${index + 1}: ${module.title}`);
      console.log(
        `📍 User ${currentUserId.slice(0, 20)}... switched to module ${index + 1} in course ${courseId}`
      );
    },
    [courseMaterial, state.currentModule, state.courseProgress, courseId, currentUserId]
  );

  const goToNextModule = useCallback(() => {
    if (state.currentModuleIndex < (courseMaterial?.modules?.length || 0) - 1) {
      goToModule(state.currentModuleIndex + 1);
    } else {
      toast.info("You're already at the last module");
    }
  }, [state.currentModuleIndex, courseMaterial?.modules?.length, goToModule]);

  const goToPreviousModule = useCallback(() => {
    if (state.currentModuleIndex > 0) {
      goToModule(state.currentModuleIndex - 1);
    } else {
      toast.info("You're already at the first module");
    }
  }, [state.currentModuleIndex, goToModule]);

  const updateReadingProgress = useCallback(
    (progress: number) => {
      if (!state.currentModule || !storage.current || !currentUserId) return;

      const clampedProgress = Math.max(0, Math.min(100, progress));

      // Only update if progress increased
      if (clampedProgress > state.readingProgress) {
        // Use user-specific storage
        courseProgressHook.current.updateReadingProgress(
          state.currentModule.moduleId,
          clampedProgress,
          courseMaterial?.title
        );

        setState((prev) => ({
          ...prev,
          readingProgress: clampedProgress,
        }));

        // Auto-complete if reading progress reaches 100%
        if (
          clampedProgress >= 100 &&
          !state.completedModules.includes(state.currentModule.moduleId)
        ) {
          setTimeout(() => {
            completeCurrentModule();
          }, 1000);
        }

        console.log(
          `📖 Reading progress updated to ${clampedProgress}% for user: ${currentUserId.slice(0, 20)}..., module: ${state.currentModule.moduleId}`
        );
      }
    },
    [
      state.currentModule,
      state.readingProgress,
      state.completedModules,
      courseId,
      courseMaterial?.title,
      currentUserId,
    ]
  );

  const addTimeSpent = useCallback(
    (seconds: number) => {
      if (!state.currentModule || seconds <= 0 || !storage.current || !currentUserId) return;

      // Use user-specific storage
      courseProgressHook.current.addTimeSpent(
        state.currentModule.moduleId,
        seconds,
        courseMaterial?.title
      );

      setState((prev) => ({
        ...prev,
        timeSpent: prev.timeSpent + seconds,
      }));

      console.log(
        `⏱️  Added ${seconds}s time for user: ${currentUserId.slice(0, 20)}..., module: ${state.currentModule.moduleId}`
      );
    },
    [state.currentModule, courseId, courseMaterial?.title, currentUserId]
  );

  const completeCurrentModule = useCallback(async (): Promise<boolean> => {
    if (
      !state.currentModule ||
      state.completedModules.includes(state.currentModule.moduleId) ||
      !storage.current ||
      !currentUserId
    ) {
      return false;
    }

    try {
      console.log(
        `🎯 Completing module ${state.currentModule.moduleId} for user: ${currentUserId.slice(0, 20)}...`
      );

      // Use user-specific storage
      const success = courseProgressHook.current.completeModule(
        state.currentModule.moduleId,
        courseMaterial?.title
      );

      if (success) {
        setState((prev) => {
          const newCompletedModules = [...prev.completedModules, state.currentModule.moduleId];
          const newOverallProgress = Math.round(
            (newCompletedModules.length / (courseMaterial?.modules?.length || 1)) * 100
          );

          return {
            ...prev,
            completedModules: newCompletedModules,
            overallProgress: newOverallProgress,
            readingProgress: 100,
          };
        });

        toast.success('Module completed! 🎉', {
          description: `Great job completing "${state.currentModule.title}"`,
        });

        console.log(
          `✅ Module ${state.currentModule.moduleId} completed by user: ${currentUserId.slice(0, 20)}...`
        );

        // Check if all modules completed
        const totalModules = courseMaterial?.modules?.length || 0;
        const completedCount = state.completedModules.length + 1; // +1 for current module

        if (completedCount === totalModules) {
          setTimeout(() => {
            toast.success('🏆 Congratulations! All modules completed!', {
              description: 'You can now take the final quiz to earn your certificate',
            });
          }, 3000);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error(
        `❌ Error completing module for user: ${currentUserId.slice(0, 20)}...:`,
        error
      );
      toast.error('Failed to complete module');
      return false;
    }
  }, [
    state.currentModule,
    state.completedModules,
    state.currentModuleIndex,
    courseId,
    courseMaterial,
    goToNextModule,
    currentUserId,
  ]);

  const toggleBookmark = useCallback(
    (moduleId?: number): boolean => {
      const targetModuleId = moduleId || state.currentModule?.moduleId;
      if (!targetModuleId || !storage.current || !currentUserId) return false;

      try {
        // Use user-specific storage
        const success = courseProgressHook.current.toggleBookmark(
          targetModuleId,
          courseMaterial?.title
        );

        if (success) {
          setState((prev) => {
            const isCurrentlyBookmarked = prev.bookmarkedModules.includes(targetModuleId);
            const newBookmarks = isCurrentlyBookmarked
              ? prev.bookmarkedModules.filter((id) => id !== targetModuleId)
              : [...prev.bookmarkedModules, targetModuleId];

            return {
              ...prev,
              bookmarkedModules: newBookmarks,
            };
          });

          const isBookmarked = !state.bookmarkedModules.includes(targetModuleId);
          toast.success(isBookmarked ? 'Module bookmarked! 📌' : 'Bookmark removed');
          console.log(
            `🔖 Bookmark ${isBookmarked ? 'added' : 'removed'} for user: ${currentUserId.slice(0, 20)}..., module: ${targetModuleId}`
          );
          return isBookmarked;
        }

        return false;
      } catch (error) {
        console.error(
          `❌ Error toggling bookmark for user: ${currentUserId.slice(0, 20)}...:`,
          error
        );
        toast.error('Failed to toggle bookmark');
        return false;
      }
    },
    [state.currentModule, state.bookmarkedModules, courseId, courseMaterial?.title, currentUserId]
  );

  const saveNote = useCallback(
    (note: string, moduleId?: number): boolean => {
      const targetModuleId = moduleId || state.currentModule?.moduleId;
      if (!targetModuleId || !storage.current || !currentUserId) return false;

      try {
        // Use user-specific storage
        const success = courseProgressHook.current.saveNote(
          targetModuleId,
          note,
          courseMaterial?.title
        );

        if (success) {
          setState((prev) => {
            const newNotes = { ...prev.moduleNotes };
            if (note.trim()) {
              newNotes[targetModuleId] = note.trim();
            } else {
              delete newNotes[targetModuleId];
            }

            return {
              ...prev,
              moduleNotes: newNotes,
            };
          });

          toast.success(note.trim() ? 'Note saved! 📝' : 'Note deleted');
          console.log(
            `📝 Note ${note.trim() ? 'saved' : 'deleted'} for user: ${currentUserId.slice(0, 20)}..., module: ${targetModuleId}`
          );
          return true;
        }

        return false;
      } catch (error) {
        console.error(`❌ Error saving note for user: ${currentUserId.slice(0, 20)}...:`, error);
        toast.error('Failed to save note');
        return false;
      }
    },
    [state.currentModule, courseId, courseMaterial?.title, currentUserId]
  );

  const deleteNote = useCallback(
    (moduleId?: number): boolean => {
      return saveNote('', moduleId);
    },
    [saveNote]
  );

  const completeCourse = useCallback(
    async (certificateId?: number): Promise<boolean> => {
      if (!storage.current || !currentUserId) return false;

      try {
        console.log(`🎓 Completing course ${courseId} for user: ${currentUserId.slice(0, 20)}...`);

        // Use user-specific storage
        const success = courseProgressHook.current.completeCourse(certificateId);

        if (success) {
          setState((prev) => ({
            ...prev,
            overallProgress: 100,
            courseProgress: prev.courseProgress
              ? {
                  ...prev.courseProgress,
                  isCompleted: true,
                  certificateId,
                }
              : null,
          }));

          toast.success('🎓 Course completed successfully!', {
            description: certificateId
              ? 'Your certificate has been issued!'
              : 'Congratulations on completing the course!',
          });

          console.log(
            `✅ Course ${courseId} completed by user: ${currentUserId.slice(0, 20)}..., certificate: ${certificateId}`
          );
          return true;
        }

        return false;
      } catch (error) {
        console.error(
          `❌ Error completing course for user: ${currentUserId.slice(0, 20)}...:`,
          error
        );
        toast.error('Failed to complete course');
        return false;
      }
    },
    [courseId, currentUserId]
  );

  const syncWithBackend = useCallback(async (): Promise<boolean> => {
    if (!actor || state.isSyncing || !currentUserId || !backgroundSync.current) return false;

    setState((prev) => ({ ...prev, isSyncing: true }));

    try {
      console.log(
        `🔄 Syncing progress for user: ${currentUserId.slice(0, 20)}..., course: ${courseId}`
      );

      // Use user-specific background sync service
      const success = await backgroundSync.current.syncWithBackend();

      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: Date.now(),
      }));

      if (success) {
        toast.success('Progress synced with server', { duration: 2000 });
        console.log(
          `✅ Sync completed for user: ${currentUserId.slice(0, 20)}..., course: ${courseId}`
        );
      } else {
        toast.error('Sync failed, will retry automatically');
        console.log(
          `❌ Sync failed for user: ${currentUserId.slice(0, 20)}..., course: ${courseId}`
        );
      }

      return success;
    } catch (error) {
      console.error(
        `❌ Error syncing with backend for user: ${currentUserId.slice(0, 20)}...:`,
        error
      );
      setState((prev) => ({ ...prev, isSyncing: false }));
      toast.error('Failed to sync with server');
      return false;
    }
  }, [actor, state.isSyncing, currentUserId, courseId]);

  const resetProgress = useCallback((): boolean => {
    if (!storage.current || !currentUserId) return false;

    try {
      console.log(
        `🗑️  Resetting progress for user: ${currentUserId.slice(0, 20)}..., course: ${courseId}`
      );

      // Use user-specific storage - only clear this user's progress
      const success = storage.current.clearAllProgress();

      if (success) {
        setState({
          currentModuleIndex: 0,
          currentModule: courseMaterial?.modules?.[0] || null,
          courseProgress: null,
          overallProgress: 0,
          readingProgress: 0,
          timeSpent: 0,
          completedModules: [],
          bookmarkedModules: [],
          moduleNotes: {},
          isLoading: false,
          isSyncing: false,
          lastSyncTime: null,
          userId: currentUserId,
          statistics: null,
        });

        // Reinitialize
        setTimeout(() => initializeProgress(), 500);

        toast.success('Progress reset successfully');
        console.log(
          `✅ Progress reset for user: ${currentUserId.slice(0, 20)}..., course: ${courseId}`
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error(
        `❌ Error resetting progress for user: ${currentUserId.slice(0, 20)}...:`,
        error
      );
      toast.error('Failed to reset progress');
      return false;
    }
  }, [courseMaterial, initializeProgress, currentUserId, courseId]);

  const exportProgress = useCallback((): string => {
    if (!storage.current || !currentUserId) return '';

    // Export only this user's progress
    const exportData = storage.current.exportProgress();
    console.log(`📤 Progress exported for user: ${currentUserId.slice(0, 20)}...`);

    // Create download
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduverse-progress-${currentUserId.slice(0, 10)}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Progress exported successfully!');
    return exportData;
  }, [currentUserId]);

  const refresh = useCallback(async (): Promise<void> => {
    const userIdForLog = currentUserId ? currentUserId.slice(0, 20) + '...' : 'unknown';
    console.log(`🔄 Refreshing progress for user: ${userIdForLog}, course: ${courseId}`);
    await initializeProgress();
    toast.success('Progress refreshed');
  }, [initializeProgress, currentUserId, courseId]);

  // Return state and actions
  return [
    state,
    {
      goToModule,
      goToNextModule,
      goToPreviousModule,
      updateReadingProgress,
      addTimeSpent,
      completeCurrentModule,
      toggleBookmark,
      saveNote,
      deleteNote,
      completeCourse,
      syncWithBackend,
      resetProgress,
      exportProgress,
      refresh,
    },
  ];
};

// ===== READING PROGRESS HOOK =====
// Uses user-specific storage

export const useReadingProgress = (
  courseId: number,
  moduleId: number,
  onProgressUpdate?: (progress: number) => void
) => {
  const [progress, setProgress] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const storageRef = useRef<ProgressStorageService | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Set<number>>(new Set());

  // Get user ID from Internet Identity
  useEffect(() => {
    const getUserId = async () => {
      try {
        const authClient = await getAuthClient();
        const identity = authClient.getIdentity();
        const principal = identity.getPrincipal();

        if (!principal.isAnonymous()) {
          const userIdStr = principal.toString();
          setUserId(userIdStr);
          // Create user-specific storage service
          storageRef.current = useProgressStorage(userIdStr);
          console.log(`✅ Reading progress initialized for user: ${userIdStr.slice(0, 20)}...`);
        } else {
          console.warn('⚠️  User is anonymous, reading progress will not be saved');
        }
      } catch (error) {
        console.error('❌ Error getting user ID for reading progress:', error);
      }
    };

    getUserId();
  }, []);

  useEffect(() => {
    // Load initial progress
    if (storageRef.current && userId) {
      const courseProgress = storageRef.current.getCourseProgress(courseId);
      const moduleProgress = courseProgress?.moduleProgresses[moduleId];
      if (moduleProgress) {
        setProgress(moduleProgress.readingProgress);
        console.log(
          `📖 Loaded reading progress: ${moduleProgress.readingProgress}% for user: ${userId.slice(0, 20)}..., module: ${moduleId}`
        );
      }
    }
  }, [courseId, moduleId, userId]);

  useEffect(() => {
    // Setup intersection observer for automatic progress tracking
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-progress-index') || '0');

          if (entry.isIntersecting) {
            elementsRef.current.add(index);
          } else {
            elementsRef.current.delete(index);
          }
        });

        // Calculate progress based on visible elements
        const totalElements = document.querySelectorAll('[data-progress-index]').length;
        if (totalElements > 0 && storageRef.current && userId) {
          const newProgress = Math.min(100, (elementsRef.current.size / totalElements) * 100);

          if (newProgress > progress) {
            setProgress(newProgress);
            storageRef.current.updateReadingProgress(courseId, moduleId, newProgress);
            onProgressUpdate?.(newProgress);

            console.log(
              `📖 Auto reading progress updated to ${newProgress}% for user: ${userId.slice(0, 20)}..., module: ${moduleId}`
            );
          }
        }
      },
      {
        threshold: 0.7,
        rootMargin: '0px 0px -100px 0px',
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [courseId, moduleId, progress, userId, onProgressUpdate]);

  const observeElement = useCallback((element: Element, index: number) => {
    if (observerRef.current) {
      element.setAttribute('data-progress-index', index.toString());
      observerRef.current.observe(element);
    }
  }, []);

  const updateProgress = useCallback(
    (newProgress: number) => {
      if (!storageRef.current || !userId) {
        console.warn('⚠️  Cannot update reading progress: no storage or user ID');
        return;
      }

      const clampedProgress = Math.max(0, Math.min(100, newProgress));
      if (clampedProgress > progress) {
        setProgress(clampedProgress);
        storageRef.current.updateReadingProgress(courseId, moduleId, clampedProgress);
        onProgressUpdate?.(clampedProgress);

        console.log(
          `📖 Manual reading progress updated to ${clampedProgress}% for user: ${userId.slice(0, 20)}..., module: ${moduleId}`
        );
      }
    },
    [courseId, moduleId, progress, userId, onProgressUpdate]
  );

  return {
    progress,
    updateProgress,
    observeElement,
  };
};

// ===== TIME TRACKING HOOK =====
// Uses user-specific storage

export const useTimeTracking = (courseId: number, moduleId: number, isActive: boolean = true) => {
  const [timeSpent, setTimeSpent] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const storageRef = useRef<ProgressStorageService | null>(null);

  // Get user ID from Internet Identity
  useEffect(() => {
    const getUserId = async () => {
      try {
        const authClient = await getAuthClient();
        const identity = authClient.getIdentity();
        const principal = identity.getPrincipal();

        if (!principal.isAnonymous()) {
          const userIdStr = principal.toString();
          setUserId(userIdStr);
          // Create user-specific storage service
          storageRef.current = useProgressStorage(userIdStr);
          console.log(`⏱️  Time tracking initialized for user: ${userIdStr.slice(0, 20)}...`);
        } else {
          console.warn('⚠️  User is anonymous, time tracking will not be saved');
        }
      } catch (error) {
        console.error('❌ Error getting user ID for time tracking:', error);
      }
    };

    getUserId();
  }, []);

  useEffect(() => {
    // Load initial time
    if (storageRef.current && userId) {
      const courseProgress = storageRef.current.getCourseProgress(courseId);
      const moduleProgress = courseProgress?.moduleProgresses[moduleId];
      if (moduleProgress) {
        setTimeSpent(moduleProgress.timeSpent);
        console.log(
          `⏱️  Loaded time spent: ${moduleProgress.timeSpent}s for user: ${userId.slice(0, 20)}..., module: ${moduleId}`
        );
      }
    }
  }, [courseId, moduleId, userId]);

  useEffect(() => {
    if (!isActive || !userId) return;

    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      if (storageRef.current) {
        const sessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (sessionTime >= 30) {
          // Update every 30 seconds
          storageRef.current.addTimeSpent(courseId, moduleId, sessionTime);
          setTimeSpent((prev) => prev + sessionTime);
          startTimeRef.current = Date.now();

          console.log(
            `⏱️  Time tracking updated: ${sessionTime}s for user: ${userId.slice(0, 20)}..., module: ${moduleId}`
          );
        }
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      // Save final session time
      if (storageRef.current) {
        const sessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (sessionTime > 0) {
          storageRef.current.addTimeSpent(courseId, moduleId, sessionTime);
          setTimeSpent((prev) => prev + sessionTime);

          console.log(
            `⏱️  Final time save: ${sessionTime}s for user: ${userId.slice(0, 20)}..., module: ${moduleId}`
          );
        }
      }
    };
  }, [courseId, moduleId, isActive, userId]);

  return { timeSpent };
};

// ===== PROGRESS STATISTICS HOOK =====
// Uses user-specific storage

export const useProgressStatistics = (courseId?: number) => {
  const [statistics, setStatistics] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const storageRef = useRef<ProgressStorageService | null>(null);

  // Get user ID from Internet Identity
  useEffect(() => {
    const getUserId = async () => {
      try {
        const authClient = await getAuthClient();
        const identity = authClient.getIdentity();
        const principal = identity.getPrincipal();

        if (!principal.isAnonymous()) {
          const userIdStr = principal.toString();
          setUserId(userIdStr);
          // Create user-specific storage service
          storageRef.current = useProgressStorage(userIdStr);
          console.log(`📊 Statistics initialized for user: ${userIdStr.slice(0, 20)}...`);
        } else {
          console.warn('⚠️  User is anonymous, statistics will not be available');
        }
      } catch (error) {
        console.error('❌ Error getting user ID for statistics:', error);
      }
    };

    getUserId();
  }, []);

  const refreshStatistics = useCallback(() => {
    if (storageRef.current && userId) {
      if (courseId) {
        const courseStats = storageRef.current.getCourseStatistics(courseId);
        setStatistics(courseStats);
        console.log(
          `📊 Course statistics refreshed for user: ${userId.slice(0, 20)}..., course: ${courseId}`
        );
      } else {
        const globalStats = storageRef.current.getLearningStatistics();
        setStatistics(globalStats);
        console.log(`📊 Global statistics refreshed for user: ${userId.slice(0, 20)}...`);
      }
    }
  }, [courseId, userId]);

  useEffect(() => {
    if (userId && storageRef.current) {
      refreshStatistics();
    }
  }, [refreshStatistics, userId]);

  return {
    statistics,
    refreshStatistics,
  };
};

// ===== USER MANAGEMENT HOOKS =====
// Added new hooks for user management

export const useUserProgressManager = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<string[]>([]);

  // Initialize current user
  useEffect(() => {
    const initUser = async () => {
      try {
        const authClient = await getAuthClient();
        const identity = authClient.getIdentity();
        const principal = identity.getPrincipal();

        if (!principal.isAnonymous()) {
          const userIdStr = principal.toString();
          setCurrentUserId(userIdStr);
          console.log(`👤 Current user initialized: ${userIdStr.slice(0, 20)}...`);
        }
      } catch (error) {
        console.error('❌ Error initializing current user:', error);
      }
    };

    initUser();
  }, []);

  const getAllUsers = useCallback(() => {
    try {
      // Import StorageManager from progressStorage
      const { StorageManager } = require('../services/progressStorage');
      const userIds = StorageManager.getAllUserIds();
      setAllUsers(userIds);
      console.log(`👥 Found ${userIds.length} users with stored progress`);
      return userIds;
    } catch (error) {
      console.error('❌ Error getting all users:', error);
      return [];
    }
  }, []);

  const switchUser = useCallback((userId: string) => {
    setCurrentUserId(userId);
    console.log(`🔄 Switched to user: ${userId.slice(0, 20)}...`);
    toast.success(`Switched to user: ${userId.slice(0, 20)}...`);
  }, []);

  const cleanupInactiveUsers = useCallback(() => {
    if (!currentUserId) return;

    try {
      const { StorageManager } = require('../services/progressStorage');
      StorageManager.cleanupInactiveUsers(currentUserId);
      // Refresh user list
      getAllUsers();
      toast.success('Inactive users cleaned up successfully');
    } catch (error) {
      console.error('❌ Error cleaning up inactive users:', error);
      toast.error('Failed to cleanup inactive users');
    }
  }, [currentUserId, getAllUsers]);

  const getStorageUsage = useCallback(() => {
    try {
      const { StorageManager } = require('../services/progressStorage');
      const usage = StorageManager.getStorageUsageSummary();
      console.log('💾 Storage usage summary:', usage);
      return usage;
    } catch (error) {
      console.error('❌ Error getting storage usage:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Load all users on mount
    getAllUsers();
  }, [getAllUsers]);

  return {
    currentUserId,
    allUsers,
    getAllUsers,
    switchUser,
    cleanupInactiveUsers,
    getStorageUsage,
  };
};

// ===== MULTI-USER PROGRESS COMPARISON HOOK =====

export const useProgressComparison = (courseId: number) => {
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const { allUsers } = useUserProgressManager();

  const compareProgress = useCallback(() => {
    const comparisons: any[] = [];

    allUsers.forEach((userId) => {
      try {
        const storage = useProgressStorage(userId);
        const courseProgress = storage.getCourseProgress(courseId);
        const statistics = storage.getCourseStatistics(courseId);

        if (courseProgress) {
          comparisons.push({
            userId: userId.slice(0, 20) + '...',
            fullUserId: userId,
            courseName: courseProgress.courseName,
            overallProgress: courseProgress.overallProgress,
            completedModules: Object.values(courseProgress.moduleProgresses).filter(
              (m: LearningProgress) => m.isCompleted
            ).length,
            totalModules: courseProgress.totalModules,
            timeSpent: statistics?.totalTimeSpent || 0,
            lastAccessed: courseProgress.lastAccessedAt,
            isCompleted: courseProgress.isCompleted,
          });
        }
      } catch (error) {
        console.error(`❌ Error getting progress for user ${userId.slice(0, 20)}...:`, error);
      }
    });

    // Sort by progress descending
    comparisons.sort((a, b) => b.overallProgress - a.overallProgress);
    setComparisonData(comparisons);

    console.log(
      `📊 Progress comparison loaded for ${comparisons.length} users in course ${courseId}`
    );
  }, [allUsers, courseId]);

  useEffect(() => {
    if (allUsers.length > 0) {
      compareProgress();
    }
  }, [compareProgress, allUsers]);

  return {
    comparisonData,
    refreshComparison: compareProgress,
  };
};

export default useLearningProgress;
