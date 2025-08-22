// hooks/useLearningProgress.ts
// React hooks untuk mengelola progress pembelajaran dengan dukungan offline dan real-time updates
// Dioptimalkan dengan integrasi User ID dari Internet Identity

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  ProgressStorageService,
  CourseProgress,
  LearningProgress,
  useProgressStorage,
  useCourseProgress,
  BackgroundSyncService,
} from '../services/progressStorage';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from 'declarations/eduverse_backend/eduverse_backend.did';
import { getAuthClient } from '@/lib/authClient';

// ===== INTERFACES =====

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
  refresh: () => Promise<void>;
}

// ===== UTILITY FUNCTIONS =====

const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const authClient = await getAuthClient();
    const identity = authClient.getIdentity();
    const principal = identity.getPrincipal();

    if (principal.isAnonymous()) {
      console.warn('⚠️ User is anonymous, using fallback ID');
      return `anonymous-${Date.now()}`;
    }

    const userIdStr = principal.toString();
    console.log(`✅ Got user ID from Internet Identity: ${userIdStr.slice(0, 20)}...`);
    return userIdStr;
  } catch (error) {
    console.error('❌ Error getting user ID:', error);
    return `fallback-${Date.now()}`;
  }
};

// ===== MAIN LEARNING PROGRESS HOOK =====

