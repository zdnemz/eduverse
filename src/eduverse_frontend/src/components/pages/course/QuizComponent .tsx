// Enhanced QuizComponent with Motoko Backend Integration
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { EnhancedCourseQuiz, EnhancedQuizQuestion } from '@/services/learningService';

interface QuizComponentProps {
  courseId: number;
  moduleId: number;
  learningService: any; 
  currentUserId: string | null;
  onQuizComplete?: (result: any) => void;
  onBack?: () => void;
}

const QuizComponent: React.FC<QuizComponentProps> = ({
  courseId,
  moduleId,
  learningService,
  currentUserId,
  onQuizComplete,
  onBack,
}) => {
  // Quiz loading states
  const [quiz, setQuiz] = useState<EnhancedCourseQuiz | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Quiz interaction states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ====== LOAD QUIZ FROM MOTOKO BACKEND ======
  useEffect(() => {
    const loadQuizFromBackend = async () => {
      if (!learningService || !courseId || !moduleId) {
        setQuizError('Missing required parameters');
        setIsLoadingQuiz(false);
        return;
      }

      try {
        console.log(
          `🔄 Loading quiz from Motoko backend - Course: ${courseId}, Module: ${moduleId}`
        );
        setIsLoadingQuiz(true);
        setQuizError(null);

        // Load quiz from Motoko backend
        const quizData = await learningService.getQuiz(courseId, moduleId);

        if (quizData) {
          console.log('✅ Quiz loaded from Motoko:', quizData.title);
          setQuiz(quizData);

          // Initialize quiz states
          setAnswers(new Array(quizData.questions.length).fill(-1));
          setShowResults(new Array(quizData.questions.length).fill(false));
          setTimeLeft(quizData.timeLimit * 60); // Convert minutes to seconds
          setIsTimerActive(true);

          toast.success(`Quiz loaded: ${quizData.title}`);
        } else {
          setQuizError('No quiz found for this module');
          toast.info('No quiz available for this module');
        }
      } catch (error) {
        console.error('❌ Error loading quiz from Motoko backend:', error);
        setQuizError('Failed to load quiz from backend');
        toast.error('Failed to load quiz');
      } finally {
        setIsLoadingQuiz(false);
      }
    };

    loadQuizFromBackend();
  }, [learningService, courseId, moduleId]);

  // ====== TIMER LOGIC ======
  useEffect(() => {
    if (timeLeft > 0 && isTimerActive && quiz) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isTimerActive && quiz) {
      console.log('⏰ Time expired, auto-submitting quiz');
      handleSubmit();
    }
  }, [timeLeft, isTimerActive, quiz]);

  // ====== QUIZ INTERACTION HANDLERS ======
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);

    console.log(`📝 Answer selected for question ${currentQuestionIndex + 1}: ${answerIndex}`);
  };

  const checkAnswer = () => {
    const newShowResults = [...showResults];
    newShowResults[currentQuestionIndex] = true;
    setShowResults(newShowResults);

    const isCorrect =
      answers[currentQuestionIndex] === quiz!.questions[currentQuestionIndex].correctAnswer;
    console.log(
      `🔍 Answer checked - Question ${currentQuestionIndex + 1}: ${isCorrect ? 'Correct' : 'Incorrect'}`
    );
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!quiz || !learningService) {
      toast.error('Cannot submit quiz: Missing quiz data');
      return;
    }

    try {
      console.log('📤 Submitting quiz to Motoko backend...');
      setIsTimerActive(false);
      setIsSubmitting(true);

      // Format answers for Motoko backend
      const formattedAnswers = answers.map((answer, index) => ({
        questionId: quiz.questions[index].questionId,
        selectedAnswer: answer,
      }));

      console.log('Formatted answers for submission:', formattedAnswers);

      // Submit to Motoko backend
      const result = await learningService.submitQuiz(courseId, moduleId, formattedAnswers);

      if (result) {
        console.log('✅ Quiz submitted successfully:', result);

        toast.success(`Quiz completed! Score: ${result.score}%`, {
          description: result.passed
            ? 'Congratulations! You passed!'
            : `You need ${quiz.passingScore}% to pass.`,
        });

        // Call completion callback
        if (onQuizComplete) {
          onQuizComplete(result);
        }
      } else {
        throw new Error('No result returned from backend');
      }
    } catch (error) {
      console.error('❌ Error submitting quiz:', error);
      toast.error('Failed to submit quiz to backend');
      setIsTimerActive(true); // Resume timer on error
    } finally {
      setIsSubmitting(false);
    }
  };

  // ====== LOADING STATE ======
  if (isLoadingQuiz) {
    return (
      <div className="min-h-screen bg-transparent p-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl bg-white p-8 shadow-lg">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="mr-3 h-8 w-8 animate-spin text-blue-600" />
              <div className="text-center">
                <h3 className="mb-2 text-lg font-semibold">Loading Quiz from Backend...</h3>
                <p className="text-gray-600">
                  Please wait while we fetch your quiz from Motoko backend
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====== ERROR STATE ======
  if (quizError || !quiz) {
    return (
      <div className="min-h-screen bg-transparent p-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl bg-white p-8 shadow-lg">
            <div className="py-12 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
              <h3 className="mb-2 text-lg font-semibold">Quiz Not Available</h3>
              <p className="mb-6 text-gray-600">
                {quizError || 'No quiz found for this module in the backend'}
              </p>
              {onBack && (
                <button
                  onClick={onBack}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  Go Back
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====== QUIZ RENDER ======
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const hasAnswered = answers[currentQuestionIndex] !== -1;
  const showResult = showResults[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-transparent p-4">
      <div className="mx-auto max-w-4xl">
        {/* Quiz Header */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                Q
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{quiz.title}</h1>
                <p className="text-sm text-gray-600">
                  From Motoko Backend • Course {courseId} • Module {moduleId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  timeLeft > 60
                    ? 'bg-green-100 text-green-800'
                    : timeLeft > 30
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                <Clock className="mr-1 inline h-4 w-4" />
                {formatTime(timeLeft)}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Question</div>
                <div className="text-lg font-bold text-blue-600">
                  {currentQuestionIndex + 1} / {quiz.questions.length}
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Info */}
          <div className="mb-4 flex gap-4 text-sm text-gray-600">
            <span>🎯 Passing Score: {quiz.passingScore}%</span>
            <span>⏱️ Time Limit: {quiz.timeLimit} minutes</span>
            <span>❓ Questions: {quiz.questions.length}</span>
          </div>

          {/* Progress Bar */}
          <div className="h-3 w-full rounded-full bg-gray-200">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-xl font-bold text-gray-800">
            Question {currentQuestionIndex + 1}: {currentQuestion.question}
          </h2>

          <div className="mb-8 space-y-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult || isSubmitting}
                className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                  showResult
                    ? index === currentQuestion.correctAnswer
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : index === answers[currentQuestionIndex]
                        ? 'border-red-500 bg-red-50 text-red-800'
                        : 'border-gray-200 bg-gray-100 text-gray-600'
                    : answers[currentQuestionIndex] === index
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
                } ${showResult || isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult &&
                    (index === currentQuestion.correctAnswer ? (
                      <CheckCircle className="text-green-600" size={20} />
                    ) : index === answers[currentQuestionIndex] ? (
                      <XCircle className="text-red-600" size={20} />
                    ) : null)}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div>
              {hasAnswered && !showResult && !isSubmitting && (
                <button
                  onClick={checkAnswer}
                  className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Check Answer
                </button>
              )}
            </div>

            <div>
              {showResult && !isSubmitting && (
                <button
                  onClick={nextQuestion}
                  className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {currentQuestionIndex === quiz.questions.length - 1
                    ? 'Submit Quiz to Backend'
                    : 'Next Question'}
                </button>
              )}

              {isSubmitting && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting to Motoko Backend...</span>
                </div>
              )}
            </div>
          </div>

          {/* Answer feedback */}
          {showResult && (
            <div
              className={`mt-6 rounded-lg p-4 ${
                answers[currentQuestionIndex] === currentQuestion.correctAnswer
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {answers[currentQuestionIndex] === currentQuestion.correctAnswer ? (
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span className="font-medium">Correct! Your answer is right.</span>
                </div>
              ) : (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <XCircle size={20} />
                    <span className="font-medium">
                      Incorrect. The correct answer is: "
                      {currentQuestion.options[currentQuestion.correctAnswer]}"
                    </span>
                  </div>
                  {currentQuestion.explanation && (
                    <p className="mt-2 text-sm opacity-90">{currentQuestion.explanation}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizComponent;
