// Enhanced QuizComponent with Fixed Final Quiz Submission
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Brain,
  Award,
  ArrowLeft,
  Timer,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CourseQuiz, QuizComponentProps } from '@/types/quiz';

const QuizComponent: React.FC<QuizComponentProps> = ({
  courseId,
  learningService,
  currentUserId,
  onQuizComplete,
  onBack,
}) => {
  // Quiz loading states
  const [quiz, setQuiz] = useState<CourseQuiz | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Quiz interaction states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quiz metadata
  const [isFinalQuiz, setIsFinalQuiz] = useState(false);

  // Prevent multiple loads
  const hasLoadedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout>();

  // Load quiz only once using useCallback to prevent re-renders
  const loadQuiz = useCallback(async () => {
    if (!learningService || !courseId || hasLoadedRef.current) return;

    console.log(`Loading final quiz from backend - Course: ${courseId}`);
    hasLoadedRef.current = true;
    setIsLoadingQuiz(true);
    setQuizError(null);

    try {
      // Use getFinalQuiz method specifically
      const quizData = await learningService.getFinalQuiz(courseId);

      if (quizData && quizData.questions && quizData.questions.length > 0) {
        console.log(`Final quiz loaded: ${quizData.title}`);
        setQuiz(quizData);
        setIsFinalQuiz(true); // Mark as final quiz

        // Initialize quiz states
        setAnswers(new Array(quizData.questions.length).fill(-1));
        setShowResults(new Array(quizData.questions.length).fill(false));
        setTimeLeft(quizData.timeLimit || 900); // Default 15 minutes in seconds
        setIsTimerActive(true);

        toast.success(`Final quiz loaded: ${quizData.title}`);
      } else {
        setQuizError('No final quiz found for this course');
        toast.info('No final quiz available for this course');
      }
    } catch (error) {
      console.error('Error loading final quiz:', error);
      setQuizError('Failed to load final quiz from backend');
      toast.error('Failed to load final quiz');
    } finally {
      setIsLoadingQuiz(false);
    }
  }, [courseId, learningService]);

  // Load quiz only once on mount
  useEffect(() => {
    loadQuiz();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [loadQuiz]);

  // Timer effect - separate from quiz loading
  useEffect(() => {
    if (!quiz || !isTimerActive || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quiz, isTimerActive]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get timer color based on time left
  const getTimerColor = () => {
    if (timeLeft > 300) return 'text-green-400 bg-green-500/20 border-green-500/30'; // > 5 min
    if (timeLeft > 120) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'; // > 2 min
    return 'text-red-400 bg-red-500/20 border-red-500/30'; // < 2 min
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);

    console.log(`Answer selected for question ${currentQuestionIndex + 1}: ${answerIndex}`);
  };

  const checkAnswer = () => {
    const newShowResults = [...showResults];
    newShowResults[currentQuestionIndex] = true;
    setShowResults(newShowResults);

    const isCorrect =
      answers[currentQuestionIndex] === quiz!.questions[currentQuestionIndex].correctAnswer;
    console.log(
      `Answer checked - Question ${currentQuestionIndex + 1}: ${isCorrect ? 'Correct' : 'Incorrect'}`
    );
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  // FIXED: Updated submission handler with proper backend format
  const handleSubmit = async () => {
    if (!quiz || !learningService || isSubmitting) return;

    try {
      console.log('🎯 Submitting final quiz to backend...');
      setIsTimerActive(false);
      setIsSubmitting(true);

      // FIXED: Validate all questions are answered
      const unansweredQuestions = answers.findIndex((answer) => answer === -1);
      if (unansweredQuestions !== -1) {
        toast.warning(`Please answer question ${unansweredQuestions + 1} before submitting`);
        setIsTimerActive(true);
        setIsSubmitting(false);
        return;
      }

      // FIXED: Format answers exactly as backend expects - simple array format
      const formattedAnswers = answers.map((selectedAnswer, index) => ({
        questionId: quiz.questions[index].questionId,
        selectedAnswer: selectedAnswer,
      }));

      console.log('📤 Submitting quiz with formatted answers:', {
        courseId,
        answersCount: formattedAnswers.length,
        answers: formattedAnswers,
      });

      // FIXED: Use the correct submitQuiz method from learningService
      const result = await learningService.submitQuiz(courseId, formattedAnswers);

      if (result && 'ok' in result) {
        console.log('✅ Final quiz submitted successfully:', result.ok);

        const score = result.ok.score || 0;
        const passed = result.ok.passed || false;

        toast.success(`Final quiz completed! Score: ${score}%`, {
          description: passed
            ? '🎉 Congratulations! You passed the final assessment!'
            : `You need ${quiz.passingScore || 70}% to pass. You can retake the quiz.`,
        });

        // Call completion handler
        if (onQuizComplete) {
          onQuizComplete({
            ...result.ok,
            moduleId: 1, // Final quiz module ID
            courseId: courseId,
          });
        }
      } else {
        const errorMsg = result && 'err' in result ? result.err : 'Unknown error occurred';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error submitting final quiz:', error);

      let errorMessage = 'Failed to submit final quiz';
      if (error instanceof Error) {
        if (error.message.includes('answers')) {
          errorMessage = 'Invalid answer format - please try again';
        } else if (error.message.includes('enroll')) {
          errorMessage = 'Please ensure you are enrolled in this course';
        } else {
          errorMessage = `Submission failed: ${error.message}`;
        }
      }

      toast.error(errorMessage);
      setIsTimerActive(true); // Restart timer on error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state with modern design
  if (isLoadingQuiz) {
    return (
      <div className="min-h-screen bg-transparent p-4">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-12 shadow-xl backdrop-blur-sm"
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20 blur-xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
                  <Brain className="h-10 w-10 animate-pulse text-white" />
                </div>
              </div>
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-400" />
              <h3 className="mb-2 text-2xl font-bold text-white">Loading Final Assessment</h3>
              <p className="max-w-md text-slate-400">
                Preparing your comprehensive final quiz from the backend system...
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Error state with improved design
  if (quizError || !quiz) {
    return (
      <div className="min-h-screen bg-transparent p-4">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-12 shadow-xl backdrop-blur-sm"
          >
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/20">
                <AlertCircle className="h-10 w-10 text-yellow-400" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-white">Final Quiz Not Available</h3>
              <p className="mx-auto mb-8 max-w-md text-slate-400">
                {quizError || 'No final quiz found for this course in the backend system'}
              </p>
              {onBack && (
                <button
                  onClick={onBack}
                  className="mx-auto flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-all duration-200 hover:scale-105 hover:bg-blue-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Course
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const hasAnswered = answers[currentQuestionIndex] !== -1;
  const showResult = showResults[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-transparent p-4">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Enhanced Quiz Header with Final Quiz Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-xl backdrop-blur-sm"
        >
          <div className="mb-6 flex items-center justify-between">
            {/* Left side - Quiz info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/20 blur-lg" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
                  <Brain className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
                  {isFinalQuiz && (
                    <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-xs font-bold text-white">
                      FINAL QUIZ
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    Course {courseId}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    Passing: {quiz.passingScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* Right side - Timer and progress */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="mb-1 text-sm text-slate-400">Question</div>
                <div className="text-2xl font-bold text-blue-400">
                  {currentQuestionIndex + 1}
                  <span className="text-lg text-slate-400">/{quiz.questions.length}</span>
                </div>
              </div>

              <div className={`rounded-xl border-2 px-4 py-2 ${getTimerColor()}`}>
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  <span className="font-mono text-xl font-bold">{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="relative">
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600"
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-400">
              <span>Progress: {Math.round(progressPercentage)}%</span>
              <span>{quiz.questions.length} Questions Total</span>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Question Card */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-8 shadow-xl backdrop-blur-sm"
        >
          {/* Question Header */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-400">
                {currentQuestionIndex + 1}
              </div>
              <span className="text-sm font-medium text-blue-400">
                Question {currentQuestionIndex + 1}
              </span>
            </div>
            <h2 className="text-xl leading-relaxed font-bold text-white">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="mb-8 space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = answers[currentQuestionIndex] === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const isWrong = showResult && isSelected && !isCorrect;

              let optionStyles = '';
              if (showResult) {
                if (isCorrect) {
                  optionStyles =
                    'border-green-500 bg-green-500/10 text-green-100 shadow-lg shadow-green-500/20';
                } else if (isWrong) {
                  optionStyles =
                    'border-red-500 bg-red-500/10 text-red-100 shadow-lg shadow-red-500/20';
                } else {
                  optionStyles = 'border-slate-600 bg-slate-700/30 text-slate-400';
                }
              } else if (isSelected) {
                optionStyles =
                  'border-blue-500 bg-blue-500/10 text-blue-100 shadow-lg shadow-blue-500/20 scale-[1.02]';
              } else {
                optionStyles =
                  'border-slate-600 bg-slate-700/30 text-slate-200 hover:border-slate-500 hover:bg-slate-700/50 hover:scale-[1.01]';
              }

              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult || isSubmitting}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-200 ${optionStyles} ${
                    showResult || isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                          showResult && isCorrect
                            ? 'border-green-400 bg-green-400'
                            : showResult && isWrong
                              ? 'border-red-400 bg-red-400'
                              : isSelected
                                ? 'border-blue-400 bg-blue-400'
                                : 'border-slate-400'
                        }`}
                      >
                        {(isSelected || (showResult && isCorrect)) && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="font-medium">{option}</span>
                    </div>

                    {showResult && (
                      <div>
                        {isCorrect && <CheckCircle className="h-6 w-6 text-green-400" />}
                        {isWrong && <XCircle className="h-6 w-6 text-red-400" />}
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div>
              {hasAnswered && !showResult && !isSubmitting && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={checkAnswer}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/25"
                >
                  Check Answer
                </motion.button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {showResult && !isSubmitting && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={nextQuestion}
                  className="rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-green-700 hover:shadow-green-500/25"
                >
                  {currentQuestionIndex === quiz.questions.length - 1
                    ? '🎯 Submit Final Quiz'
                    : 'Next Question'}
                </motion.button>
              )}

              {isSubmitting && (
                <div className="flex items-center gap-3 rounded-xl bg-slate-700/50 px-6 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                  <span className="font-medium text-blue-400">
                    {isFinalQuiz ? 'Submitting Final Quiz...' : 'Submitting to Backend...'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Answer Feedback */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 rounded-xl border-2 p-4 ${
                answers[currentQuestionIndex] === currentQuestion.correctAnswer
                  ? 'border-green-500/30 bg-green-500/10'
                  : 'border-red-500/30 bg-red-500/10'
              }`}
            >
              {answers[currentQuestionIndex] === currentQuestion.correctAnswer ? (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="font-bold text-green-400">Correct Answer!</span>
                  </div>
                  <p className="text-sm text-green-200">
                    Excellent! You selected the right answer.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-400" />
                    <span className="font-bold text-red-400">Incorrect Answer</span>
                  </div>
                  <p className="mb-2 text-sm text-red-200">
                    The correct answer is:{' '}
                    <strong>"{currentQuestion.options[currentQuestion.correctAnswer]}"</strong>
                  </p>
                  {currentQuestion.explanation && (
                    <div className="mt-3 border-t border-red-500/20 pt-3">
                      <p className="mb-1 text-sm font-medium text-red-100">Explanation:</p>
                      <p className="text-sm leading-relaxed text-red-200/80">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default QuizComponent;
