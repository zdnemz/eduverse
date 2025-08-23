// hooks/useLearningProgress.ts - FIXED VERSION
// React hooks untuk mengelola progress pembelajaran dengan dukungan offline dan real-time updates
// FIXED: Race condition, User ID persistence, dan data consistency issues

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

// ===== FIXED USER ID MANAGEMENT =====

// CRITICAL FIX: Persistent user ID storage
const USER_ID_STORAGE_KEY = 'eduverse_current_user_id';
const USER_ID_TIMESTAMP_KEY = 'eduverse_user_id_timestamp';
const USER_ID_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const saveUserIdToStorage = (userId: string) => {
  try {
    localStorage.setItem(USER_ID_STORAGE_KEY, userId);
    localStorage.setItem(USER_ID_TIMESTAMP_KEY, Date.now().toString());
    console.log(`💾 User ID saved to localStorage: ${userId.slice(0, 20)}...`);
  } catch (error) {
    console.warn('⚠️ Could not save user ID to localStorage:', error);
  }
};

const loadUserIdFromStorage = (): string | null => {
  try {
    const savedUserId = localStorage.getItem(USER_ID_STORAGE_KEY);
    const savedTimestamp = localStorage.getItem(USER_ID_TIMESTAMP_KEY);

    if (savedUserId && savedTimestamp) {
      const timestamp = parseInt(savedTimestamp);
      const now = Date.now();

      // Check if cached user ID is still valid
      if (now - timestamp < USER_ID_CACHE_DURATION) {
        console.log(`♻️ Loading cached user ID: ${savedUserId.slice(0, 20)}...`);
        return savedUserId;
      } else {
        console.log('⏰ Cached user ID expired, will refresh');
        // Don't clear here, let the new ID override
      }
    }

    return null;
  } catch (error) {
    console.warn('⚠️ Could not load user ID from localStorage:', error);
    return null;
  }
};

const getCurrentUserId = async (): Promise<string | null> => {
  try {
    console.log('🔍 Getting current user ID...');

    // STEP 1: Try to get from localStorage first (for faster loading)
    const cachedUserId = loadUserIdFromStorage();

    // STEP 2: Get from Internet Identity
    const authClient = await getAuthClient();
    const identity = authClient.getIdentity();
    const principal = identity.getPrincipal();

    let actualUserId: string;

    if (principal.isAnonymous()) {
      console.log('👤 User is anonymous');

      // If we have a cached anonymous ID, use it to maintain consistency
      if (cachedUserId && cachedUserId.startsWith('anonymous-')) {
        console.log(`♻️ Using existing anonymous ID: ${cachedUserId.slice(0, 20)}...`);
        return cachedUserId;
      }

      // Generate new anonymous ID only if no cache
      actualUserId = `anonymous-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🆔 Generated new anonymous ID: ${actualUserId.slice(0, 20)}...`);
    } else {
      actualUserId = principal.toString();
      console.log(`✅ Got authenticated user ID: ${actualUserId.slice(0, 20)}...`);
    }

    // STEP 3: Save to cache for next time
    saveUserIdToStorage(actualUserId);

    // STEP 4: If cached ID is different from actual ID, we need to handle migration
    if (cachedUserId && cachedUserId !== actualUserId) {
      console.log(
        `🔄 User ID changed from ${cachedUserId.slice(0, 20)}... to ${actualUserId.slice(0, 20)}...`
      );
      // TODO: Implement data migration if needed
    }

    return actualUserId;
  } catch (error) {
    console.error('❌ Error getting user ID:', error);

    // FALLBACK: Use cached ID if available
    const cachedUserId = loadUserIdFromStorage();
    if (cachedUserId) {
      console.log(`🔄 Using cached user ID as fallback: ${cachedUserId.slice(0, 20)}...`);
      return cachedUserId;
    }

    // LAST RESORT: Generate fallback ID
    const fallbackId = `fallback-${Date.now()}`;
    console.log(`🆘 Generated fallback ID: ${fallbackId}`);
    saveUserIdToStorage(fallbackId);
    return fallbackId;
  }
};

// ===== FIXED LEARNING PROGRESS HOOK =====

