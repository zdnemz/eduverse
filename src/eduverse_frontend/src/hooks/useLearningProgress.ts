// hooks/useLearningProgress.ts
// React hooks for managing learning progress with offline support and real-time updates

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  ProgressStorageService,
  CourseProgress,
  LearningProgress,
} from '../services/progressStorage';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from 'declarations/eduverse_backend/eduverse_backend.did';

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
  userId?: string
): [LearningProgressState, LearningProgressActions] => {
  // Storage service
  const storageRef = useRef<ProgressStorageService>();
  if (!storageRef.current) {
    storageRef.current = new ProgressStorageService(userId);
  }
  const storage = storageRef.current;

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
    statistics: null,
  });

  // Refs for tracking
  const sessionStartTime = useRef<number>(Date.now());
  const lastSyncTimeRef = useRef<number>(0);
  const autoSyncInterval = useRef<number | null>(null);

  // Initialize progress data
  const initializeProgress = useCallback(async () => {
    if (!courseMaterial || !courseId) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Get existing progress
      let courseProgress = storage.getCourseProgress(courseId);

      // Create new progress if none exists
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
        storage.saveCourseProgress(courseProgress);
      } else {
        // Update total modules if course structure changed
        if (
          courseMaterial.modules &&
          courseProgress.totalModules !== courseMaterial.modules.length
        ) {
          courseProgress.totalModules = courseMaterial.modules.length;
          storage.saveCourseProgress(courseProgress);
        }
      }

      // Get current module
      const currentModule = courseMaterial.modules?.[courseProgress.currentModuleIndex] || null;
      const currentModuleProgress = courseProgress.moduleProgresses[currentModule?.moduleId];

      // Extract completed modules
      const completedModules = Object.values(courseProgress.moduleProgresses)
        .filter((p) => p.isCompleted)
        .map((p) => p.moduleId);

      // Get statistics
      const statistics = storage.getCourseStatistics(courseId);

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
      }));

      // Show restored progress message if significant time passed
      if (courseProgress.lastAccessedAt && Date.now() - courseProgress.lastAccessedAt > 300000) {
        // 5 minutes
        const lastAccessed = new Date(courseProgress.lastAccessedAt).toLocaleString();
        toast.success(`Welcome back! Progress restored from ${lastAccessed}`, {
          description: `You're at Module ${courseProgress.currentModuleIndex + 1} with ${Math.round(courseProgress.overallProgress)}% complete`,
        });
      }
    } catch (error) {
      console.error('Error initializing progress:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
      toast.error('Failed to load learning progress');
    }
  }, [courseId, courseMaterial, storage]);

  // Auto-save progress periodically
  const autoSaveProgress = useCallback(() => {
    if (!state.currentModule || state.isLoading) return;

    const sessionTime = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    if (sessionTime > 30) {
      // Only save if session is longer than 30 seconds
      storage.addTimeSpent(courseId, state.currentModule.moduleId, sessionTime);
      sessionStartTime.current = Date.now();

      // Update state silently
      setState((prev) => ({
        ...prev,
        timeSpent: prev.timeSpent + sessionTime,
      }));
    }
  }, [courseId, state.currentModule, state.isLoading, storage]);

  // Setup auto-save interval
  useEffect(() => {
    const interval = setInterval(autoSaveProgress, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [autoSaveProgress]);

  // Initialize on mount
  useEffect(() => {
    initializeProgress();
  }, [initializeProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Save final session time
      if (state.currentModule && !state.isLoading) {
        const sessionTime = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        if (sessionTime > 0) {
          storage.addTimeSpent(courseId, state.currentModule.moduleId, sessionTime);
        }
      }

      // Clear intervals
      if (autoSyncInterval.current) {
        clearInterval(autoSyncInterval.current);
      }
    };
  }, [courseId, state.currentModule, state.isLoading, storage]);

  // ===== ACTIONS =====

  const goToModule = useCallback(
    (index: number) => {
      if (!courseMaterial?.modules || index < 0 || index >= courseMaterial.modules.length) return;

      const module = courseMaterial.modules[index];
      const moduleProgress = state.courseProgress?.moduleProgresses[module.moduleId];

      // Save current session time before switching
      if (state.currentModule) {
        const sessionTime = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        if (sessionTime > 0) {
          storage.addTimeSpent(courseId, state.currentModule.moduleId, sessionTime);
        }
      }

      // Update storage
      storage.setCurrentModule(courseId, index, courseMaterial.title);

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
    },
    [courseMaterial, state.currentModule, state.courseProgress, storage, courseId]
  );

  const goToNextModule = useCallback(() => {
    if (state.currentModuleIndex < (courseMaterial?.modules?.length || 0) - 1) {
      goToModule(state.currentModuleIndex + 1);
    }
  }, [state.currentModuleIndex, courseMaterial?.modules?.length, goToModule]);

  const goToPreviousModule = useCallback(() => {
    if (state.currentModuleIndex > 0) {
      goToModule(state.currentModuleIndex - 1);
    }
  }, [state.currentModuleIndex, goToModule]);

  const updateReadingProgress = useCallback(
    (progress: number) => {
      if (!state.currentModule) return;

      const clampedProgress = Math.max(0, Math.min(100, progress));

      // Only update if progress increased
      if (clampedProgress > state.readingProgress) {
        storage.updateReadingProgress(
          courseId,
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
      }
    },
    [
      state.currentModule,
      state.readingProgress,
      state.completedModules,
      storage,
      courseId,
      courseMaterial?.title,
    ]
  );

  const addTimeSpent = useCallback(
    (seconds: number) => {
      if (!state.currentModule || seconds <= 0) return;

      storage.addTimeSpent(courseId, state.currentModule.moduleId, seconds, courseMaterial?.title);

      setState((prev) => ({
        ...prev,
        timeSpent: prev.timeSpent + seconds,
      }));
    },
    [state.currentModule, storage, courseId, courseMaterial?.title]
  );

  const completeCurrentModule = useCallback(async (): Promise<boolean> => {
    if (!state.currentModule || state.completedModules.includes(state.currentModule.moduleId)) {
      return false;
    }

    try {
      const success = storage.completeModule(
        courseId,
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

        // Auto-advance to next module after delay
        if (state.currentModuleIndex < (courseMaterial?.modules?.length || 0) - 1) {
          setTimeout(() => {
            toast.info('Advancing to next module...', {
              description: 'You can always go back to review completed modules',
            });
            goToNextModule();
          }, 2000);
        }

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
      console.error('Error completing module:', error);
      toast.error('Failed to complete module');
      return false;
    }
  }, [
    state.currentModule,
    state.completedModules,
    state.currentModuleIndex,
    storage,
    courseId,
    courseMaterial,
    goToNextModule,
  ]);

  const toggleBookmark = useCallback(
    (moduleId?: number): boolean => {
      const targetModuleId = moduleId || state.currentModule?.moduleId;
      if (!targetModuleId) return false;

      try {
        const success = storage.toggleBookmark(courseId, targetModuleId, courseMaterial?.title);

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
          return isBookmarked;
        }

        return false;
      } catch (error) {
        console.error('Error toggling bookmark:', error);
        toast.error('Failed to toggle bookmark');
        return false;
      }
    },
    [state.currentModule, state.bookmarkedModules, storage, courseId, courseMaterial?.title]
  );

  const saveNote = useCallback(
    (note: string, moduleId?: number): boolean => {
      const targetModuleId = moduleId || state.currentModule?.moduleId;
      if (!targetModuleId) return false;

      try {
        const success = storage.saveNote(courseId, targetModuleId, note, courseMaterial?.title);

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
          return true;
        }

        return false;
      } catch (error) {
        console.error('Error saving note:', error);
        toast.error('Failed to save note');
        return false;
      }
    },
    [state.currentModule, storage, courseId, courseMaterial?.title]
  );

  const deleteNote = useCallback(
    (moduleId?: number): boolean => {
      return saveNote('', moduleId);
    },
    [saveNote]
  );

  const completeCourse = useCallback(
    async (certificateId?: number): Promise<boolean> => {
      try {
        const success = storage.completeCourse(courseId, certificateId);

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

          return true;
        }

        return false;
      } catch (error) {
        console.error('Error completing course:', error);
        toast.error('Failed to complete course');
        return false;
      }
    },
    [storage, courseId]
  );

  const syncWithBackend = useCallback(async (): Promise<boolean> => {
    if (!actor || state.isSyncing) return false;

    setState((prev) => ({ ...prev, isSyncing: true }));

    try {
      // Here you would implement actual backend sync
      // For now, just simulate sync
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: Date.now(),
      }));

      toast.success('Progress synced with server', { duration: 2000 });
      return true;
    } catch (error) {
      console.error('Error syncing with backend:', error);
      setState((prev) => ({ ...prev, isSyncing: false }));
      toast.error('Failed to sync with server');
      return false;
    }
  }, [actor, state.isSyncing]);

  const resetProgress = useCallback((): boolean => {
    try {
      const success = storage.clearAllProgress();

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
          statistics: null,
        });

        // Reinitialize
        initializeProgress();

        toast.success('Progress reset successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error resetting progress:', error);
      toast.error('Failed to reset progress');
      return false;
    }
  }, [storage, courseMaterial, initializeProgress]);

  const exportProgress = useCallback((): string => {
    return storage.exportProgress();
  }, [storage]);

  const refresh = useCallback(async (): Promise<void> => {
    await initializeProgress();
    toast.success('Progress refreshed');
  }, [initializeProgress]);

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

