// services/learningService.ts
import { useState, useEffect, useCallback } from 'react';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from 'declarations/eduverse_backend/eduverse_backend.did';
import type {
  CourseMaterial,
  Module,
  UserProgress,
  QuizResult,
  CourseInfo,
  Enrollment,
} from 'declarations/eduverse_backend/eduverse_backend.did';

// Helper to convert BigInt to string recursively
const convertBigIntToString = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }

  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted;
  }

  return obj;
};

// Helper to convert number to BigInt
const toBigInt = (value: number): bigint => {
  return BigInt(value);
};

// Progress tracking interface
export interface ModuleProgress {
  moduleId: number;
  isCompleted: boolean;
  completedAt?: number;
  readingProgress: number;
  timeSpent: number;
}

// Learning session interface (frontend only for now)
export interface LearningSession {
  courseId: number;
  moduleId: number;
  startTime: number;
  endTime?: number;
  progress: number;
}

export class LearningService {
  constructor(private actor: ActorSubclass<_SERVICE>) {}

  // Course Enrollment Methods
  async enrollInCourse(courseId: number) {
    try {
      const result = await this.actor.enrollCourse(toBigInt(courseId));
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  }

  async checkEnrollmentStatus(courseId: number): Promise<boolean> {
    try {
      const enrollments = await this.actor.getMyEnrollments();
      const convertedEnrollments = convertBigIntToString(enrollments);
      return convertedEnrollments.some(
        (enrollment: any) => Number(enrollment.courseId) === courseId
      );
    } catch (error) {
      console.error('Error checking enrollment status:', error);
      throw error;
    }
  }

  async getUserEnrollments() {
    try {
      const result = await this.actor.getMyEnrollments();
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      throw error;
    }
  }

  // Course Content Methods
  async getCourseInfo(courseId: number) {
    try {
      const result = await this.actor.getCourseById(toBigInt(courseId));
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error fetching course info:', error);
      throw error;
    }
  }

  async getCourseMaterials(courseId: number) {
    try {
      const result = await this.actor.getCourseMaterials(toBigInt(courseId));
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error fetching course materials:', error);
      throw error;
    }
  }

  async getModule(courseId: number, moduleId: number) {
    try {
      const result = await this.actor.getModule(toBigInt(courseId), toBigInt(moduleId));
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error fetching module:', error);
      throw error;
    }
  }

  async getAllModules(courseId: number) {
    try {
      const materials = await this.getCourseMaterials(courseId);
      if ('ok' in materials) {
        return materials.ok.modules || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching all modules:', error);
      throw error;
    }
  }

  // Progress Tracking Methods
  async getUserProgress(courseId: number) {
    try {
      const result = await this.actor.getMyProgress(toBigInt(courseId));
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  }

  async getCompletedModules(courseId: number): Promise<number[]> {
    try {
      const progress = await this.getUserProgress(courseId);
      if (progress && progress.completedModules) {
        return progress.completedModules.map((id: any) => Number(id));
      }
      return [];
    } catch (error) {
      console.error('Error fetching completed modules:', error);
      return [];
    }
  }

  // Frontend-only progress tracking (until backend methods are implemented)
  private learningSessionStorage = new Map<string, LearningSession>();

  startLearningSession(courseId: number, moduleId: number) {
    const sessionKey = `${courseId}_${moduleId}`;
    const session: LearningSession = {
      courseId,
      moduleId,
      startTime: Date.now(),
      progress: 0,
    };
    this.learningSessionStorage.set(sessionKey, session);
    return Promise.resolve({ ok: 'Learning session started' });
  }

  endLearningSession(courseId: number, moduleId: number, progress: number) {
    const sessionKey = `${courseId}_${moduleId}`;
    const session = this.learningSessionStorage.get(sessionKey);
    if (session) {
      session.endTime = Date.now();
      session.progress = progress;
      this.learningSessionStorage.set(sessionKey, session);
    }
    return Promise.resolve({ ok: 'Learning session ended' });
  }

  getLearningSession(courseId: number, moduleId: number): LearningSession | null {
    const sessionKey = `${courseId}_${moduleId}`;
    return this.learningSessionStorage.get(sessionKey) || null;
  }

  // Quiz Methods
  async getQuiz(courseId: number, moduleId: number) {
    try {
      const result = await this.actor.getQuiz(toBigInt(courseId), toBigInt(moduleId));
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  }

  async submitQuiz(
    courseId: number,
    moduleId: number,
    answers: { questionId: number; selectedAnswer: number }[]
  ) {
    try {
      // Convert answers to the correct format expected by backend
      const formattedAnswers = answers.map((answer) => ({
        questionId: toBigInt(answer.questionId),
        selectedAnswer: toBigInt(answer.selectedAnswer),
      }));

      const result = await this.actor.submitQuiz(
        toBigInt(courseId),
        toBigInt(moduleId),
        formattedAnswers
      );
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    }
  }

  async getAllModuleQuizzes(courseId: number) {
    try {
      const materials = await this.getCourseMaterials(courseId);
      if ('ok' in materials && materials.ok.modules) {
        const quizPromises = materials.ok.modules.map(async (module: any) => {
          try {
            const quizResult = await this.getQuiz(courseId, Number(module.moduleId));
            return {
              moduleId: Number(module.moduleId),
              available: 'ok' in quizResult,
              quiz: 'ok' in quizResult ? quizResult.ok : null,
            };
          } catch (error) {
            return {
              moduleId: Number(module.moduleId),
              available: false,
              quiz: null,
            };
          }
        });

        const quizAvailability = await Promise.all(quizPromises);
        return quizAvailability;
      }
      return [];
    } catch (error) {
      console.error('Error fetching all module quizzes:', error);
      throw error;
    }
  }

  async getUserQuizResults(courseId: number) {
    try {
      const result = await this.actor.getMyQuizResults(toBigInt(courseId));
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      throw error;
    }
  }

  async getQuizResultByModule(courseId: number, moduleId: number) {
    try {
      const allResults = await this.getUserQuizResults(courseId);
      return allResults.find((result: any) => Number(result.moduleId) === moduleId) || null;
    } catch (error) {
      console.error('Error fetching quiz result by module:', error);
      return null;
    }
  }

  async hasPassedQuiz(courseId: number, moduleId: number): Promise<boolean> {
    try {
      const result = await this.getQuizResultByModule(courseId, moduleId);
      return result ? result.passed : false;
    } catch (error) {
      console.error('Error checking quiz pass status:', error);
      return false;
    }
  }

  async getQuizScore(courseId: number, moduleId: number): Promise<number> {
    try {
      const result = await this.getQuizResultByModule(courseId, moduleId);
      return result ? Number(result.score) : 0;
    } catch (error) {
      console.error('Error getting quiz score:', error);
      return 0;
    }
  }

  // Enhanced Progress Methods
  async getModuleProgress(courseId: number): Promise<
    {
      moduleId: number;
      isCompleted: boolean;
      hasQuiz: boolean;
      quizPassed: boolean;
      quizScore?: number;
    }[]
  > {
    try {
      const materials = await this.getCourseMaterials(courseId);
      const completedModules = await this.getCompletedModules(courseId);
      const quizResults = await this.getUserQuizResults(courseId);

      if ('ok' in materials && materials.ok.modules) {
        const moduleProgress = await Promise.all(
          materials.ok.modules.map(async (module: any) => {
            const moduleId = Number(module.moduleId);
            const isCompleted = completedModules.includes(moduleId);

            // Check if quiz exists for this module
            let hasQuiz = false;
            let quizPassed = false;
            let quizScore = undefined;

            try {
              const quizResult = await this.getQuiz(courseId, moduleId);
              hasQuiz = 'ok' in quizResult;

              if (hasQuiz) {
                const moduleQuizResult = quizResults.find(
                  (r: any) => Number(r.moduleId) === moduleId
                );
                if (moduleQuizResult) {
                  quizPassed = moduleQuizResult.passed;
                  quizScore = Number(moduleQuizResult.score);
                }
              }
            } catch (error) {
              // Quiz doesn't exist for this module
            }

            return {
              moduleId,
              isCompleted,
              hasQuiz,
              quizPassed,
              quizScore,
            };
          })
        );

        return moduleProgress;
      }

      return [];
    } catch (error) {
      console.error('Error getting module progress:', error);
      return [];
    }
  }

  async getCourseCompletionStatus(courseId: number): Promise<{
    isCompleted: boolean;
    modulesCompleted: number;
    totalModules: number;
    quizzesCompleted: number;
    totalQuizzes: number;
    overallProgress: number;
    canGetCertificate: boolean;
  }> {
    try {
      const materials = await this.getCourseMaterials(courseId);
      const moduleProgress = await this.getModuleProgress(courseId);
      const certificates = await this.getUserCertificates();

      const totalModules = 'ok' in materials ? materials.ok.modules.length : 0;
      const modulesCompleted = moduleProgress.filter((mp) => mp.isCompleted).length;
      const totalQuizzes = moduleProgress.filter((mp) => mp.hasQuiz).length;
      const quizzesCompleted = moduleProgress.filter((mp) => mp.quizPassed).length;

      const overallProgress = totalModules > 0 ? (modulesCompleted / totalModules) * 100 : 0;
      const isCompleted = modulesCompleted === totalModules && quizzesCompleted === totalQuizzes;
      const hasCertificate = certificates.some((cert: any) => Number(cert.courseId) === courseId);

      return {
        isCompleted,
        modulesCompleted,
        totalModules,
        quizzesCompleted,
        totalQuizzes,
        overallProgress,
        canGetCertificate: isCompleted && !hasCertificate,
      };
    } catch (error) {
      console.error('Error getting course completion status:', error);
      return {
        isCompleted: false,
        modulesCompleted: 0,
        totalModules: 0,
        quizzesCompleted: 0,
        totalQuizzes: 0,
        overallProgress: 0,
        canGetCertificate: false,
      };
    }
  }

  async canTakeFinalQuiz(courseId: number): Promise<boolean> {
    try {
      const moduleProgress = await this.getModuleProgress(courseId);

      // Check if all modules are completed
      const allModulesCompleted = moduleProgress.every((mp) => mp.isCompleted);

      // Check if all module quizzes are passed (if they exist)
      const allRequiredQuizzesPassed = moduleProgress.every((mp) => !mp.hasQuiz || mp.quizPassed);

      return allModulesCompleted && allRequiredQuizzesPassed;
    } catch (error) {
      console.error('Error checking final quiz eligibility:', error);
      return false;
    }
  }

  // Custom hooks for quiz functionality
  useQuizAvailability = (learningService: LearningService | null, courseId: number) => {
    const [quizAvailability, setQuizAvailability] = useState<{ [moduleId: number]: boolean }>({});
    const [loading, setLoading] = useState(true);

    const fetchQuizAvailability = useCallback(async () => {
      if (!learningService) return;

      try {
        setLoading(true);
        const quizzes = await learningService.getAllModuleQuizzes(courseId);
        const availability = quizzes.reduce(
          (acc, quiz) => {
            acc[quiz.moduleId] = quiz.available;
            return acc;
          },
          {} as { [moduleId: number]: boolean }
        );

        setQuizAvailability(availability);
      } catch (error) {
        console.error('Error fetching quiz availability:', error);
      } finally {
        setLoading(false);
      }
    }, [learningService, courseId]);

    useEffect(() => {
      fetchQuizAvailability();
    }, [fetchQuizAvailability]);

    return {
      quizAvailability,
      loading,
      refetch: fetchQuizAvailability,
      hasQuiz: (moduleId: number) => quizAvailability[moduleId] || false,
    };
  };

  useModuleProgress = (learningService: LearningService | null, courseId: number) => {
    const [moduleProgress, setModuleProgress] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchModuleProgress = useCallback(async () => {
      if (!learningService) return;

      try {
        setLoading(true);
        const progress = await learningService.getModuleProgress(courseId);
        setModuleProgress(progress);
      } catch (error) {
        console.error('Error fetching module progress:', error);
      } finally {
        setLoading(false);
      }
    }, [learningService, courseId]);

    useEffect(() => {
      fetchModuleProgress();
    }, [fetchModuleProgress]);

    return {
      moduleProgress,
      loading,
      refetch: fetchModuleProgress,
      getModuleProgress: (moduleId: number) =>
        moduleProgress.find((mp) => mp.moduleId === moduleId),
    };
  };

  // Certificate Methods
  async getUserCertificates() {
    try {
      const result = await this.actor.getMyCertificates();
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      throw error;
    }
  }

  async getCertificate(tokenId: number) {
    try {
      const result = await this.actor.getCertificate(toBigInt(tokenId));
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error fetching certificate:', error);
      throw error;
    }
  }

  // Utility Methods
  async calculateOverallProgress(courseId: number): Promise<number> {
    try {
      const progress = await this.getUserProgress(courseId);
      if (progress && typeof progress.overallProgress === 'number') {
        return progress.overallProgress;
      }

      // Fallback calculation
      const materials = await this.getCourseMaterials(courseId);
      const completedModules = await this.getCompletedModules(courseId);

      if ('ok' in materials && materials.ok.modules) {
        const totalModules = materials.ok.modules.length;
        if (totalModules === 0) return 0;

        return (completedModules.length / totalModules) * 100;
      }

      return 0;
    } catch (error) {
      console.error('Error calculating progress:', error);
      return 0;
    }
  }

  async isModuleCompleted(courseId: number, moduleId: number): Promise<boolean> {
    try {
      const completedModules = await this.getCompletedModules(courseId);
      return completedModules.includes(moduleId);
    } catch (error) {
      console.error('Error checking module completion:', error);
      return false;
    }
  }

  async isCourseCompleted(courseId: number): Promise<boolean> {
    try {
      const progress = await this.calculateOverallProgress(courseId);
      return progress >= 100;
    } catch (error) {
      console.error('Error checking course completion:', error);
      return false;
    }
  }

  async getNextModule(courseId: number, currentModuleIndex: number): Promise<Module | null> {
    try {
      const materials = await this.getCourseMaterials(courseId);
      if ('ok' in materials && materials.ok.modules) {
        const modules = materials.ok.modules;
        if (currentModuleIndex < modules.length - 1) {
          return modules[currentModuleIndex + 1];
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting next module:', error);
      return null;
    }
  }

  async getPreviousModule(courseId: number, currentModuleIndex: number): Promise<Module | null> {
    try {
      const materials = await this.getCourseMaterials(courseId);
      if ('ok' in materials && materials.ok.modules) {
        const modules = materials.ok.modules;
        if (currentModuleIndex > 0) {
          return modules[currentModuleIndex - 1];
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting previous module:', error);
      return null;
    }
  }

  // Frontend-only features (until backend implementation)
  private bookmarksStorage = new Set<string>();
  private notesStorage = new Map<string, { note: string; createdAt: number }>();

  bookmarkModule(courseId: number, moduleId: number) {
    const bookmarkKey = `${courseId}_${moduleId}`;
    this.bookmarksStorage.add(bookmarkKey);
    return Promise.resolve({ ok: 'Module bookmarked' });
  }

  removeBookmark(courseId: number, moduleId: number) {
    const bookmarkKey = `${courseId}_${moduleId}`;
    this.bookmarksStorage.delete(bookmarkKey);
    return Promise.resolve({ ok: 'Bookmark removed' });
  }

  getUserBookmarks(): Promise<{ courseId: number; moduleId: number }[]> {
    const bookmarks = Array.from(this.bookmarksStorage).map((key) => {
      const [courseId, moduleId] = key.split('_').map(Number);
      return { courseId, moduleId };
    });
    return Promise.resolve(bookmarks);
  }

  saveNote(courseId: number, moduleId: number, note: string) {
    const noteKey = `${courseId}_${moduleId}`;
    this.notesStorage.set(noteKey, { note, createdAt: Date.now() });
    return Promise.resolve({ ok: 'Note saved' });
  }

  getUserNotes(courseId: number): Promise<{ moduleId: number; note: string; createdAt: number }[]> {
    const notes = Array.from(this.notesStorage.entries())
      .filter(([key]) => key.startsWith(`${courseId}_`))
      .map(([key, noteData]) => {
        const moduleId = Number(key.split('_')[1]);
        return { moduleId, ...noteData };
      });
    return Promise.resolve(notes);
  }

  deleteNote(courseId: number, moduleId: number) {
    const noteKey = `${courseId}_${moduleId}`;
    this.notesStorage.delete(noteKey);
    return Promise.resolve({ ok: 'Note deleted' });
  }

  // Course Analytics
  async getCourseStats(courseId: number) {
    try {
      const result = await this.actor.getCourseStats(toBigInt(courseId));
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error fetching course stats:', error);
      throw error;
    }
  }
}

// Hook untuk menggunakan learning service
export const useLearningService = (actor: ActorSubclass<_SERVICE> | null) => {
  if (!actor) return null;
  return new LearningService(actor);
};

// Custom hooks for specific learning functionalities
export const useCourseProgress = (learningService: LearningService | null, courseId: number) => {
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!learningService) return;

    try {
      setLoading(true);
      const progressData = await learningService.calculateOverallProgress(courseId);
      setProgress(progressData);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  }, [learningService, courseId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return { progress, loading, refetch: fetchProgress };
};

export const useModuleCompletion = (learningService: LearningService | null, courseId: number) => {
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletedModules = useCallback(async () => {
    if (!learningService) return;

    try {
      setLoading(true);
      const completed = await learningService.getCompletedModules(courseId);
      setCompletedModules(completed);
    } catch (error) {
      console.error('Error fetching completed modules:', error);
    } finally {
      setLoading(false);
    }
  }, [learningService, courseId]);

  useEffect(() => {
    fetchCompletedModules();
  }, [fetchCompletedModules]);

  // Module completion is handled through quiz submission in the backend
  const completeModule = useCallback(
    async (moduleId: number) => {
      // This will be completed when the user passes the quiz for this module
      // For now, we can just refetch the completed modules
      await fetchCompletedModules();
    },
    [fetchCompletedModules]
  );

  return {
    completedModules,
    loading,
    completeModule,
    refetch: fetchCompletedModules,
    isModuleCompleted: (moduleId: number) => completedModules.includes(moduleId),
  };
};

// Hook for learning sessions
export const useLearningSession = (
  learningService: LearningService | null,
  courseId: number,
  moduleId: number
) => {
  const [session, setSession] = useState<LearningSession | null>(null);
  const [isActive, setIsActive] = useState(false);

  const startSession = useCallback(() => {
    if (!learningService) return;

    learningService.startLearningSession(courseId, moduleId);
    const newSession = learningService.getLearningSession(courseId, moduleId);
    setSession(newSession);
    setIsActive(true);
  }, [learningService, courseId, moduleId]);

  const endSession = useCallback(
    (progress: number) => {
      if (!learningService) return;

      learningService.endLearningSession(courseId, moduleId, progress);
      const updatedSession = learningService.getLearningSession(courseId, moduleId);
      setSession(updatedSession);
      setIsActive(false);
    },
    [learningService, courseId, moduleId]
  );

  useEffect(() => {
    if (learningService) {
      const existingSession = learningService.getLearningSession(courseId, moduleId);
      setSession(existingSession);
      setIsActive(existingSession ? !existingSession.endTime : false);
    }
  }, [learningService, courseId, moduleId]);

  return {
    session,
    isActive,
    startSession,
    endSession,
  };
};
