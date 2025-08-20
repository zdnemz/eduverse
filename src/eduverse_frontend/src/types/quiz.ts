export interface QuizComponentProps {
  courseId: number;
  learningService: any;
  currentUserId: string | null;
  onQuizComplete?: (result: any) => void;
  onBack?: () => void;
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
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit: number;
}