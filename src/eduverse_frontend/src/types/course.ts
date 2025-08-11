// types/eduverse.ts - Create this file for your custom types

export interface Difficulty {
  Beginner?: null;
  Intermediate?: null;
  Advanced?: null;
}

export interface CourseInfo {
  id: bigint;
  title: string;
  duration: string;
  instructor: string;
  thumbnail: string;
  difficulty: Difficulty;
  rating: number;
  category: string;
  students: bigint;
  totalLessons: bigint;
}

export interface LessonType {
  Video?: null;
  Reading?: null;
  Interactive?: null;
  CodeLab?: null;
  Assignment?: null;
}

export interface ContentDetail {
  summary: string;
  keyPoints: string[];
  detailedContent: string;
  codeExamples?: string;
}

export interface Lesson {
  id: bigint;
  title: string;
  content: ContentDetail;
  videoUrl?: string;
  duration: string;
  lessonType: LessonType;
  resources: string[];
  isCompleted: boolean;
}

export interface Quiz {
  id: bigint;
  question: string;
  options: string[];
  correctAnswerIndex: bigint;
  explanation: string;
  difficulty: Difficulty;
  timeLimit?: bigint;
}

export interface Module {
  id: bigint;
  title: string;
  description: string;
  estimatedTime: string;
  prerequisites: string[];
  isLocked: boolean;
  lessons: Lesson[];
  quiz: Quiz[];
}

export interface CourseContent {
  courseId: bigint;
  modules: Module[];
}

export interface ExtendedCourseInfo extends CourseInfo {
  progress?: number;
  completedLessons?: number;
  nextLesson?: string;
}

// Helper functions for Difficulty handling
export const getDifficultyText = (difficulty: Difficulty): string => {
  if ('Beginner' in difficulty) return 'Beginner';
  if ('Intermediate' in difficulty) return 'Intermediate';
  if ('Advanced' in difficulty) return 'Advanced';
  return 'Beginner';
};

export const getDifficultyBadgeClass = (difficulty: Difficulty): string => {
  const text = getDifficultyText(difficulty);
  switch (text) {
    case 'Beginner':
      return 'badge-success';
    case 'Intermediate':
      return 'badge-warning';
    case 'Advanced':
      return 'badge-error';
    default:
      return 'badge-success';
  }
};
