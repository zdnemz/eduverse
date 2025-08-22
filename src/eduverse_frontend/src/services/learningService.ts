// services/learningService.ts
// Service untuk mengelola interaksi dengan backend learning system
// FIXED: Quiz submission error and data type handling

import { useState, useEffect, useCallback } from 'react';
import { ActorSubclass } from '@dfinity/agent';
import {
  _SERVICE,
  Certificate as BackendCertificate,
  CourseMaterial,
  Module,
  UserProgress,
  QuizResult,
  CourseInfo,
  Enrollment,
  CourseQuiz,
  QuizQuestion,
  CourseStats,
} from 'declarations/eduverse_backend/eduverse_backend.did';

// ===== UTILITY FUNCTIONS =====

// Helper untuk convert BigInt ke string secara rekursif
const convertBigIntToString = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigIntToString);

  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted;
  }

  return obj;
};

// Helper untuk convert number ke BigInt dengan validasi
const toBigInt = (value: number | undefined | null): bigint => {
  if (value === undefined || value === null || isNaN(value)) {
    throw new Error(`Invalid value for BigInt conversion: ${value}`);
  }
  return BigInt(value);
};

// Safe toBigInt untuk nilai opsional
const safeIntToBigInt = (value: number | undefined | null, fallback: number = 0): bigint => {
  try {
    if (value === undefined || value === null || isNaN(value)) {
      return BigInt(fallback);
    }
    return BigInt(value);
  } catch (error) {
    console.warn(`Failed to convert ${value} to BigInt, using fallback ${fallback}`);
    return BigInt(fallback);
  }
};

// ===== INTERFACES =====

// Interface untuk status completion dari backend
export interface BackendCompletionStatus {
  isEnrolled: boolean;
  totalModules: number;
  completedModules: number[];
  completedModulesCount: number;
  overallProgress: number;
  hasQuizResult: boolean;
  quizPassed: boolean;
  quizScore: number;
  canGetCertificate: boolean;
}

// Interface untuk status completion frontend
export interface CourseCompletionStatus {
  certificate: BackendCertificate | null;
  canGetCertificate: boolean;
  hasQuizPassed: boolean;
  isComplete: boolean;
}

// Enhanced interfaces untuk frontend
export interface EnhancedCourseQuiz
  extends Omit<CourseQuiz, 'courseId' | 'timeLimit' | 'passingScore' | 'questions'> {
  courseId: number;
  timeLimit: number;
  passingScore: number;
  questions: EnhancedQuizQuestion[];
  isFinalQuiz?: boolean;
}

export interface EnhancedQuizQuestion extends Omit<QuizQuestion, 'questionId' | 'correctAnswer'> {
  questionId: number;
  correctAnswer: number;
}

export interface EnhancedQuizResult extends Omit<QuizResult, 'courseId' | 'score' | 'completedAt'> {
  courseId: number;
  score: number;
  completedAt: number;
}

// FIXED: Enhanced answer interface untuk quiz submission
export interface QuizAnswer {
  questionId: number;
  selectedAnswer: number;
}

// ===== MAIN LEARNING SERVICE CLASS =====

export class LearningService {
  private actor: ActorSubclass<_SERVICE>;

  constructor(actor: ActorSubclass<_SERVICE>) {
    this.actor = actor;
  }

  // ===== USER MANAGEMENT =====

