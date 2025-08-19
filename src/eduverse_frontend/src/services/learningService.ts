// Enhanced LearningService.ts - FIXED QUIZ INTEGRATION WITH MOTOKO BACKEND

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
  CourseQuiz,
  QuizQuestion,
  UserAnswer,
  Certificate,
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

// Helper to convert number to BigInt
const toBigInt = (value: number): bigint => {
  return BigInt(value);
};

// Frontend interface matching backend types
export interface EnhancedCourseQuiz
  extends Omit<CourseQuiz, 'courseId' | 'moduleId' | 'timeLimit' | 'passingScore' | 'questions'> {
  courseId: number;
  moduleId: number;
  timeLimit: number;
  passingScore: number;
  questions: EnhancedQuizQuestion[];
}

export interface EnhancedQuizQuestion extends Omit<QuizQuestion, 'questionId' | 'correctAnswer'> {
  questionId: number;
  correctAnswer: number;
}

export interface EnhancedQuizResult
  extends Omit<QuizResult, 'courseId' | 'moduleId' | 'score' | 'completedAt'> {
  courseId: number;
  moduleId: number;
  score: number;
  completedAt: number;
}

export class LearningService {
  static getFinalQuiz(courseIdNum: number) {
    throw new Error('Method not implemented.');
  }
  static submitQuiz(
    arg0: number,
    moduleId: number,
    formattedAnswers: { questionId: number; selectedAnswer: number }[]
  ): any {
    throw new Error('Method not implemented.');
  }
  // REMOVED ALL STATIC METHODS - They were causing void return type errors

  constructor(private actor: ActorSubclass<_SERVICE>) {}

  // ====== ENHANCED QUIZ METHODS - PROPER MOTOKO INTEGRATION ======

