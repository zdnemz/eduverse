// Fixed LearningService.ts - Quiz Loading Issues

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

  // ===== COURSE FUNCTIONS =====

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

  // ===== ENROLLMENT FUNCTIONS =====

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

  // ===== LEARNING MATERIALS FUNCTIONS =====

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

  // ===== QUIZ FUNCTIONS - FIXED =====

  /**
   * Get quiz for course - FIXED: Removed moduleId parameter since backend doesn't use it
   */
  async getQuiz(courseId: number): Promise<{ ok: EnhancedCourseQuiz } | { err: string }> {
    try {
      console.log(`🔍 Getting quiz for course: ${courseId}`);

      // PERBAIKAN: Hanya kirim courseId, hapus moduleId parameter
      const result = await this.actor.getQuiz(toBigInt(courseId));

      if ('ok' in convertBigIntToString(result)) {
        console.log('✅ Quiz found for course:', courseId);
        return convertBigIntToString(result);
      } else {
        console.log('⚠️ No quiz found for course:', courseId, result);
        return convertBigIntToString(result);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error getting quiz:', errorMessage);
      return { err: `Failed to get quiz: ${errorMessage}` };
    }
  }

  /**
   * Submit quiz answers - ORIGINAL: For module quizzes
   */
  async submitQuiz(
    courseId: number,
    answers: { questionId: number; selectedAnswer: number }[]
  ): Promise<{ ok: EnhancedQuizResult } | { err: string }> {
    try {
      console.log('📤 Submitting quiz:', {
        courseId,
        answersCount: answers.length,
      });

      // Validate inputs before conversion
      if (!courseId || courseId <= 0) {
        throw new Error('Invalid courseId');
      }
      if (!answers || answers.length === 0) {
        throw new Error('No answers provided');
      }

      const convertedAnswers = answers.map((answer) => ({
        questionId: toBigInt(answer.questionId),
        selectedAnswer: toBigInt(answer.selectedAnswer),
      }));

      // PERBAIKAN: Hapus moduleId parameter
      const result = await this.actor.submitQuiz(toBigInt(courseId), convertedAnswers);

      return convertBigIntToString(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error submitting quiz:', errorMessage);
      return { err: `Failed to submit quiz: ${errorMessage}` };
    }
  }

  /**
   * Submit final quiz - FIXED: Simplified approach
   */
  async submitFinalQuiz(
    courseId: number,
    answers: { questionId: number; selectedAnswer: number }[]
  ): Promise<{ ok: EnhancedQuizResult } | { err: string }> {
    console.log('🎯 Final quiz submission - using regular quiz submit');
    return this.submitQuiz(courseId, answers);
  }

  async getQuizPreview(courseId: number): Promise<EnhancedQuizPreview | null> {
    try {
      const result = await this.actor.getQuizPreview(toBigInt(courseId));
      return result ? convertBigIntToString(result) : null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting quiz preview:', errorMessage);
      return null;
    }
  }

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error validating answers:', errorMessage);
      return { err: 'Failed to validate answers' };
    }
  }

  // ===== PROGRESS TRACKING =====

  async getUserProgress(courseId: number): Promise<UserProgress | null> {
    try {
      const result = await this.actor.getMyProgress(toBigInt(courseId));
      return result ? convertBigIntToString(result) : null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting user progress:', errorMessage);
      return null;
    }
  }

  async getQuizResults(courseId: number): Promise<EnhancedQuizResult[]> {
    try {
      const result = await this.actor.getMyQuizResults(toBigInt(courseId));
      return result ? [convertBigIntToString(result)] : [];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting quiz results:', errorMessage);
      return [];
    }
  }

  // ===== CERTIFICATE FUNCTIONS =====

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

  // ===== ANALYTICS FUNCTIONS =====

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

  // ===== ENHANCED FINAL QUIZ METHODS - FIXED =====

  /**
   * Check if user can take final quiz
   */
  async canTakeFinalQuiz(courseId: number): Promise<boolean> {
    try {
      console.log(`🔍 Checking if user can take final quiz for course ${courseId}`);

      // Get user progress
      const progress = await this.getUserProgress(courseId);
      if (!progress) {
        console.log('❌ No progress found for course');
        return false;
      }

      // Get course materials to check total modules
      const materialsResult = await this.getCourseMaterials(courseId);
      if (!('ok' in materialsResult)) {
        console.log('❌ Course materials not found');
        return false;
      }

      const materials = materialsResult.ok;
      const totalModules = materials.modules.length;
      const completedModules = progress.completedModules.length;

      console.log(`📊 Module completion: ${completedModules}/${totalModules}`);

      // Can take final quiz if all modules are completed
      const canTake = completedModules >= totalModules;
      console.log(`🎯 Can take final quiz: ${canTake}`);

      return canTake;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error checking final quiz availability:', errorMessage);
      return false;
    }
  }

  /**
   * Get final quiz - FIXED: Directly get course quiz instead of module-specific quiz
   */
  async getFinalQuiz(courseId: number): Promise<EnhancedCourseQuiz | null> {
    try {
      console.log(`🎯 Getting final quiz for course ${courseId}`);

      const quizResult = await this.getQuiz(courseId);

      if ('ok' in quizResult) {
        const quiz = quizResult.ok;
        quiz.isFinalQuiz = true; // Mark as final quiz
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

// ====== ENHANCED QUIZ HOOKS - FIXED ======

/**
 * Hook for managing quiz state and operations - FIXED for quiz loading
 */
export const useQuizManager = (learningService: LearningService | null, courseId: number) => {
  const [currentQuiz, setCurrentQuiz] = useState<EnhancedCourseQuiz | null>(null);
  const [quizResults, setQuizResults] = useState<EnhancedQuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load quiz for specific module - FIXED: Now tries course-level quiz if no module-specific quiz
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

  // Load final quiz - FIXED: Simplified
  const loadFinalQuiz = useCallback(async () => {
    if (!learningService) return null;

    try {
      setIsLoading(true);
      setError(null);
      console.log('🎯 Loading final quiz...');

      // Check if user can take final quiz first
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

  // Submit quiz - UPDATED: Better handling of final vs module quiz
  const submitQuiz = useCallback(
    async (answers: { questionId: number; selectedAnswer: number }[]) => {
      if (!learningService) return null;

      try {
        setIsLoading(true);
        setError(null);

        console.log('📤 Submitting quiz answers...');
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

  // Refresh quiz results
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
    clearError: () => setError(null),
    isFinalQuiz: () => currentQuiz?.isFinalQuiz === true,
    getQuizResult: () => {
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