export const useReadingProgress = (
  courseId: number,
  moduleId: number,
  onProgressUpdate?: (progress: number) => void
) => {
  const [progress, setProgress] = useState(0);
  const storage = new ProgressStorageService();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Load initial progress
    const courseProgress = storage.getCourseProgress(courseId);
    const moduleProgress = courseProgress?.moduleProgresses[moduleId];
    if (moduleProgress) {
      setProgress(moduleProgress.readingProgress);
    }
  }, [courseId, moduleId, storage]);

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
        if (totalElements > 0) {
          const newProgress = Math.min(100, (elementsRef.current.size / totalElements) * 100);

          if (newProgress > progress) {
            setProgress(newProgress);
            storage.updateReadingProgress(courseId, moduleId, newProgress);
            onProgressUpdate?.(newProgress);
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
  }, [courseId, moduleId, progress, storage, onProgressUpdate]);

  const observeElement = useCallback((element: Element, index: number) => {
    if (observerRef.current) {
      element.setAttribute('data-progress-index', index.toString());
      observerRef.current.observe(element);
    }
  }, []);

  const updateProgress = useCallback(
    (newProgress: number) => {
      const clampedProgress = Math.max(0, Math.min(100, newProgress));
      if (clampedProgress > progress) {
        setProgress(clampedProgress);
        storage.updateReadingProgress(courseId, moduleId, clampedProgress);
        onProgressUpdate?.(clampedProgress);
      }
    },
    [courseId, moduleId, progress, storage, onProgressUpdate]
  );

  return {
    progress,
    updateProgress,
    observeElement,
  };
};