  async updateUser(name: string, email?: string): Promise<{ ok: string } | { err: string }> {
    try {
      const result = await this.actor.updateUser(name, email ? [email] : []);
      return convertBigIntToString(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error updating user:', errorMessage);
      return { err: 'Failed to update user' };
    }
  }

  async getMyProfile(): Promise<any> {
    try {
      const result = await this.actor.getMyProfile();
      return result ? convertBigIntToString(result) : null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting profile:', errorMessage);
      return null;
    }
  }

  // ===== COURSE MANAGEMENT =====

  async getCourses(): Promise<CourseInfo[]> {
    try {
      const result = await this.actor.getCourses();
      return convertBigIntToString(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting courses:', errorMessage);
      return [];
    }
  }

  async getCourseById(courseId: number): Promise<CourseInfo | null> {
    try {
      const result = await this.actor.getCourseById(toBigInt(courseId));
      return result ? convertBigIntToString(result) : null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting course by ID:', errorMessage);
      return null;
    }
  }

  async searchCourses(searchQuery: string): Promise<CourseInfo[]> {
    try {
      const result = await this.actor.searchCourses(searchQuery);
      return convertBigIntToString(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error searching courses:', errorMessage);
      return [];
    }
  }

  async getCoursesByCategory(category: string): Promise<CourseInfo[]> {
    try {
      const result = await this.actor.getCoursesByCategory(category);
      return convertBigIntToString(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting courses by category:', errorMessage);
      return [];
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const result = await this.actor.getCategories();
      return result || [];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting categories:', errorMessage);
      return [];
    }
  }

  // ===== ENROLLMENT MANAGEMENT =====

  async enrollCourse(courseId: number): Promise<{ ok: string } | { err: string }> {
    try {
      const result = await this.actor.enrollCourse(toBigInt(courseId));
      return convertBigIntToString(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error enrolling in course:', errorMessage);
      return { err: 'Failed to enroll in course' };
    }
  }

  async getMyEnrollments(): Promise<Enrollment[]> {
    try {
      const result = await this.actor.getMyEnrollments();
      return convertBigIntToString(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting enrollments:', errorMessage);
      return [];
    }
  }

  // ===== LEARNING MATERIALS =====

  async getCourseMaterials(courseId: number): Promise<{ ok: CourseMaterial } | { err: string }> {
    try {
      const result = await this.actor.getCourseMaterials(toBigInt(courseId));
      return convertBigIntToString(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting course materials:', errorMessage);
      return { err: 'Failed to get course materials' };
    }
  }

  async getModule(courseId: number, moduleId: number): Promise<{ ok: Module } | { err: string }> {
    try {
      const result = await this.actor.getModule(toBigInt(courseId), toBigInt(moduleId));
      return convertBigIntToString(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting module:', errorMessage);
      return { err: 'Failed to get module' };
    }
  }

  // ===== MODULE COMPLETION =====

  async completeModule(
    courseId: number,
    moduleId: number
  ): Promise<{ ok: string } | { err: string }> {
    try {
      console.log(`✅ Marking module ${moduleId} as completed in course ${courseId}`);
      const result = await this.actor.completeModule(toBigInt(courseId), toBigInt(moduleId));
      const convertedResult = convertBigIntToString(result);

      if ('ok' in convertedResult) {
        console.log(`✅ Module ${moduleId} marked as completed successfully`);
      } else {
        console.error(`❌ Failed to mark module ${moduleId} as completed:`, convertedResult.err);
      }

      return convertedResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error completing module:', errorMessage);
      return { err: 'Failed to complete module' };
    }
  }

  // ===== QUIZ MANAGEMENT =====

  async getQuiz(courseId: number): Promise<{ ok: EnhancedCourseQuiz } | { err: string }> {
    try {
      console.log(`🔍 Getting quiz for course: ${courseId}`);
      const result = await this.actor.getQuiz(toBigInt(courseId));
      const convertedResult = convertBigIntToString(result);

      if ('ok' in convertedResult) {
        console.log('✅ Quiz found for course:', courseId);
      } else {
        console.log('⚠️ No quiz found for course:', courseId);
      }

      return convertedResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error getting quiz:', errorMessage);
      return { err: `Failed to get quiz: ${errorMessage}` };
    }
  }

  // FIXED: Enhanced quiz submission with better error handling
  async submitQuiz(
    courseId: number,
    answers: QuizAnswer[] | any
  ): Promise<{ ok: EnhancedQuizResult } | { err: string }> {
    try {
      console.log('📤 Submitting quiz:', {
        courseId,
        answers,
        answersType: typeof answers,
        isArray: Array.isArray(answers),
      });

      // Validation
      if (!courseId || courseId <= 0) {
        throw new Error('Invalid courseId');
      }

      // FIXED: Normalize answers to array format
      let normalizedAnswers: QuizAnswer[] = [];

      if (Array.isArray(answers)) {
        normalizedAnswers = answers;
      } else if (answers && typeof answers === 'object') {
        // Handle case where answers might be an object or other format
        if (answers.answers && Array.isArray(answers.answers)) {
          normalizedAnswers = answers.answers;
        } else {
          // Try to convert object to array format
          const keys = Object.keys(answers);
          normalizedAnswers = keys
            .map((key) => ({
              questionId: parseInt(key),
              selectedAnswer: answers[key],
            }))
            .filter((answer) => !isNaN(answer.questionId) && answer.selectedAnswer !== undefined);
        }
      } else {
        throw new Error('Invalid answers format - must be array or object');
      }

      if (!normalizedAnswers || normalizedAnswers.length === 0) {
        throw new Error('No valid answers provided');
      }

      console.log('📤 Normalized answers:', normalizedAnswers);

      // Convert to backend format
      const convertedAnswers = normalizedAnswers.map((answer) => {
        if (
          !answer.questionId ||
          answer.selectedAnswer === undefined ||
          answer.selectedAnswer === null
        ) {
          throw new Error(`Invalid answer format: ${JSON.stringify(answer)}`);
        }

        return {
          questionId: toBigInt(answer.questionId),
          selectedAnswer: toBigInt(answer.selectedAnswer),
        };
      });

      console.log('📤 Converted answers for backend:', convertedAnswers);

      const result = await this.actor.submitQuiz(toBigInt(courseId), convertedAnswers);
      const convertedResult = convertBigIntToString(result);

      console.log('📤 Quiz submission result:', convertedResult);
      return convertedResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error submitting quiz:', errorMessage);
      return { err: `Failed to submit quiz: ${errorMessage}` };
    }
  }

  // Metode untuk final quiz (menggunakan quiz biasa)
  async getFinalQuiz(courseId: number): Promise<EnhancedCourseQuiz | null> {
    try {
      console.log(`🎯 Getting final quiz for course ${courseId}`);
      const quizResult = await this.getQuiz(courseId);

      if ('ok' in quizResult) {
        const quiz = quizResult.ok;
        quiz.isFinalQuiz = true;
        console.log('✅ Final quiz loaded:', quiz.title);
        return quiz;
      }

      console.log('❌ No final quiz found for course:', courseId);
      return null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error getting final quiz:', errorMessage);
      return null;
    }
  }

  async canTakeFinalQuiz(courseId: number): Promise<boolean> {
    try {
      console.log(`🔍 Checking if user can take final quiz for course ${courseId}`);
      const completionData = await this.getCourseCompletionStatus(courseId);

      if (!completionData) {
        console.log('❌ No completion data found');
        return false;
      }

      const canTake =
        completionData.completedModulesCount >= completionData.totalModules &&
        completionData.totalModules > 0;
      console.log(
        `🎯 Can take final quiz: ${canTake} (${completionData.completedModulesCount}/${completionData.totalModules} modules completed)`
      );

      return canTake;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error checking final quiz availability:', errorMessage);
      return false;
    }
  }

  // ===== PROGRESS TRACKING =====

  async getUserProgress(courseId: number): Promise<UserProgress | null> {
    try {
      console.log(`📊 Getting user progress for course ${courseId}`);
      const result = await this.actor.getMyProgress(toBigInt(courseId));

      if (!result) {
        console.log('📊 No progress found, returning null');
        return null;
      }

      const progress = convertBigIntToString(result);
      console.log('📊 Raw progress from backend:', JSON.stringify(progress, null, 2));
      return progress;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting user progress:', errorMessage);
      return null;
    }
  }

  async getCourseCompletionStatus(courseId: number): Promise<BackendCompletionStatus | null> {
    try {
      console.log(`📊 Getting completion status from backend for course ${courseId}`);
      const result = await this.actor.getCourseCompletionStatus(toBigInt(courseId));

      if (!result) {
        console.log('📊 No completion status found from backend');
        return null;
      }

      let status = convertBigIntToString(result);

      // Handle jika response adalah Array, ambil elemen pertama
      if (Array.isArray(status)) {
        console.log('🔧 Backend returned Array, extracting first element');
        if (status.length > 0) {
          status = status[0];
        } else {
          console.log('❌ Empty array from backend');
          return null;
        }
      }

      // Validasi field yang diperlukan
      const requiredFields = [
        'isEnrolled',
        'totalModules',
        'completedModules',
        'completedModulesCount',
        'overallProgress',
        'hasQuizResult',
        'quizPassed',
        'quizScore',
        'canGetCertificate',
      ];

      const missingFields = requiredFields.filter(
        (field) => status[field] === undefined || status[field] === null
      );

      if (missingFields.length > 0) {
        console.error('❌ Backend status missing fields:', missingFields);
        return await this.calculateFallbackStatus(courseId);
      }

      console.log('📊 Backend completion status valid:', status);
      return status;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error getting completion status:', errorMessage);
      return await this.calculateFallbackStatus(courseId);
    }
  }

  // Fallback calculation jika backend method tidak tersedia
  private async calculateFallbackStatus(courseId: number): Promise<BackendCompletionStatus | null> {
    try {
      console.log('🔄 Calculating fallback completion status...');

      const progress = await this.getUserProgress(courseId);
      if (!progress) return null;

      const materialsResult = await this.getCourseMaterials(courseId);
      let totalModules = 0;
      if ('ok' in materialsResult) {
        totalModules = materialsResult.ok.modules?.length || 0;
      }

      const quizResults = await this.getQuizResults(courseId);
      const hasQuizResult = quizResults.length > 0;
      const quizPassed = quizResults.some((r) => r.passed);
      const quizScore = quizResults.length > 0 ? Math.max(...quizResults.map((r) => r.score)) : 0;

      const completedModulesCount = progress.completedModules?.length || 0;
      const isComplete = completedModulesCount >= totalModules && totalModules > 0;
      const canGetCertificate = isComplete && quizPassed;

      const fallbackStatus: BackendCompletionStatus = {
        isEnrolled: true,
        totalModules,
        completedModules: (progress.completedModules || []).map((id) => Number(id)),
        completedModulesCount,
        overallProgress: Number(progress.overallProgress) || 0,
        hasQuizResult,
        quizPassed,
        quizScore,
        canGetCertificate,
      };

      console.log('📊 Fallback completion status calculated:', fallbackStatus);
      return fallbackStatus;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error calculating fallback completion status:', errorMessage);
      return null;
    }
  }

  async getQuizResults(courseId: number): Promise<EnhancedQuizResult[]> {
    try {
      const result = await this.actor.getMyQuizResults(toBigInt(courseId));
      return result ? [convertBigIntToString(result)].flat() : [];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting quiz results:', errorMessage);
      return [];
    }
  }

  // Simplified course completion check
  async checkCourseCompletion(courseId: number): Promise<CourseCompletionStatus> {
    try {
      console.log(`🎓 Checking course completion for Course: ${courseId}`);

      const completionData = await this.getCourseCompletionStatus(courseId);

      if (!completionData) {
        console.log('❌ No completion data - user not enrolled or course not found');
        return {
          certificate: null,
          canGetCertificate: false,
          hasQuizPassed: false,
          isComplete: false,
        };
      }

      const isComplete =
        completionData.completedModulesCount >= completionData.totalModules &&
        completionData.totalModules > 0;
      const hasQuizPassed = completionData.quizPassed;
      const canGetCertificate = completionData.canGetCertificate;

      console.log(
        `🏆 FINAL STATUS: Complete: ${isComplete}, Quiz Passed: ${hasQuizPassed}, Can Get Certificate: ${canGetCertificate}`
      );

      // Try to get existing certificate if eligible
      let certificate = null;
      if (canGetCertificate) {
        try {
          const certificates = await this.getUserCertificates();
          certificate = certificates?.find((cert) => Number(cert?.courseId) === courseId) || null;
        } catch (certError) {
          console.log('⚠️ Could not fetch certificates:', certError);
        }
      }

      return {
        certificate,
        canGetCertificate,
        hasQuizPassed,
        isComplete,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error checking course completion:', errorMessage);
      return {
        certificate: null,
        canGetCertificate: false,
        hasQuizPassed: false,
        isComplete: false,
      };
    }
  }

  // ===== CERTIFICATE MANAGEMENT =====

  async getUserCertificates(): Promise<BackendCertificate[]> {
    try {
      const result = await this.actor.getMyCertificates();
      return result ? convertBigIntToString(result) : [];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting user certificates:', errorMessage);
      return [];
    }
  }

  async getCertificate(tokenId: number): Promise<BackendCertificate | null> {
    try {
      const result = await this.actor.getCertificate(toBigInt(tokenId));
      return result ? convertBigIntToString(result) : null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting certificate:', errorMessage);
      return null;
    }
  }

  // ===== ANALYTICS =====

  async getCourseStats(courseId: number): Promise<CourseStats | null> {
    try {
      const result = await this.actor.getCourseStats(toBigInt(courseId));
      return result ? convertBigIntToString(result) : null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting course stats:', errorMessage);
      return null;
    }
  }
}

// ===== REACT HOOKS =====

// Hook untuk menggunakan learning service
export const useLearningService = (actor: ActorSubclass<_SERVICE> | null) => {
  if (!actor) return null;
  return new LearningService(actor);
};

// FIXED: Enhanced quiz manager hook with better submission handling
export const useQuizManager = (learningService: LearningService | null, courseId: number) => {
  const [currentQuiz, setCurrentQuiz] = useState<EnhancedCourseQuiz | null>(null);
  const [quizResults, setQuizResults] = useState<EnhancedQuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuiz = useCallback(async () => {
    if (!learningService) return null;

    try {
      setIsLoading(true);
      setError(null);
      console.log(`🔄 Loading quiz for course: ${courseId}`);

      const result = await learningService.getQuiz(courseId);

      if ('ok' in result) {
        setCurrentQuiz(result.ok);
        console.log('✅ Quiz loaded:', result.ok.title);
        return result.ok;
      } else {
        console.log('ℹ️ No quiz found for this course:', result.err);
        setCurrentQuiz(null);
        setError(result.err);
        return null;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error loading quiz:', errorMessage);
      setError('Failed to load quiz');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [learningService, courseId]);

  const loadFinalQuiz = useCallback(async () => {
    if (!learningService) return null;

    try {
      setIsLoading(true);
      setError(null);
      console.log('🎯 Loading final quiz...');

      const canTake = await learningService.canTakeFinalQuiz(courseId);
      if (!canTake) {
        setError('You must complete all modules before taking the final quiz');
        return null;
      }

      const quiz = await learningService.getFinalQuiz(courseId);
      setCurrentQuiz(quiz);

      if (quiz) {
        console.log('✅ Final quiz loaded:', quiz.title);
      } else {
        console.log('⚠️ No final quiz available');
        setError('No final quiz available for this course');
      }

      return quiz;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error loading final quiz:', errorMessage);
      setError('Failed to load final quiz');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [learningService, courseId]);

  // FIXED: Enhanced submit quiz with better type handling
  const submitQuiz = useCallback(
    async (answers: QuizAnswer[] | any) => {
      if (!learningService) return null;

      try {
        setIsLoading(true);
        setError(null);

        console.log('📤 Submitting quiz answers...', { answers, type: typeof answers });
        const result = await learningService.submitQuiz(courseId, answers);

        if ('ok' in result) {
          console.log('✅ Quiz submitted successfully:', result.ok);
          await refreshQuizResults();
          return result.ok;
        } else {
          console.error('❌ Quiz submission failed:', result.err);
          setError(result.err);
          return null;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Error submitting quiz:', errorMessage);
        setError(`Failed to submit quiz: ${errorMessage}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [learningService, courseId]
  );

  const refreshQuizResults = useCallback(async () => {
    if (!learningService) return;

    try {
      const results = await learningService.getQuizResults(courseId);
      setQuizResults(results);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error refreshing quiz results:', errorMessage);
    }
  }, [learningService, courseId]);

  useEffect(() => {
    refreshQuizResults();
  }, [refreshQuizResults]);

  return {
    currentQuiz,
    quizResults,
    isLoading,
    error,
    loadQuiz,
    loadFinalQuiz,
    submitQuiz,
    refreshQuizResults,
    clearCurrentQuiz: () => setCurrentQuiz(null),
    clearError: () => setError(null),
    isFinalQuiz: () => currentQuiz?.isFinalQuiz === true,
    getQuizResult: () => quizResults.find((result) => result.courseId === courseId) || null,
    hasPassedQuiz: () => {
      const result = quizResults.find((r) => r.courseId === courseId);
      return result ? result.passed : false;
    },
    getQuizScore: () => {
      const result = quizResults.find((r) => r.courseId === courseId);
      return result ? result.score : 0;
    },
  };
};

// Hook untuk module completion
export const useModuleCompletion = (learningService: LearningService | null) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const completeModule = useCallback(
    async (courseId: number, moduleId: number) => {
      if (!learningService) return { success: false, error: 'Service not available' };

      try {
        setIsCompleting(true);
        console.log(`🔄 Completing module ${moduleId} in course ${courseId}`);

        const result = await learningService.completeModule(courseId, moduleId);

        if ('ok' in result) {
          console.log(`✅ Module ${moduleId} completed successfully`);
          return { success: true, message: result.ok };
        } else {
          console.error(`❌ Failed to complete module ${moduleId}:`, result.err);
          return { success: false, error: result.err };
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Error completing module:', errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsCompleting(false);
      }
    },
    [learningService]
  );

  return { completeModule, isCompleting };
};

// Hook untuk course completion
export const useCourseCompletion = (learningService: LearningService | null, courseId: number) => {
  const [completionStatus, setCompletionStatus] = useState<CourseCompletionStatus | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendCompletionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCompletionStatus = useCallback(async () => {
    if (!learningService || !courseId) return;

    try {
      setIsLoading(true);

      const [backendData, frontendData] = await Promise.all([
        learningService.getCourseCompletionStatus(courseId),
        learningService.checkCourseCompletion(courseId),
      ]);

      setBackendStatus(backendData);
      setCompletionStatus(frontendData);

      console.log('🔄 Completion status refreshed:', { backendData, frontendData });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error refreshing completion status:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [learningService, courseId]);

  useEffect(() => {
    refreshCompletionStatus();
  }, [refreshCompletionStatus]);

  return {
    completionStatus,
    backendStatus,
    isLoading,
    refreshCompletionStatus,
    isComplete: completionStatus?.isComplete || false,
    canGetCertificate: completionStatus?.canGetCertificate || false,
    hasQuizPassed: completionStatus?.hasQuizPassed || false,
    certificate: completionStatus?.certificate || null,
    totalModules: backendStatus?.totalModules || 0,
    completedModulesCount: backendStatus?.completedModulesCount || 0,
    completedModules: backendStatus?.completedModules || [],
    overallProgress: backendStatus?.overallProgress || 0,
    quizScore: backendStatus?.quizScore || 0,
  };
};
