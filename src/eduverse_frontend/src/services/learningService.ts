// Enhanced LearningService.ts - FIXED TypeScript Errors

import { useState, useEffect, useCallback } from 'react';
import { ActorSubclass } from '@dfinity/agent';
import {
  _SERVICE,
  Certificate as BackendCertificate,
} from 'declarations/eduverse_backend/eduverse_backend.did';
import type {
  CourseMaterial,
  Module,
  UserProgress,
  QuizResult,
  CourseInfo,
  Enrollment,
  CourseQuiz,
  QuizQuestion,
  UserAnswer,
  QuizPreview,
  CourseStats,
} from 'declarations/eduverse_backend/eduverse_backend.did';

// Helper to convert BigInt to string recursively
const convertBigIntToString = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'bigint') {
    return Number(obj);
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

// Course completion status interface
export interface CourseCompletionStatus {
  certificate: BackendCertificate | null;
  canGetCertificate: boolean;
  hasQuizPassed: boolean;
  isComplete: boolean;
}

// Helper to convert number to BigInt - FIXED with validation
const toBigInt = (value: number | undefined | null): bigint => {
  if (value === undefined || value === null || isNaN(value)) {
    throw new Error(`Invalid value for BigInt conversion: ${value}`);
  }
  return BigInt(value);
};

// Safe toBigInt for optional values
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

// Frontend interface matching backend types
export interface EnhancedCourseQuiz
  extends Omit<CourseQuiz, 'courseId' | 'timeLimit' | 'passingScore' | 'questions'> {
  courseId: number;
  timeLimit: number;
  passingScore: number;
  questions: EnhancedQuizQuestion[];
  isFinalQuiz?: boolean; // NEW: Flag for final quiz
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

export interface EnhancedQuizPreview
  extends Omit<QuizPreview, 'courseId' | 'passingScore' | 'timeLimit' | 'totalQuestions'> {
  courseId: number;
  passingScore: number;
  timeLimit: number;
  totalQuestions: number;
}

// Main LearningService Class
export class LearningService {
  private actor: ActorSubclass<_SERVICE>;

  constructor(actor: ActorSubclass<_SERVICE>) {
    this.actor = actor;
  }

  // ===== USER FUNCTIONS =====

  /**
   * Update user profile
   */
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

  /**
   * Get my profile
   */
  async getMyProfile(): Promise<any> {
    try {
      const result = await this.actor.getMyProfile();
      return result ? convertBigIntToString(result) : null;
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting profile:', errorMessage);
      return null;
    }
  }

  // ===== COURSE FUNCTIONS =====

  /**
   * Get all courses
   */
  async getCourses(): Promise<CourseInfo[]> {
    try {
      const result = await this.actor.getCourses();
      return convertBigIntToString(result);
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting courses:', errorMessage);
      return [];
    }
  }

  /**
   * Get courses by category
   */
  async getCoursesByCategory(category: string): Promise<CourseInfo[]> {
    try {
      const result = await this.actor.getCoursesByCategory(category);
      return convertBigIntToString(result);
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting courses by category:', errorMessage);
      return [];
    }
  }

  /**
   * Search courses
   */
  async searchCourses(searchQuery: string): Promise<CourseInfo[]> {
    try {
      const result = await this.actor.searchCourses(searchQuery);
      return convertBigIntToString(result);
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error searching courses:', errorMessage);
      return [];
    }
  }

  /**
   * Get course by ID
   */
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

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const result = await this.actor.getCategories();
      return result || [];
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting categories:', errorMessage);
      return [];
    }
  }

  // ===== ENROLLMENT FUNCTIONS =====

  /**
   * Enroll in a course
   */
  async enrollCourse(courseId: number): Promise<{ ok: string } | { err: string }> {
    try {
      const result = await this.actor.enrollCourse(toBigInt(courseId));
      return convertBigIntToString(result);
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error enrolling in course:', errorMessage);
      return { err: 'Failed to enroll in course' };
    }
  }

  /**
   * Get my enrollments
   */
  async getMyEnrollments(): Promise<Enrollment[]> {
    try {
      const result = await this.actor.getMyEnrollments();
      return convertBigIntToString(result);
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting enrollments:', errorMessage);
      return [];
    }
  }

  // ===== LEARNING MATERIALS FUNCTIONS =====

  /**
   * Get course materials
   */
  async getCourseMaterials(courseId: number): Promise<{ ok: CourseMaterial } | { err: string }> {
    try {
      const result = await this.actor.getCourseMaterials(toBigInt(courseId));
      return convertBigIntToString(result);
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting course materials:', errorMessage);
      return { err: 'Failed to get course materials' };
    }
  }

  /**
   * Get specific module
   */
  async getModule(courseId: number, moduleId: number): Promise<{ ok: Module } | { err: string }> {
    try {
      const result = await this.actor.getModule(toBigInt(courseId), toBigInt(moduleId));
      return convertBigIntToString(result);
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting module:', errorMessage);
      return { err: 'Failed to get module' };
    }
  }

  // ===== QUIZ FUNCTIONS =====

  /**
   * Get quiz for specific module
   */
  async getQuiz(
    courseId: number,
    moduleId: number
  ): Promise<{ ok: EnhancedCourseQuiz } | { err: string }> {
    try {
      const result = await this.actor.getQuiz(toBigInt(courseId));
      return convertBigIntToString(result);
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting quiz:', errorMessage);
      return { err: 'Failed to get quiz' };
    }
  }

  /**
   * Submit quiz answers - ORIGINAL: For module quizzes
   */
  async submitQuiz(
    courseId: number,
    moduleId: number,
    answers: { questionId: number; selectedAnswer: number }[]
  ): Promise<{ ok: EnhancedQuizResult } | { err: string }> {
    try {
      console.log('📤 Submitting module quiz:', {
        courseId,
        moduleId,
        answersCount: answers.length,
      });

      // Validate inputs before conversion
      if (!courseId || courseId <= 0) {
        throw new Error('Invalid courseId');
      }
      if (!moduleId || moduleId <= 0) {
        throw new Error('Invalid moduleId');
      }
      if (!answers || answers.length === 0) {
        throw new Error('No answers provided');
      }

      const convertedAnswers = answers.map((answer) => ({
        questionId: toBigInt(answer.questionId),
        selectedAnswer: toBigInt(answer.selectedAnswer),
      }));

      const result = await this.actor.submitQuiz(
        toBigInt(courseId),
        convertedAnswers
      );

      return convertBigIntToString(result);
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error submitting quiz:', errorMessage);
      return { err: `Failed to submit quiz: ${errorMessage}` };
    }
  }

  /**
   * Submit final quiz - FIXED: Uses existing submitQuiz method since backend doesn't have submitFinalQuiz
   */
  async submitFinalQuiz(
    courseId: number,
    answers: { questionId: number; selectedAnswer: number }[]
  ): Promise<{ ok: EnhancedQuizResult } | { err: string }> {
    try {
      console.log('🎯 Submitting final quiz:', { courseId, answersCount: answers.length });

      // Validate inputs
      if (!courseId || courseId <= 0) {
        throw new Error('Invalid courseId');
      }
      if (!answers || answers.length === 0) {
        throw new Error('No answers provided');
      }

      // FIXED: Since backend doesn't have submitFinalQuiz, use submitQuiz with last module
      console.log('⚠️ Using submitQuiz method for final quiz (backend compatibility)');

      // Get the last module ID as fallback
      const materialsResult = await this.getCourseMaterials(courseId);
      let fallbackModuleId = 1; // Default fallback

      if ('ok' in materialsResult && materialsResult.ok.modules.length > 0) {
        const lastModule = materialsResult.ok.modules[materialsResult.ok.modules.length - 1];
        fallbackModuleId = Number(lastModule.moduleId);
      }

      return this.submitQuiz(courseId, fallbackModuleId, answers);
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error submitting final quiz:', errorMessage);
      return { err: `Failed to submit final quiz: ${errorMessage}` };
    }
  }

  /**
   * Get quiz preview
   */
  async getQuizPreview(courseId: number): Promise<EnhancedQuizPreview | null> {
    try {
      const result = await this.actor.getQuizPreview(toBigInt(courseId));
      return result ? convertBigIntToString(result) : null;
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting quiz preview:', errorMessage);
      return null;
    }
  }

  /**
   * Validate quiz answers
   */
  async validateAnswers(
    answers: { questionId: number; selectedAnswer: number }[],
    quizQuestions: EnhancedQuizQuestion[]
  ): Promise<{ ok: boolean } | { err: string }> {
    try {
      const convertedAnswers = answers.map((answer) => ({
        questionId: toBigInt(answer.questionId),
        selectedAnswer: toBigInt(answer.selectedAnswer),
      }));

      const convertedQuestions = quizQuestions.map((q) => ({
        ...q,
        questionId: toBigInt(q.questionId),
        correctAnswer: toBigInt(q.correctAnswer),
      }));

      const result = await this.actor.validateAnswers(convertedAnswers, convertedQuestions);
      return convertBigIntToString(result);
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error validating answers:', errorMessage);
      return { err: 'Failed to validate answers' };
    }
  }

  /**
   * Get quiz with validation
   */
  async getQuizWithValidation(
    courseId: number,
    moduleId: number
  ): Promise<{ ok: EnhancedQuizPreview } | { err: string }> {
    try {
      const result = await this.actor.getQuizWithValidation(toBigInt(courseId));
      return convertBigIntToString(result);
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting quiz with validation:', errorMessage);
      return { err: 'Failed to get quiz with validation' };
    }
  }

  // ===== PROGRESS TRACKING =====

  /**
   * Get user progress for a course
   */
  async getUserProgress(courseId: number): Promise<UserProgress | null> {
    try {
      const result = await this.actor.getMyProgress(toBigInt(courseId));
      return result ? convertBigIntToString(result) : null;
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting user progress:', errorMessage);
      return null;
    }
  }

  /**
   * Get quiz results for a course
   */
  async getQuizResults(courseId: number): Promise<EnhancedQuizResult[]> {
    try {
      const result = await this.actor.getMyBestQuizResult(toBigInt(courseId));
      return result ? convertBigIntToString(result) : [];
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting quiz results:', errorMessage);
      return [];
    }
  }

  // ===== CERTIFICATE FUNCTIONS =====

  /**
   * Get user certificates
   */
  async getUserCertificates(): Promise<BackendCertificate[]> {
    try {
      const result = await this.actor.getMyCertificates();
      return result ? convertBigIntToString(result) : [];
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting user certificates:', errorMessage);
      return [];
    }
  }

  /**
   * Get specific certificate by token ID
   */
  async getCertificate(tokenId: number): Promise<BackendCertificate | null> {
    try {
      const result = await this.actor.getCertificate(toBigInt(tokenId));
      return result ? convertBigIntToString(result) : null;
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting certificate:', errorMessage);
      return null;
    }
  }

  // ===== ANALYTICS FUNCTIONS =====

  /**
   * Get course statistics
   */
  async getCourseStats(courseId: number): Promise<CourseStats | null> {
    try {
      const result = await this.actor.getCourseStats(toBigInt(courseId));
      return result ? convertBigIntToString(result) : null;
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting course stats:', errorMessage);
      return null;
    }
  }

  // ===== ENHANCED FINAL QUIZ METHODS =====

  /**
   * Check if user can take final quiz
   */
  async canTakeFinalQuiz(courseId: number): Promise<boolean> {
    try {
      // Get user progress
      const progress = await this.getUserProgress(courseId);
      const materialsResult = await this.getCourseMaterials(courseId);

      if (!progress || !('ok' in materialsResult)) {
        return false;
      }

      const materials = materialsResult.ok;
      const totalModules = materials.modules.length;
      const completedModules = progress.completedModules.length;

      // Can take final quiz if all modules are completed
      return completedModules >= totalModules;
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error checking final quiz availability:', errorMessage);
      return false;
    }
  }

  /**
   * Get final quiz - FIXED: Uses existing getQuiz method since backend doesn't have getFinalQuiz
   */
  async getFinalQuiz(courseId: number): Promise<EnhancedCourseQuiz | null> {
    try {
      console.log(`🎯 Getting final quiz for course ${courseId}`);

      // FIXED: Since backend doesn't have getFinalQuiz method, use getQuiz with last module
      console.log('ℹ️ Using getQuiz method for final quiz (backend compatibility)');

      // Get quiz for last module (fallback)
      const materialsResult = await this.getCourseMaterials(courseId);

      if (!('ok' in materialsResult)) {
        console.log('❌ Could not get course materials');
        return null;
      }

      const materials = materialsResult.ok;
      if (materials.modules.length === 0) {
        console.log('⚠️ No modules found in course');
        return null;
      }

      // Get quiz for the last module
      const lastModule = materials.modules[materials.modules.length - 1];
      const quizResult = await this.getQuiz(courseId, Number(lastModule.moduleId));

      if ('ok' in quizResult) {
        const quiz = quizResult.ok;
        quiz.isFinalQuiz = true; // Mark as final quiz
        console.log('✅ Final quiz loaded from last module:', quiz.title);
        return quiz;
      }

      console.log('❌ No quiz found for last module');
      return null;
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error getting final quiz:', errorMessage);
      return null;
    }
  }

  /**
   * Check course completion status
   */
  async checkCourseCompletion(courseId: number): Promise<CourseCompletionStatus> {
    try {
      console.log(`🎓 Checking course completion for Course: ${courseId}`);

      // Check if all modules are completed
      const progress = await this.getUserProgress(courseId);
      const materialsResult = await this.getCourseMaterials(courseId);

      if (!('ok' in materialsResult) || !progress) {
        return {
          certificate: null,
          canGetCertificate: false,
          hasQuizPassed: false,
          isComplete: false,
        };
      }

      const materials = materialsResult.ok;
      const totalModules = materials.modules.length;
      const completedModules = progress.completedModules.length;
      const isComplete = completedModules >= totalModules;

      // Check if quiz is passed (if it exists)
      let hasQuizPassed = true; // Default to true if no quiz exists
      const quizResults = await this.getQuizResults(courseId);

      if (quizResults.length > 0) {
        // Check if the user has passed any quiz for this course
        hasQuizPassed = quizResults.some((result) => result.passed);
      }

      const canGetCertificate = isComplete && hasQuizPassed;

      // Try to get existing certificates and find one for this course
      let certificate = null;
      if (canGetCertificate) {
        try {
          const certificates = await this.getUserCertificates();
          certificate = certificates.find((cert) => Number(cert.courseId) === courseId) || null;
        } catch (error: unknown) {
          // FIXED: Explicit unknown type
          console.log('No certificate found yet');
        }
      }

      return {
        certificate,
        canGetCertificate,
        hasQuizPassed,
        isComplete,
      };
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
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
}

// Hook to use learning service
export const useLearningService = (actor: ActorSubclass<_SERVICE> | null) => {
  if (!actor) return null;
  return new LearningService(actor);
};

// ====== ENHANCED QUIZ HOOKS ======

/**
 * Hook for managing quiz state and operations - UPDATED for final quiz support
 */
export const useQuizManager = (learningService: LearningService | null, courseId: number) => {
  const [currentQuiz, setCurrentQuiz] = useState<EnhancedCourseQuiz | null>(null);
  const [quizResults, setQuizResults] = useState<EnhancedQuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load quiz for specific module
  const loadQuiz = useCallback(
    async (moduleId: number) => {
      if (!learningService) return null;

      try {
        setIsLoading(true);
        setError(null);
        console.log(`🔄 Loading quiz for Module: ${moduleId}`);

        const result = await learningService.getQuiz(courseId, moduleId);

        if ('ok' in result) {
          setCurrentQuiz(result.ok);
          console.log('✅ Quiz loaded:', result.ok.title);
          return result.ok;
        } else {
          console.log('ℹ️ No quiz found for this module:', result.err);
          setCurrentQuiz(null);
          return null;
        }
      } catch (error: unknown) {
        // FIXED: Explicit unknown type
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Error loading quiz:', errorMessage);
        setError('Failed to load quiz');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [learningService, courseId]
  );

  // Load final quiz
  const loadFinalQuiz = useCallback(async () => {
    if (!learningService) return null;

    try {
      setIsLoading(true);
      setError(null);
      console.log('🎯 Loading final quiz...');

      const quiz = await learningService.getFinalQuiz(courseId);
      setCurrentQuiz(quiz);

      if (quiz) {
        console.log('✅ Final quiz loaded:', quiz.title);
      } else {
        console.log('⚠️ No final quiz available');
      }

      return quiz;
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error loading final quiz:', errorMessage);
      setError('Failed to load final quiz');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [learningService, courseId]);

  // Submit quiz - UPDATED: Now handles both regular and final quiz
  const submitQuiz = useCallback(
    async (
      moduleId: number | undefined,
      answers: { questionId: number; selectedAnswer: number }[]
    ) => {
      if (!learningService) return null;

      try {
        setIsLoading(true);
        setError(null);

        // Determine if this is a final quiz submission
        const isFinalQuiz = currentQuiz?.isFinalQuiz || moduleId === undefined || moduleId === null;

        if (isFinalQuiz) {
          console.log('🎯 Submitting final quiz...');
          const result = await learningService.submitFinalQuiz(courseId, answers);

          if ('ok' in result) {
            console.log('✅ Final quiz submitted successfully:', result.ok);
            await refreshQuizResults();
            return result.ok;
          } else {
            console.error('❌ Final quiz submission failed:', result.err);
            setError(result.err);
            return null;
          }
        } else {
          console.log(`📤 Submitting module quiz for module ${moduleId}...`);
          const result = await learningService.submitQuiz(courseId, moduleId, answers);

          if ('ok' in result) {
            console.log('✅ Module quiz submitted successfully:', result.ok);
            await refreshQuizResults();
            return result.ok;
          } else {
            console.error('❌ Module quiz submission failed:', result.err);
            setError(result.err);
            return null;
          }
        }
      } catch (error: unknown) {
        // FIXED: Explicit unknown type
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Error submitting quiz:', errorMessage);
        setError(`Failed to submit quiz: ${errorMessage}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [learningService, courseId, currentQuiz]
  );

  // Refresh quiz results
  const refreshQuizResults = useCallback(async () => {
    if (!learningService) return;

    try {
      const results = await learningService.getQuizResults(courseId);
      setQuizResults(results);
    } catch (error: unknown) {
      // FIXED: Explicit unknown type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error refreshing quiz results:', errorMessage);
    }
  }, [learningService, courseId]);

  // Load quiz results on mount
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
    isFinalQuiz: () => currentQuiz?.isFinalQuiz === true,
    getQuizResult: (moduleId?: number) => {
      if (moduleId !== undefined) {
        return quizResults.find((result) => result.courseId === courseId) || null;
      }
      return quizResults.find((result) => result.courseId === courseId) || null;
    },
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