// ===== TIME TRACKING HOOK =====

export const useTimeTracking = (courseId: number, moduleId: number, isActive: boolean = true) => {
  const [timeSpent, setTimeSpent] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const storage = new ProgressStorageService();

  useEffect(() => {
    // Load initial time
    const courseProgress = storage.getCourseProgress(courseId);
    const moduleProgress = courseProgress?.moduleProgresses[moduleId];
    if (moduleProgress) {
      setTimeSpent(moduleProgress.timeSpent);
    }
  }, [courseId, moduleId, storage]);

  useEffect(() => {
    if (!isActive) return;

    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const sessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (sessionTime >= 30) {
        // Update every 30 seconds
        storage.addTimeSpent(courseId, moduleId, sessionTime);
        setTimeSpent((prev) => prev + sessionTime);
        startTimeRef.current = Date.now();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      // Save final session time
      const sessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (sessionTime > 0) {
        storage.addTimeSpent(courseId, moduleId, sessionTime);
        setTimeSpent((prev) => prev + sessionTime);
      }
    };
  }, [courseId, moduleId, isActive, storage]);

  return { timeSpent };
};

// ===== PROGRESS STATISTICS HOOK =====

export const useProgressStatistics = (courseId?: number) => {
  const [statistics, setStatistics] = useState<any>(null);
  const storage = new ProgressStorageService();

  const refreshStatistics = useCallback(() => {
    if (courseId) {
      const courseStats = storage.getCourseStatistics(courseId);
      setStatistics(courseStats);
    } else {
      const globalStats = storage.getLearningStatistics();
      setStatistics(globalStats);
    }
  }, [courseId, storage]);

  useEffect(() => {
    refreshStatistics();
  }, [refreshStatistics]);

  return {
    statistics,
    refreshStatistics,
  };
};
