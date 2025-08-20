// Enhanced LearningService.ts - FIXED TO MATCH BACKEND FUNCTIONS

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

// Helper to convert number to BigInt
const toBigInt = (value: number): bigint => {
  return BigInt(value);
};

// Frontend interface matching backend types
export interface EnhancedCourseQuiz
  extends Omit<CourseQuiz, 'courseId' | 'timeLimit' | 'passingScore' | 'questions'> {
  courseId: number;
  timeLimit: number;
  passingScore: number;
  questions: EnhancedQuizQuestion[];
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
    } catch (error) {
      console.error('Error updating user:', error);
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
    } catch (error) {
      console.error('Error getting profile:', error);
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
    } catch (error) {
      console.error('Error getting courses:', error);
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
    } catch (error) {
      console.error('Error getting courses by category:', error);
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
    } catch (error) {
      console.error('Error searching courses:', error);
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
    } catch (error) {
      console.error('Error getting course by ID:', error);
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
    } catch (error) {
      console.error('Error getting categories:', error);
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
    } catch (error) {
      console.error('Error enrolling in course:', error);
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
    } catch (error) {
      console.error('Error getting enrollments:', error);
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
    } catch (error) {
      console.error('Error getting course materials:', error);
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
    } catch (error) {
      console.error('Error getting module:', error);
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
      const result = await this.actor.getQuiz(toBigInt(courseId), toBigInt(moduleId));
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error getting quiz:', error);
      return { err: 'Failed to get quiz' };
    }
  }

  /**
   * Submit quiz answers
   */
  async submitQuiz(
    courseId: number,
    moduleId: number,
    answers: { questionId: number; selectedAnswer: number }[]
  ): Promise<{ ok: EnhancedQuizResult } | { err: string }> {
    try {
      const convertedAnswers = answers.map((answer) => ({
        questionId: toBigInt(answer.questionId),
        selectedAnswer: toBigInt(answer.selectedAnswer),
      }));

      const result = await this.actor.submitQuiz(
        toBigInt(courseId),
        toBigInt(moduleId),
        convertedAnswers
      );

      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      return { err: 'Failed to submit quiz' };
    }
  }

  /**
   * Get all quizzes
   */
  async getAllQuizzes(): Promise<EnhancedCourseQuiz[]> {
    try {
      const result = await this.actor.getAllQuizzes();
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error getting all quizzes:', error);
      return [];
    }
  }

  /**
   * Get quiz preview
   */
  async getQuizPreview(courseId: number): Promise<EnhancedQuizPreview | null> {
    try {
      const result = await this.actor.getQuizPreview(toBigInt(courseId));
      return result ? convertBigIntToString(result) : null;
    } catch (error) {
      console.error('Error getting quiz preview:', error);
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
    } catch (error) {
      console.error('Error validating answers:', error);
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
      const result = await this.actor.getQuizWithValidation(toBigInt(courseId), toBigInt(moduleId));
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error getting quiz with validation:', error);
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
    } catch (error) {
      console.error('Error getting user progress:', error);
      return null;
    }
  }

  /**
   * Get quiz results for a course
   */
  async getQuizResults(courseId: number): Promise<EnhancedQuizResult[]> {
    try {
      const result = await this.actor.getMyQuizResults(toBigInt(courseId));
      return result ? convertBigIntToString(result) : [];
    } catch (error) {
      console.error('Error getting quiz results:', error);
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
    } catch (error) {
      console.error('Error getting user certificates:', error);
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
    } catch (error) {
      console.error('Error getting certificate:', error);
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
    } catch (error) {
      console.error('Error getting course stats:', error);
      return null;
    }
  }

  // ===== CONVENIENCE METHODS =====

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
    } catch (error) {
      console.error('Error checking final quiz availability:', error);
      return false;
    }
  }

  /**
   * Get final quiz (assuming it's the last module's quiz)
   */
  async getFinalQuiz(courseId: number): Promise<EnhancedCourseQuiz | null> {
    try {
      // Get course materials to find the last module
      const materialsResult = await this.getCourseMaterials(courseId);

      if (!('ok' in materialsResult)) {
        return null;
      }

      const materials = materialsResult.ok;
      if (materials.modules.length === 0) {
        return null;
      }

      // Get quiz for the last module
      const lastModule = materials.modules[materials.modules.length - 1];
      const quizResult = await this.getQuiz(courseId, Number(lastModule.moduleId));

      if ('ok' in quizResult) {
        return quizResult.ok;
      }

      return null;
    } catch (error) {
      console.error('Error getting final quiz:', error);
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
        } catch (error) {
          console.log('No certificate found yet');
        }
      }

      return {
        certificate,
        canGetCertificate,
        hasQuizPassed,
        isComplete,
      };
    } catch (error) {
      console.error('❌ Error checking course completion:', error);
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
 * Hook for managing quiz state and operations
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
          console.log('ℹ️  No quiz found for this module:', result.err);
          setCurrentQuiz(null);
          return null;
        }
      } catch (error) {
        console.error('❌ Error loading quiz:', error);
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
        console.log('⚠️  No final quiz available');
      }

      return quiz;
    } catch (error) {
      console.error('❌ Error loading final quiz:', error);
      setError('Failed to load final quiz');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [learningService, courseId]);

  // Submit quiz
  const submitQuiz = useCallback(
    async (moduleId: number, answers: { questionId: number; selectedAnswer: number }[]) => {
      if (!learningService) return null;

      try {
        setIsLoading(true);
        setError(null);
        console.log('📤 Submitting quiz answers...');

        const result = await learningService.submitQuiz(courseId, moduleId, answers);

        if ('ok' in result) {
          console.log('✅ Quiz submitted successfully:', result.ok);
          // Refresh quiz results
          await refreshQuizResults();
          return result.ok;
        } else {
          console.error('❌ Quiz submission failed:', result.err);
          setError(result.err);
          return null;
        }
      } catch (error) {
        console.error('❌ Error submitting quiz:', error);
        setError('Failed to submit quiz');
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
    } catch (error) {
      console.error('❌ Error refreshing quiz results:', error);
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