export const useLearningProgress = (
  courseId: number,
  courseMaterial: any,
  actor: ActorSubclass<_SERVICE> | null,
  providedUserId?: string
): [LearningProgressState, LearningProgressActions] => {
  
  // State untuk user ID - sumber kebenaran tunggal
  const [currentUserId, setCurrentUserId] = useState<string | null>(providedUserId || null);

  // Service refs
  const storage = useRef<ProgressStorageService | null>(null);
  const courseProgressHook = useRef<any>(null);
  const backgroundSync = useRef<BackgroundSyncService | null>(null);

  // State utama
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

  // Refs untuk tracking
  const sessionStartTime = useRef<number>(Date.now());
  const autoSaveInterval = useRef<number | null>(null);

  // ===== INITIALIZATION =====

  // Initialize user ID jika tidak ada
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
  }, [providedUserId, currentUserId]);

  // Initialize storage services ketika userId tersedia
  useEffect(() => {
    if (currentUserId) {
      try {
        storage.current = useProgressStorage(currentUserId);
        courseProgressHook.current = useCourseProgress(courseId, currentUserId);

        if (actor) {
          backgroundSync.current = BackgroundSyncService.getInstance(actor, currentUserId);
          backgroundSync.current.startSync(5);
        }

        console.log(`✅ Storage services initialized for user: ${currentUserId.slice(0, 20)}...`);
      } catch (error) {
        console.error(`❌ Failed to initialize storage for user ${currentUserId.slice(0, 20)}...:`, error);
        toast.error('Failed to initialize user storage');
      }
    }

    return () => {
      if (backgroundSync.current && currentUserId) {
        backgroundSync.current.stopSync();
      }
    };
  }, [currentUserId, courseId, actor]);

  // Update state ketika userId berubah
  useEffect(() => {
    setState((prev) => ({ ...prev, userId: currentUserId }));
  }, [currentUserId]);

  // Initialize progress data
  const initializeProgress = useCallback(async () => {
    if (!courseMaterial || !courseId || !storage.current || !currentUserId) {
      console.log('⏳ Waiting for initialization requirements...');
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      console.log(`📖 Initializing progress for user: ${currentUserId.slice(0, 20)}..., course: ${courseId}`);

      let courseProgress = courseProgressHook.current.getCourseProgress();

      if (!courseProgress) {
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
        storage.current.saveCourseProgress(courseProgress);
      }

      const currentModule = courseMaterial.modules?.[courseProgress.currentModuleIndex] || null;
      const currentModuleProgress = courseProgress.moduleProgresses[currentModule?.moduleId];

      const completedModules = Object.values(courseProgress.moduleProgresses ?? {})
        .filter((p): p is LearningProgress => Boolean(p && (p as LearningProgress).isCompleted))
        .map((p) => p.moduleId);

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

      if (courseProgress.lastAccessedAt && Date.now() - courseProgress.lastAccessedAt > 300000) {
        const lastAccessed = new Date(courseProgress.lastAccessedAt).toLocaleString();
        toast.success(`Welcome back! Progress restored from ${lastAccessed}`, {
          description: `You're at Module ${courseProgress.currentModuleIndex + 1} with ${Math.round(courseProgress.overallProgress)}% complete`,
        });
      }

      console.log(`✅ Progress initialization completed for user: ${currentUserId.slice(0, 20)}...`);
    } catch (error) {
      console.error(`❌ Error initializing progress for user: ${currentUserId.slice(0, 20)}...:`, error);
      setState((prev) => ({ ...prev, isLoading: false }));
      toast.error('Failed to load learning progress');
    }
  }, [courseId, courseMaterial, currentUserId]);

  // Auto-save progress
  const autoSaveProgress = useCallback(() => {
    if (!state.currentModule || state.isLoading || !storage.current || !currentUserId) {
      return;
    }

    const sessionTime = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    if (sessionTime > 30) {
      courseProgressHook.current.addTimeSpent(
        state.currentModule.moduleId,
        sessionTime,
        courseMaterial?.title
      );
      sessionStartTime.current = Date.now();

      setState((prev) => ({
        ...prev,
        timeSpent: prev.timeSpent + sessionTime,
      }));

      console.log(`⏱️ Auto-saved ${sessionTime}s for user: ${currentUserId.slice(0, 20)}..., module: ${state.currentModule.moduleId}`);
    }
  }, [courseId, state.currentModule, state.isLoading, currentUserId, courseMaterial?.title]);

  // Setup auto-save interval
  useEffect(() => {
    if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current);
    }

    autoSaveInterval.current = window.setInterval(autoSaveProgress, 30000);

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [autoSaveProgress]);

  // Initialize ketika user ID tersedia
  useEffect(() => {
    if (currentUserId && storage.current) {
      initializeProgress();
    }
  }, [initializeProgress, currentUserId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.currentModule && !state.isLoading && storage.current && currentUserId) {
        const sessionTime = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        if (sessionTime > 0) {
          courseProgressHook.current.addTimeSpent(
            state.currentModule.moduleId,
            sessionTime,
            courseMaterial?.title
          );
          console.log(`💾 Final save ${sessionTime}s for user: ${currentUserId.slice(0, 20)}..., course: ${courseId}`);
        }
      }

      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }

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
        console.warn('⚠️ Invalid module navigation attempt');
        return;
      }

      const module = courseMaterial.modules[index];
      const moduleProgress = state.courseProgress?.moduleProgresses[module.moduleId];

      // Save current session time sebelum pindah
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

      courseProgressHook.current.setCurrentModule(index, courseMaterial.title);
      sessionStartTime.current = Date.now();

      setState((prev) => ({
        ...prev,
        currentModuleIndex: index,
        currentModule: module,
        readingProgress: moduleProgress?.readingProgress || 0,
        timeSpent: moduleProgress?.timeSpent || 0,
      }));

      toast.success(`Switched to Module ${index + 1}: ${module.title}`);
      console.log(`📍 User ${currentUserId.slice(0, 20)}... switched to module ${index + 1} in course ${courseId}`);
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
      if (!state.currentModule || !storage.current || !currentUserId) {
        console.warn('⚠️ Cannot update reading progress: missing requirements');
        return;
      }

      const clampedProgress = Math.max(0, Math.min(100, progress));

      if (clampedProgress > state.readingProgress) {
        courseProgressHook.current.updateReadingProgress(
          state.currentModule.moduleId,
          clampedProgress,
          courseMaterial?.title
        );

        setState((prev) => ({ ...prev, readingProgress: clampedProgress }));

        if (clampedProgress >= 100 && !state.completedModules.includes(state.currentModule.moduleId)) {
          setTimeout(() => completeCurrentModule(), 1000);
        }

        console.log(`📖 Reading progress updated to ${clampedProgress}% for user: ${currentUserId.slice(0, 20)}..., module: ${state.currentModule.moduleId}`);
      }
    },
    [state.currentModule, state.readingProgress, state.completedModules, courseId, courseMaterial?.title, currentUserId]
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
      console.log(`🎯 Completing module ${state.currentModule.moduleId} for user: ${currentUserId.slice(0, 20)}...`);

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

        const totalModules = courseMaterial?.modules?.length || 0;
        const completedCount = state.completedModules.length + 1;

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
      console.error(`❌ Error completing module for user: ${currentUserId.slice(0, 20)}...:`, error);
      toast.error('Failed to complete module');
      return false;
    }
  }, [state.currentModule, state.completedModules, courseId, courseMaterial, currentUserId]);

  // Actions lainnya dengan pola yang sama...
  const toggleBookmark = useCallback(
    (moduleId?: number): boolean => {
      const targetModuleId = moduleId || state.currentModule?.moduleId;
      if (!targetModuleId || !storage.current || !currentUserId) return false;

      try {
        const success = courseProgressHook.current.toggleBookmark(targetModuleId, courseMaterial?.title);

        if (success) {
          setState((prev) => {
            const isCurrentlyBookmarked = prev.bookmarkedModules.includes(targetModuleId);
            const newBookmarks = isCurrentlyBookmarked
              ? prev.bookmarkedModules.filter((id) => id !== targetModuleId)
              : [...prev.bookmarkedModules, targetModuleId];

            return { ...prev, bookmarkedModules: newBookmarks };
          });

          const isBookmarked = !state.bookmarkedModules.includes(targetModuleId);
          toast.success(isBookmarked ? 'Module bookmarked! 📌' : 'Bookmark removed');
          return isBookmarked;
        }

        return false;
      } catch (error) {
        console.error(`❌ Error toggling bookmark for user: ${currentUserId.slice(0, 20)}...:`, error);
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
        const success = courseProgressHook.current.saveNote(targetModuleId, note, courseMaterial?.title);

        if (success) {
          setState((prev) => {
            const newNotes = { ...prev.moduleNotes };
            if (note.trim()) {
              newNotes[targetModuleId] = note.trim();
            } else {
              delete newNotes[targetModuleId];
            }
            return { ...prev, moduleNotes: newNotes };
          });

          toast.success(note.trim() ? 'Note saved! 📝' : 'Note deleted');
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

  const deleteNote = useCallback((moduleId?: number): boolean => saveNote('', moduleId), [saveNote]);

  const completeCourse = useCallback(
    async (certificateId?: number): Promise<boolean> => {
      if (!storage.current || !currentUserId) return false;

      try {
        console.log(`🎓 Completing course ${courseId} for user: ${currentUserId.slice(0, 20)}...`);

        const success = courseProgressHook.current.completeCourse(certificateId);

        if (success) {
          setState((prev) => ({
            ...prev,
            overallProgress: 100,
            courseProgress: prev.courseProgress
              ? { ...prev.courseProgress, isCompleted: true, certificateId }
              : null,
          }));

          toast.success('🎓 Course completed successfully!', {
            description: certificateId
              ? 'Your certificate has been issued!'
              : 'Congratulations on completing the course!',
          });

          return true;
        }

        return false;
      } catch (error) {
        console.error(`❌ Error completing course for user: ${currentUserId.slice(0, 20)}...:`, error);
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
      console.log(`🔄 Syncing progress for user: ${currentUserId.slice(0, 20)}..., course: ${courseId}`);

      const success = await backgroundSync.current.syncWithBackend();

      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: Date.now(),
      }));

      if (success) {
        toast.success('Progress synced with server', { duration: 2000 });
      } else {
        toast.error('Sync failed, will retry automatically');
      }

      return success;
    } catch (error) {
      console.error(`❌ Error syncing with backend for user: ${currentUserId.slice(0, 20)}...:`, error);
      setState((prev) => ({ ...prev, isSyncing: false }));
      toast.error('Failed to sync with server');
      return false;
    }
  }, [actor, state.isSyncing, currentUserId, courseId]);

  const resetProgress = useCallback((): boolean => {
    if (!storage.current || !currentUserId) return false;

    try {
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

        setTimeout(() => initializeProgress(), 500);
        toast.success('Progress reset successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error(`❌ Error resetting progress for user: ${currentUserId.slice(0, 20)}...:`, error);
      toast.error('Failed to reset progress');
      return false;
    }
  }, [courseMaterial, initializeProgress, currentUserId, courseId]);

  const exportProgress = useCallback((): string => {
    if (!storage.current || !currentUserId) return '';

    const exportData = storage.current.exportProgress();
    
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
    console.log(`🔄 Refreshing progress for user: ${currentUserId?.slice(0, 20)}..., course: ${courseId}`);
    await initializeProgress();
    toast.success('Progress refreshed');
  }, [initializeProgress, currentUserId, courseId]);

  return [
    state,
    {
      goToModule,
      goToNextModule,
      goToPreviousModule,
      updateReadingProgress,
      addTimeSpent: (seconds: number) => {
        if (!state.currentModule || seconds <= 0 || !storage.current || !currentUserId) return;

        courseProgressHook.current.addTimeSpent(state.currentModule.moduleId, seconds, courseMaterial?.title);
        setState((prev) => ({ ...prev, timeSpent: prev.timeSpent + seconds }));
      },
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

// ===== SPECIALIZED HOOKS =====

// Hook untuk reading progress
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

  useEffect(() => {
    const getUserId = async () => {
      const userIdFromAuth = await getCurrentUserId();
      setUserId(userIdFromAuth);
      if (userIdFromAuth) {
        storageRef.current = useProgressStorage(userIdFromAuth);
      }
    };

    getUserId();
  }, []);

  useEffect(() => {
    if (storageRef.current && userId) {
      const courseProgress = storageRef.current.getCourseProgress(courseId);
      const moduleProgress = courseProgress?.moduleProgresses[moduleId];
      if (moduleProgress) {
        setProgress(moduleProgress.readingProgress);
      }
    }
  }, [courseId, moduleId, userId]);

  const updateProgress = useCallback(
    (newProgress: number) => {
      if (!storageRef.current || !userId) return;

      const clampedProgress = Math.max(0, Math.min(100, newProgress));
      if (clampedProgress > progress) {
        setProgress(clampedProgress);
        storageRef.current.updateReadingProgress(courseId, moduleId, clampedProgress);
        onProgressUpdate?.(clampedProgress);
      }
    },
    [courseId, moduleId, progress, userId, onProgressUpdate]
  );

  return { progress, updateProgress };
};

// Hook untuk time tracking
export const useTimeTracking = (courseId: number, moduleId: number, isActive: boolean = true) => {
  const [timeSpent, setTimeSpent] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const storageRef = useRef<ProgressStorageService | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const userIdFromAuth = await getCurrentUserId();
      setUserId(userIdFromAuth);
      if (userIdFromAuth) {
        storageRef.current = useProgressStorage(userIdFromAuth);
      }
    };

    getUserId();
  }, []);

  useEffect(() => {
    if (storageRef.current && userId) {
      const courseProgress = storageRef.current.getCourseProgress(courseId);
      const moduleProgress = courseProgress?.moduleProgresses[moduleId];
      if (moduleProgress) {
        setTimeSpent(moduleProgress.timeSpent);
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
          storageRef.current.addTimeSpent(courseId, moduleId, sessionTime);
          setTimeSpent((prev) => prev + sessionTime);
          startTimeRef.current = Date.now();
        }
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      if (storageRef.current) {
        const sessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (sessionTime > 0) {
          storageRef.current.addTimeSpent(courseId, moduleId, sessionTime);
          setTimeSpent((prev) => prev + sessionTime);
        }
      }
    };
  }, [courseId, moduleId, isActive, userId]);

  return { timeSpent };
};

// Hook untuk statistics
export const useProgressStatistics = (courseId?: number) => {
  const [statistics, setStatistics] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const storageRef = useRef<ProgressStorageService | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const userIdFromAuth = await getCurrentUserId();
      setUserId(userIdFromAuth);
      if (userIdFromAuth) {
        storageRef.current = useProgressStorage(userIdFromAuth);
      }
    };

    getUserId();
  }, []);

  const refreshStatistics = useCallback(() => {
    if (storageRef.current && userId) {
      if (courseId) {
        const courseStats = storageRef.current.getCourseStatistics(courseId);
        setStatistics(courseStats);
      } else {
        const globalStats = storageRef.current.getLearningStatistics();
        setStatistics(globalStats);
      }
    }
  }, [courseId, userId]);

  useEffect(() => {
    if (userId && storageRef.current) {
      refreshStatistics();
    }
  }, [refreshStatistics, userId]);

  return { statistics, refreshStatistics };
};

export default useLearningProgress;