export const useLearningProgress = (
  courseId: number,
  courseMaterial: any,
  actor: ActorSubclass<_SERVICE> | null,
  providedUserId?: string
): [LearningProgressState, LearningProgressActions] => {
  // FIXED: Single source of truth for user ID dengan persistence
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isUserIdInitialized, setIsUserIdInitialized] = useState(false);

  // Service refs
  const storage = useRef<ProgressStorageService | null>(null);
  const courseProgressHook = useRef<any>(null);
  const backgroundSync = useRef<BackgroundSyncService | null>(null);

  // FIXED: Initialization tracking
  const isInitializing = useRef(false);
  const initializationPromise = useRef<Promise<void> | null>(null);

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
    userId: null,
    statistics: null,
  });

  // Refs untuk tracking
  const sessionStartTime = useRef<number>(Date.now());
  const autoSaveInterval = useRef<number | null>(null);

  // ===== FIXED USER ID INITIALIZATION =====

  // CRITICAL FIX: Single user ID initialization dengan priority
  const initializeUserId = useCallback(async () => {
    if (isUserIdInitialized && currentUserId) {
      console.log(`✅ User ID already initialized: ${currentUserId.slice(0, 20)}...`);
      return currentUserId;
    }

    if (isInitializing.current) {
      console.log('⏳ User ID initialization in progress, waiting...');
      if (initializationPromise.current) {
        await initializationPromise.current;
        return currentUserId;
      }
    }

    isInitializing.current = true;

    initializationPromise.current = (async () => {
      try {
        console.log('🚀 Starting user ID initialization...');

        let finalUserId: string | null = null;

        // PRIORITY 1: Use provided userId (from parent component)
        if (providedUserId) {
          console.log(`🎯 Using provided user ID: ${providedUserId.slice(0, 20)}...`);
          finalUserId = providedUserId;
        }
        // PRIORITY 2: Get from Internet Identity
        else {
          console.log('🔍 Getting user ID from Internet Identity...');
          finalUserId = await getCurrentUserId();
        }

        if (finalUserId && finalUserId !== currentUserId) {
          console.log(`🔄 Setting user ID: ${finalUserId.slice(0, 20)}...`);
          setCurrentUserId(finalUserId);
          setState((prev) => ({ ...prev, userId: finalUserId }));
        }

        setIsUserIdInitialized(true);
        console.log(`✅ User ID initialization completed: ${finalUserId?.slice(0, 20)}...`);
      } catch (error) {
        console.error('❌ Error in user ID initialization:', error);

        // Fallback to cached or generate new
        const fallbackId = loadUserIdFromStorage() || `emergency-${Date.now()}`;
        console.log(`🆘 Using emergency fallback ID: ${fallbackId.slice(0, 20)}...`);

        saveUserIdToStorage(fallbackId);
        setCurrentUserId(fallbackId);
        setState((prev) => ({ ...prev, userId: fallbackId }));
        setIsUserIdInitialized(true);
      } finally {
        isInitializing.current = false;
        initializationPromise.current = null;
      }
    })();

    await initializationPromise.current;
    return currentUserId;
  }, [currentUserId, isUserIdInitialized, providedUserId]);

  // Initialize user ID on mount atau ketika providedUserId berubah
  useEffect(() => {
    initializeUserId();
  }, [initializeUserId, providedUserId]);

  // ===== FIXED STORAGE SERVICES INITIALIZATION =====

  // FIXED: Initialize storage hanya setelah user ID confirmed
  useEffect(() => {
    if (!currentUserId || !isUserIdInitialized) {
      console.log('⏳ Waiting for user ID before initializing storage...');
      return;
    }

    try {
      console.log(`🏗️ Initializing storage services for user: ${currentUserId.slice(0, 20)}...`);

      // Initialize storage services
      storage.current = useProgressStorage(currentUserId);
      courseProgressHook.current = useCourseProgress(courseId, currentUserId);

      // Initialize background sync if actor available
      if (actor) {
        backgroundSync.current = BackgroundSyncService.getInstance(actor, currentUserId);
        backgroundSync.current.startSync(5);
        console.log('🔄 Background sync started');
      } else {
        console.log('⏳ Actor not ready, background sync will start later');
      }

      console.log(`✅ Storage services initialized for user: ${currentUserId.slice(0, 20)}...`);
    } catch (error) {
      console.error(
        `❌ Failed to initialize storage for user ${currentUserId.slice(0, 20)}...:`,
        error
      );
      toast.error('Failed to initialize user storage');
    }

    // Cleanup function
    return () => {
      if (backgroundSync.current) {
        backgroundSync.current.stopSync();
        console.log('🛑 Background sync stopped');
      }
    };
  }, [currentUserId, isUserIdInitialized, courseId, actor]);

  // ===== FIXED PROGRESS INITIALIZATION =====

  // FIXED: Initialize progress hanya setelah semua dependencies ready
  const initializeProgress = useCallback(async () => {
    if (
      !courseMaterial ||
      !courseId ||
      !storage.current ||
      !currentUserId ||
      !isUserIdInitialized
    ) {
      console.log('⏳ Waiting for progress initialization requirements...', {
        hasCourseMaterial: !!courseMaterial,
        hasCourseId: !!courseId,
        hasStorage: !!storage.current,
        hasUserId: !!currentUserId,
        isUserIdReady: isUserIdInitialized,
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      console.log(
        `📖 Initializing progress for user: ${currentUserId.slice(0, 20)}..., course: ${courseId}`
      );

      let courseProgress = courseProgressHook.current.getCourseProgress();

      // FIXED: Create course progress with proper defaults
      if (!courseProgress) {
        console.log('📝 Creating new course progress...');
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
        console.log('💾 New course progress saved');
      } else {
        console.log('♻️ Existing course progress loaded:', {
          currentModule: courseProgress.currentModuleIndex + 1,
          totalModules: courseProgress.totalModules,
          overallProgress: Math.round(courseProgress.overallProgress),
          completedModules: Object.values(courseProgress.moduleProgresses || {}).filter(
            (p: any) => p?.isCompleted
          ).length,
        });
      }

      const currentModule = courseMaterial.modules?.[courseProgress.currentModuleIndex] || null;
      const currentModuleProgress = courseProgress.moduleProgresses[currentModule?.moduleId];

      const completedModules = Object.values(courseProgress.moduleProgresses ?? {})
        .filter((p: any): p is LearningProgress =>
          Boolean(p && (p as LearningProgress).isCompleted)
        )
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

      // Show welcome back message for returning users
      if (courseProgress.lastAccessedAt && Date.now() - courseProgress.lastAccessedAt > 300000) {
        // 5 minutes
        const lastAccessed = new Date(courseProgress.lastAccessedAt).toLocaleString();
        toast.success(`Welcome back! Progress restored from ${lastAccessed}`, {
          description: `You're at Module ${courseProgress.currentModuleIndex + 1} with ${Math.round(courseProgress.overallProgress)}% complete`,
          duration: 5000,
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
  }, [courseId, courseMaterial, currentUserId, isUserIdInitialized]);

  // FIXED: Initialize progress hanya setelah user ID ready
  useEffect(() => {
    if (isUserIdInitialized && currentUserId && storage.current) {
      initializeProgress();
    }
  }, [initializeProgress, isUserIdInitialized, currentUserId]);

  // ===== AUTO-SAVE FUNCTIONALITY =====

  // FIXED: Auto-save dengan better error handling
  const autoSaveProgress = useCallback(() => {
    if (
      !state.currentModule ||
      state.isLoading ||
      !storage.current ||
      !currentUserId ||
      !isUserIdInitialized
    ) {
      return;
    }

    try {
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

        console.log(
          `⏱️ Auto-saved ${sessionTime}s for user: ${currentUserId.slice(0, 20)}..., module: ${state.currentModule.moduleId}`
        );
      }
    } catch (error) {
      console.error('❌ Error in auto-save:', error);
    }
  }, [
    courseId,
    state.currentModule,
    state.isLoading,
    currentUserId,
    isUserIdInitialized,
    courseMaterial?.title,
  ]);

  // Setup auto-save interval
  useEffect(() => {
    if (!isUserIdInitialized || !currentUserId) {
      return;
    }

    if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current);
    }

    autoSaveInterval.current = window.setInterval(autoSaveProgress, 30000);

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [autoSaveProgress, isUserIdInitialized, currentUserId]);

  // FIXED: Cleanup on unmount dengan better error handling
  useEffect(() => {
    return () => {
      if (
        state.currentModule &&
        !state.isLoading &&
        storage.current &&
        currentUserId &&
        isUserIdInitialized
      ) {
        try {
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
        } catch (error) {
          console.error('❌ Error in cleanup save:', error);
        }
      }

      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }

      if (backgroundSync.current) {
        backgroundSync.current.stopSync();
      }
    };
  }, [
    courseId,
    state.currentModule,
    state.isLoading,
    currentUserId,
    isUserIdInitialized,
    courseMaterial?.title,
  ]);

  // ===== ACTIONS IMPLEMENTATION =====

  const goToModule = useCallback(
    (index: number) => {
      if (
        !courseMaterial?.modules ||
        index < 0 ||
        index >= courseMaterial.modules.length ||
        !storage.current ||
        !currentUserId ||
        !isUserIdInitialized
      ) {
        console.warn('⚠️ Invalid module navigation attempt');
        return;
      }

      try {
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
        console.log(
          `📍 User ${currentUserId.slice(0, 20)}... switched to module ${index + 1} in course ${courseId}`
        );
      } catch (error) {
        console.error('❌ Error in module navigation:', error);
        toast.error('Failed to switch module');
      }
    },
    [
      courseMaterial,
      state.currentModule,
      state.courseProgress,
      courseId,
      currentUserId,
      isUserIdInitialized,
    ]
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
      if (!state.currentModule || !storage.current || !currentUserId || !isUserIdInitialized) {
        console.warn('⚠️ Cannot update reading progress: missing requirements');
        return;
      }

      try {
        const clampedProgress = Math.max(0, Math.min(100, progress));

        if (clampedProgress > state.readingProgress) {
          courseProgressHook.current.updateReadingProgress(
            state.currentModule.moduleId,
            clampedProgress,
            courseMaterial?.title
          );

          setState((prev) => ({ ...prev, readingProgress: clampedProgress }));

          // Auto-complete module at 100% reading progress
          if (
            clampedProgress >= 100 &&
            !state.completedModules.includes(state.currentModule.moduleId)
          ) {
            setTimeout(() => completeCurrentModule(), 1000);
          }

          console.log(
            `📖 Reading progress updated to ${clampedProgress}% for user: ${currentUserId.slice(0, 20)}..., module: ${state.currentModule.moduleId}`
          );
        }
      } catch (error) {
        console.error('❌ Error updating reading progress:', error);
      }
    },
    [
      state.currentModule,
      state.readingProgress,
      state.completedModules,
      courseId,
      courseMaterial?.title,
      currentUserId,
      isUserIdInitialized,
    ]
  );

  const completeCurrentModule = useCallback(async (): Promise<boolean> => {
    if (
      !state.currentModule ||
      state.completedModules.includes(state.currentModule.moduleId) ||
      !storage.current ||
      !currentUserId ||
      !isUserIdInitialized
    ) {
      return false;
    }

    try {
      console.log(
        `🎯 Completing module ${state.currentModule.moduleId} for user: ${currentUserId.slice(0, 20)}...`
      );

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
    courseId,
    courseMaterial,
    currentUserId,
    isUserIdInitialized,
  ]);

  // Implementation of other actions...
  const toggleBookmark = useCallback(
    (moduleId?: number): boolean => {
      const targetModuleId = moduleId || state.currentModule?.moduleId;
      if (!targetModuleId || !storage.current || !currentUserId || !isUserIdInitialized)
        return false;

      try {
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

            return { ...prev, bookmarkedModules: newBookmarks };
          });

          const isBookmarked = !state.bookmarkedModules.includes(targetModuleId);
          toast.success(isBookmarked ? 'Module bookmarked! 📌' : 'Bookmark removed');
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
    [
      state.currentModule,
      state.bookmarkedModules,
      courseId,
      courseMaterial?.title,
      currentUserId,
      isUserIdInitialized,
    ]
  );

  const saveNote = useCallback(
    (note: string, moduleId?: number): boolean => {
      const targetModuleId = moduleId || state.currentModule?.moduleId;
      if (!targetModuleId || !storage.current || !currentUserId || !isUserIdInitialized)
        return false;

      try {
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
    [state.currentModule, courseId, courseMaterial?.title, currentUserId, isUserIdInitialized]
  );

  const deleteNote = useCallback(
    (moduleId?: number): boolean => saveNote('', moduleId),
    [saveNote]
  );

  const completeCourse = useCallback(
    async (certificateId?: number): Promise<boolean> => {
      if (!storage.current || !currentUserId || !isUserIdInitialized) return false;

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
        console.error(
          `❌ Error completing course for user: ${currentUserId.slice(0, 20)}...:`,
          error
        );
        toast.error('Failed to complete course');
        return false;
      }
    },
    [courseId, currentUserId, isUserIdInitialized]
  );

  const syncWithBackend = useCallback(async (): Promise<boolean> => {
    if (
      !actor ||
      state.isSyncing ||
      !currentUserId ||
      !backgroundSync.current ||
      !isUserIdInitialized
    )
      return false;

    setState((prev) => ({ ...prev, isSyncing: true }));

    try {
      console.log(
        `🔄 Syncing progress for user: ${currentUserId.slice(0, 20)}..., course: ${courseId}`
      );

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
      console.error(
        `❌ Error syncing with backend for user: ${currentUserId.slice(0, 20)}...:`,
        error
      );
      setState((prev) => ({ ...prev, isSyncing: false }));
      toast.error('Failed to sync with server');
      return false;
    }
  }, [actor, state.isSyncing, currentUserId, courseId, isUserIdInitialized]);

  const resetProgress = useCallback((): boolean => {
    if (!storage.current || !currentUserId || !isUserIdInitialized) return false;

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
      console.error(
        `❌ Error resetting progress for user: ${currentUserId.slice(0, 20)}...:`,
        error
      );
      toast.error('Failed to reset progress');
      return false;
    }
  }, [courseMaterial, initializeProgress, currentUserId, courseId, isUserIdInitialized]);

  const exportProgress = useCallback((): string => {
    if (!storage.current || !currentUserId || !isUserIdInitialized) return '';

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
  }, [currentUserId, isUserIdInitialized]);

  const refresh = useCallback(async (): Promise<void> => {
    console.log(
      `🔄 Refreshing progress for user: ${currentUserId?.slice(0, 20)}..., course: ${courseId}`
    );
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
        if (
          !state.currentModule ||
          seconds <= 0 ||
          !storage.current ||
          !currentUserId ||
          !isUserIdInitialized
        )
          return;

        try {
          courseProgressHook.current.addTimeSpent(
            state.currentModule.moduleId,
            seconds,
            courseMaterial?.title
          );
          setState((prev) => ({ ...prev, timeSpent: prev.timeSpent + seconds }));
        } catch (error) {
          console.error('❌ Error adding time spent:', error);
        }
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

// ===== FIXED SPECIALIZED HOOKS =====

// FIXED: Reading progress hook with proper user ID handling
export const useReadingProgress = (
  courseId: number,
  moduleId: number,
  onProgressUpdate?: (progress: number) => void
) => {
  const [progress, setProgress] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isUserReady, setIsUserReady] = useState(false);
  const storageRef = useRef<ProgressStorageService | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Set<number>>(new Set());

  // FIXED: Initialize user ID with persistence
  useEffect(() => {
    const getUserId = async () => {
      try {
        const userIdFromAuth = await getCurrentUserId();
        if (userIdFromAuth) {
          setUserId(userIdFromAuth);
          storageRef.current = useProgressStorage(userIdFromAuth);
          setIsUserReady(true);
          console.log(
            `📖 Reading progress initialized for user: ${userIdFromAuth.slice(0, 20)}...`
          );
        }
      } catch (error) {
        console.error('❌ Error initializing reading progress user:', error);
      }
    };

    getUserId();
  }, []);

  // Load existing progress
  useEffect(() => {
    if (storageRef.current && userId && isUserReady) {
      try {
        const courseProgress = storageRef.current.getCourseProgress(courseId);
        const moduleProgress = courseProgress?.moduleProgresses[moduleId];
        if (moduleProgress) {
          setProgress(moduleProgress.readingProgress);
        }
      } catch (error) {
        console.error('❌ Error loading reading progress:', error);
      }
    }
  }, [courseId, moduleId, userId, isUserReady]);

  const updateProgress = useCallback(
    (newProgress: number) => {
      if (!storageRef.current || !userId || !isUserReady) {
        console.warn('⚠️ Reading progress update skipped - user not ready');
        return;
      }

      try {
        const clampedProgress = Math.max(0, Math.min(100, newProgress));
        if (clampedProgress > progress) {
          setProgress(clampedProgress);
          storageRef.current.updateReadingProgress(courseId, moduleId, clampedProgress);
          onProgressUpdate?.(clampedProgress);
          console.log(`📖 Reading progress updated: ${clampedProgress}%`);
        }
      } catch (error) {
        console.error('❌ Error updating reading progress:', error);
      }
    },
    [courseId, moduleId, progress, userId, isUserReady, onProgressUpdate]
  );

  return { progress, updateProgress };
};

// FIXED: Time tracking hook with proper user ID handling
export const useTimeTracking = (courseId: number, moduleId: number, isActive: boolean = true) => {
  const [timeSpent, setTimeSpent] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isUserReady, setIsUserReady] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const storageRef = useRef<ProgressStorageService | null>(null);

  // FIXED: Initialize user ID with persistence
  useEffect(() => {
    const getUserId = async () => {
      try {
        const userIdFromAuth = await getCurrentUserId();
        if (userIdFromAuth) {
          setUserId(userIdFromAuth);
          storageRef.current = useProgressStorage(userIdFromAuth);
          setIsUserReady(true);
          console.log(`⏱️ Time tracking initialized for user: ${userIdFromAuth.slice(0, 20)}...`);
        }
      } catch (error) {
        console.error('❌ Error initializing time tracking user:', error);
      }
    };

    getUserId();
  }, []);

  // Load existing time spent
  useEffect(() => {
    if (storageRef.current && userId && isUserReady) {
      try {
        const courseProgress = storageRef.current.getCourseProgress(courseId);
        const moduleProgress = courseProgress?.moduleProgresses[moduleId];
        if (moduleProgress) {
          setTimeSpent(moduleProgress.timeSpent);
        }
      } catch (error) {
        console.error('❌ Error loading time spent:', error);
      }
    }
  }, [courseId, moduleId, userId, isUserReady]);

  // Time tracking logic
  useEffect(() => {
    if (!isActive || !userId || !isUserReady) return;

    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      if (storageRef.current) {
        try {
          const sessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
          if (sessionTime >= 30) {
            storageRef.current.addTimeSpent(courseId, moduleId, sessionTime);
            setTimeSpent((prev) => prev + sessionTime);
            startTimeRef.current = Date.now();
            console.log(`⏱️ Time tracked: ${sessionTime}s`);
          }
        } catch (error) {
          console.error('❌ Error in time tracking interval:', error);
        }
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      if (storageRef.current) {
        try {
          const sessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
          if (sessionTime > 0) {
            storageRef.current.addTimeSpent(courseId, moduleId, sessionTime);
            setTimeSpent((prev) => prev + sessionTime);
            console.log(`⏱️ Final time save: ${sessionTime}s`);
          }
        } catch (error) {
          console.error('❌ Error in final time save:', error);
        }
      }
    };
  }, [courseId, moduleId, isActive, userId, isUserReady]);

  return { timeSpent };
};

// FIXED: Statistics hook with proper user ID handling
export const useProgressStatistics = (courseId?: number) => {
  const [statistics, setStatistics] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isUserReady, setIsUserReady] = useState(false);
  const storageRef = useRef<ProgressStorageService | null>(null);

  // FIXED: Initialize user ID with persistence
  useEffect(() => {
    const getUserId = async () => {
      try {
        const userIdFromAuth = await getCurrentUserId();
        if (userIdFromAuth) {
          setUserId(userIdFromAuth);
          storageRef.current = useProgressStorage(userIdFromAuth);
          setIsUserReady(true);
          console.log(`📊 Statistics initialized for user: ${userIdFromAuth.slice(0, 20)}...`);
        }
      } catch (error) {
        console.error('❌ Error initializing statistics user:', error);
      }
    };

    getUserId();
  }, []);

  const refreshStatistics = useCallback(() => {
    if (storageRef.current && userId && isUserReady) {
      try {
        if (courseId) {
          const courseStats = storageRef.current.getCourseStatistics(courseId);
          setStatistics(courseStats);
        } else {
          const globalStats = storageRef.current.getLearningStatistics();
          setStatistics(globalStats);
        }
      } catch (error) {
        console.error('❌ Error refreshing statistics:', error);
      }
    }
  }, [courseId, userId, isUserReady]);

  useEffect(() => {
    if (userId && storageRef.current && isUserReady) {
      refreshStatistics();
    }
  }, [refreshStatistics, userId, isUserReady]);

  return { statistics, refreshStatistics };
};

export default useLearningProgress;