  /**
   * Get quiz for a specific course and module from Motoko backend
   */
  async getQuiz(courseId: number, moduleId: number): Promise<EnhancedCourseQuiz | null> {
    try {
      console.log(`📝 Fetching quiz for Course: ${courseId}, Module: ${moduleId}`);

      const result = await this.actor.getQuiz(toBigInt(courseId), toBigInt(moduleId));

      if ('ok' in result) {
        const convertedQuiz = convertBigIntToString(result.ok) as EnhancedCourseQuiz;
        console.log('✅ Quiz loaded from Motoko backend:', convertedQuiz.title);
        return convertedQuiz;
      } else {
        console.warn('⚠️  Quiz not found:', result.err);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching quiz from backend:', error);
      throw error;
    }
  }

  /**
   * Get final assessment quiz for course completion
   * Usually stored as moduleId 999 or the last module
   */
  async getFinalQuiz(courseId: number): Promise<EnhancedCourseQuiz | null> {
    try {
      console.log(`🎯 Fetching final quiz for Course: ${courseId}`);

      // Try moduleId 999 first (convention for final quiz)
      let result = await this.actor.getQuiz(toBigInt(courseId), toBigInt(999));

      if ('ok' in result) {
        const convertedQuiz = convertBigIntToString(result.ok) as EnhancedCourseQuiz;
        console.log('✅ Final quiz loaded (moduleId 999):', convertedQuiz.title);
        return convertedQuiz;
      }

      // If no quiz with moduleId 999, try to get the last module's quiz
      const materials = await this.getCourseMaterials(courseId);
      if ('ok' in materials && materials.ok.modules.length > 0) {
        const lastModuleId = Number(materials.ok.modules[materials.ok.modules.length - 1].moduleId);

        result = await this.actor.getQuiz(toBigInt(courseId), toBigInt(lastModuleId));
        if ('ok' in result) {
          const convertedQuiz = convertBigIntToString(result.ok) as EnhancedCourseQuiz;
          console.log('✅ Final quiz loaded (last module):', convertedQuiz.title);
          return convertedQuiz;
        }
      }

      console.warn('⚠️  No final quiz found for course:', courseId);
      return null;
    } catch (error) {
      console.error('❌ Error fetching final quiz:', error);
      return null;
    }
  }

  /**
   * Submit quiz answers to Motoko backend
   */
  async submitQuiz(
    courseId: number,
    moduleId: number,
    answers: { questionId: number; selectedAnswer: number }[]
  ): Promise<EnhancedQuizResult | null> {
    try {
      console.log(`📤 Submitting quiz for Course: ${courseId}, Module: ${moduleId}`);

      // Convert answers to backend format
      const formattedAnswers: UserAnswer[] = answers.map((answer) => ({
        questionId: toBigInt(answer.questionId),
        selectedAnswer: toBigInt(answer.selectedAnswer),
      }));

      const result = await this.actor.submitQuiz(
        toBigInt(courseId),
        toBigInt(moduleId),
        formattedAnswers
      );

      if ('ok' in result) {
        const convertedResult = convertBigIntToString(result.ok) as EnhancedQuizResult;
        console.log('✅ Quiz submitted successfully:', {
          score: convertedResult.score,
          passed: convertedResult.passed,
        });
        return convertedResult;
      } else {
        console.error('❌ Quiz submission failed:', result.err);
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('❌ Error submitting quiz:', error);
      throw error;
    }
  }

  /**
   * Get all quiz results for a user in a course
   */
  async getQuizResults(courseId: number): Promise<EnhancedQuizResult[]> {
    try {
      console.log(`📊 Fetching quiz results for Course: ${courseId}`);

      const results = await this.actor.getMyQuizResults(toBigInt(courseId));
      const convertedResults = convertBigIntToString(results) as EnhancedQuizResult[];

      console.log('✅ Quiz results loaded:', convertedResults.length, 'results');
      return convertedResults;
    } catch (error) {
      console.error('❌ Error fetching quiz results:', error);
      return [];
    }
  }

  /**
   * Get quiz result for specific module
   */
  async getQuizResultByModule(
    courseId: number,
    moduleId: number
  ): Promise<EnhancedQuizResult | null> {
    try {
      const allResults = await this.getQuizResults(courseId);
      const moduleResult = allResults.find((result) => result.moduleId === moduleId);

      if (moduleResult) {
        console.log(`✅ Quiz result found for Module ${moduleId}:`, {
          score: moduleResult.score,
          passed: moduleResult.passed,
        });
      }

      return moduleResult || null;
    } catch (error) {
      console.error('❌ Error fetching quiz result by module:', error);
      return null;
    }
  }

  /**
   * Check if user has passed a specific quiz
   */
  async hasPassedQuiz(courseId: number, moduleId: number): Promise<boolean> {
    try {
      const result = await this.getQuizResultByModule(courseId, moduleId);
      return result ? result.passed : false;
    } catch (error) {
      console.error('❌ Error checking quiz pass status:', error);
      return false;
    }
  }

  /**
   * Get quiz score for specific module
   */
  async getQuizScore(courseId: number, moduleId: number): Promise<number> {
    try {
      const result = await this.getQuizResultByModule(courseId, moduleId);
      return result ? result.score : 0;
    } catch (error) {
      console.error('❌ Error getting quiz score:', error);
      return 0;
    }
  }

  /**
   * Check if user can take final quiz (all modules completed)
   */
  async canTakeFinalQuiz(courseId: number): Promise<boolean> {
    try {
      console.log(`🔍 Checking final quiz eligibility for Course: ${courseId}`);

      // Get course materials to check total modules
      const materialsResult = await this.actor.getCourseMaterials(toBigInt(courseId));
      if (!('ok' in materialsResult)) {
        return false;
      }

      const materials = materialsResult.ok;
      const totalModules = materials.modules.length;

      // Get user progress
      const progressResult = await this.actor.getMyProgress(toBigInt(courseId));
      if (!progressResult || progressResult.length === 0) {
        return false;
      }

      const progress = progressResult[0];
      const completedModules = progress.completedModules.length;

      // Check if all modules are completed
      const allModulesCompleted = completedModules >= totalModules;

      // Optional: Check if all module quizzes are passed (if they exist)
      const quizResults = await this.getQuizResults(courseId);
      let allQuizzesPassed = true;

      // Check each module for quiz requirements
      for (const module of materials.modules) {
        const moduleId = Number(module.moduleId);

        // Try to get quiz for this module
        try {
          const moduleQuiz = await this.getQuiz(courseId, moduleId);
          if (moduleQuiz) {
            // Quiz exists for this module, check if passed
            const quizResult = quizResults.find((r) => r.moduleId === moduleId);
            if (!quizResult || !quizResult.passed) {
              allQuizzesPassed = false;
              break;
            }
          }
        } catch (error) {
          // No quiz for this module, continue
        }
      }

      const canTake = allModulesCompleted && allQuizzesPassed;
      console.log(`${canTake ? '✅' : '❌'} Final quiz eligibility:`, {
        allModulesCompleted,
        allQuizzesPassed,
        completedModules: `${completedModules}/${totalModules}`,
      });

      return canTake;
    } catch (error) {
      console.error('❌ Error checking final quiz eligibility:', error);
      return false;
    }
  }

  /**
   * Get quiz availability for all modules in a course
   */
  async getQuizAvailability(courseId: number): Promise<{ [moduleId: number]: boolean }> {
    try {
      console.log(`📋 Checking quiz availability for Course: ${courseId}`);

      const materialsResult = await this.actor.getCourseMaterials(toBigInt(courseId));
      if (!('ok' in materialsResult)) {
        return {};
      }

      const materials = materialsResult.ok;
      const availability: { [moduleId: number]: boolean } = {};

      // Check each module for quiz availability
      for (const module of materials.modules) {
        const moduleId = Number(module.moduleId);
        try {
          const quiz = await this.getQuiz(courseId, moduleId);
          availability[moduleId] = quiz !== null;
        } catch (error) {
          availability[moduleId] = false;
        }
      }

      console.log('✅ Quiz availability checked:', availability);
      return availability;
    } catch (error) {
      console.error('❌ Error checking quiz availability:', error);
      return {};
    }
  }

  // ====== EXISTING METHODS (keeping for compatibility) ======

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

  async getUserProgress(courseId: number) {
    try {
      const result = await this.actor.getMyProgress(toBigInt(courseId));
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  }

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

  async getCourseStats(courseId: number) {
    try {
      const result = await this.actor.getCourseStats(toBigInt(courseId));
      return convertBigIntToString(result);
    } catch (error) {
      console.error('Error fetching course stats:', error);
      throw error;
    }
  }

  // Utility Methods
  async calculateOverallProgress(courseId: number): Promise<number> {
    try {
      const progress = await this.getUserProgress(courseId);
      if (progress && progress.length > 0 && typeof progress[0].overallProgress === 'number') {
        return progress[0].overallProgress;
      }

      // Fallback calculation
      const materialsResult = await this.getCourseMaterials(courseId);
      if ('ok' in materialsResult) {
        const materials = materialsResult.ok;
        const totalModules = materials.modules.length;
        if (totalModules === 0) return 0;

        const progressData = await this.getUserProgress(courseId);
        if (progressData && progressData.length > 0) {
          const completedModules = progressData[0].completedModules.length;
          return (completedModules / totalModules) * 100;
        }
      }

      return 0;
    } catch (error) {
      console.error('Error calculating progress:', error);
      return 0;
    }
  }

  async getCompletedModules(courseId: number): Promise<number[]> {
    try {
      const progress = await this.getUserProgress(courseId);
      if (progress && progress.length > 0 && progress[0].completedModules) {
        return progress[0].completedModules.map((id: any) => Number(id));
      }
      return [];
    } catch (error) {
      console.error('Error fetching completed modules:', error);
      return [];
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
}

// Hook untuk menggunakan learning service
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

        const quiz = await learningService.getQuiz(courseId, moduleId);
        setCurrentQuiz(quiz);

        if (quiz) {
          console.log('✅ Quiz loaded:', quiz.title);
        } else {
          console.log('ℹ️  No quiz found for this module');
        }

        return quiz;
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

        if (result) {
          console.log('✅ Quiz submitted successfully:', result);
          // Refresh quiz results
          await refreshQuizResults();
        }

        return result;
      } catch (error) {
        console.error('❌ Error submitting quiz:', error);
        setError('Failed to submit quiz');
        throw error;
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
    getQuizResult: (moduleId: number) =>
      quizResults.find((result) => result.moduleId === moduleId) || null,
    hasPassedQuiz: (moduleId: number) => {
      const result = quizResults.find((r) => r.moduleId === moduleId);
      return result ? result.passed : false;
    },
    getQuizScore: (moduleId: number) => {
      const result = quizResults.find((r) => r.moduleId === moduleId);
      return result ? result.score : 0;
    },
  };
};
