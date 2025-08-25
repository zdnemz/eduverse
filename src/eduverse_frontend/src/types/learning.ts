// types/learning.ts - Centralized type definitions for Learning components

export interface Module {
  moduleId: number;
  title: string;
  content: string;
  codeExample?: string;
}

export interface CourseMaterial {
  courseId: number;
  modules: Module[];
  title?: string;
}

export interface CourseInfo {
  id: number;
  title: string;
  instructor: string;
  category: string;
  totalModules: number;
  difficulty: { Beginner: null } | { Intermediate: null } | { Advanced: null };
  description: string;
  duration: number;
  price: number;
  thumbnail: string;
  prerequisites: string[];
}

export interface UserProgress {
  userId: string;
  courseId: number;
  completedModules: number[];
  quizResults: any[];
  overallProgress: number;
  lastAccessed: number;
}

export interface QuizQuestion {
  questionId: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CourseQuiz {
  courseId: number;
  moduleId: number;
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit: number;
}

export interface QuizResult {
  userId: string;
  courseId: number;
  moduleId: number;
  score: number;
  passed: boolean;
  completedAt: number;
  answers: any[];
}

export interface LearningState {
  currentModuleIndex: number;
  currentModule: Module | null;
  completedModules: number[];
  overallProgress: number;
  readingProgress: number;
  timeSpent: number;
  bookmarkedModules: number[];
  moduleNotes: { [moduleId: number]: string };
  statistics?: {
    totalTimeSpent: number;
    bookmarkCount: number;
    noteCount: number;
    completionRate: number;
  };
}

export interface LearningActions {
  goToModule: (moduleIndex: number) => void;
  goToNextModule: () => void;
  goToPreviousModule: () => void;
  completeCurrentModule: () => void;
  updateReadingProgress: (progress: number) => void;
  toggleBookmark: (moduleId: number) => void;
  saveNote: (note: string, moduleId: number) => void;
  completeCourse: (certificateId: number) => Promise<void>;
}

// Utility type for converting BigInt to string/number
export type ConvertBigInt<T> = T extends bigint
  ? number
  : T extends Array<infer U>
    ? Array<ConvertBigInt<U>>
    : T extends object
      ? { [K in keyof T]: ConvertBigInt<T[K]> }
      : T;
