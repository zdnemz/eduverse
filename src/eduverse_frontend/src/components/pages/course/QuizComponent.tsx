// components/course/QuizComponent.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, XCircle, CheckCircle, Clock, ChevronRight, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface QuizComponentProps {
  quiz: any[];
  onComplete: (score: any) => void;
  passingScore?: number;
}

const getDifficultyColor = (difficulty: any): string => {
  if ('Beginner' in difficulty) return 'badge-success';
  if ('Intermediate' in difficulty) return 'badge-warning';
  if ('Advanced' in difficulty) return 'badge-error';
  return 'badge-info';
};

const getDifficultyText = (difficulty: any): string => {
  if ('Beginner' in difficulty) return 'Beginner';
  if ('Intermediate' in difficulty) return 'Intermediate';
  if ('Advanced' in difficulty) return 'Advanced';
  return 'Beginner';
};

export default function QuizComponent({ quiz, onComplete, passingScore = 70 }: QuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<number>(Date.now());

  const currentQuestion = quiz[currentQuestionIndex];

  // Timer effect
  useEffect(() => {
    if (currentQuestion?.timeLimit && !showResults && timeLeft === null) {
      setTimeLeft(currentQuestion.timeLimit);
    }
  }, [currentQuestionIndex, showResults, currentQuestion?.timeLimit]);

  useEffect(() => {
    if (timeLeft && timeLeft > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev && prev <= 1) {
            toast.warning('Time up! Moving to next question.');
            handleNextQuestion();
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, showResults]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: answerIndex,
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeLeft(null); // Reset timer for next question
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const score = calculateScore();
    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);

    setShowResults(true);

    if (onComplete) {
      onComplete({
        ...score,
        timeTaken,
        passed: score.percentage >= passingScore,
      });
    }

    if (score.percentage >= passingScore) {
      toast.success(`🎉 Congratulations! You passed with ${score.percentage.toFixed(1)}%`);
    } else {
      toast.error(`You scored ${score.percentage.toFixed(1)}%. You need ${passingScore}% to pass.`);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctAnswerIndex) {
        correct++;
      }
    });
    const percentage = (correct / quiz.length) * 100;
    return {
      correct,
      total: quiz.length,
      percentage,
      passed: percentage >= passingScore,
    };
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setTimeLeft(null);
    setQuizStartTime(Date.now());
  };

  if (showResults) {
    const score = calculateScore();
    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);

    return (
      <motion.div
        className="card bg-base-200 shadow-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="card-body text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            {score.passed ? (
              <Award className="text-success mx-auto mb-4 h-20 w-20" />
            ) : (
              <XCircle className="text-error mx-auto mb-4 h-20 w-20" />
            )}
          </motion.div>

          <motion.h2
            className={`mb-4 text-3xl font-bold ${score.passed ? 'text-success' : 'text-error'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {score.passed ? '🎉 Excellent Work!' : '📚 Keep Learning!'}
          </motion.h2>

          <motion.div
            className="stats stats-horizontal bg-base-100 mb-6 shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="stat">
              <div className="stat-title">Score</div>
              <div
                className={`stat-value text-2xl ${score.passed ? 'text-success' : 'text-error'}`}
              >
                {score.correct}/{score.total}
              </div>
              <div className="stat-desc">{score.percentage.toFixed(1)}%</div>
            </div>

            <div className="stat">
              <div className="stat-title">Time Taken</div>
              <div className="stat-value text-info text-2xl">
                {Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}
              </div>
              <div className="stat-desc">minutes</div>
            </div>

            <div className="stat">
              <div className="stat-title">Required</div>
              <div className="stat-value text-base-content/70 text-2xl">{passingScore}%</div>
              <div className="stat-desc">to pass</div>
            </div>
          </motion.div>

          <motion.div
            className={`alert ${score.passed ? 'alert-success' : 'alert-error'} mb-6`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score.passed ? (
              <>
                <CheckCircle className="h-6 w-6" />
                <span>
                  Outstanding! You've mastered this topic and can proceed to get your certificate.
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6" />
                <span>
                  Don't give up! Review the lessons and try again. You need {passingScore}% to pass.
                </span>
              </>
            )}
          </motion.div>

          {/* Retry Button */}
          {!score.passed && (
            <motion.button
              className="btn btn-primary mb-6 gap-2"
              onClick={resetQuiz}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCcw className="h-4 w-4" />
              Retake Quiz
            </motion.button>
          )}

          {/* Detailed Results */}
          <motion.div
            className="max-h-96 space-y-4 overflow-y-auto text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="mb-4 text-center text-lg font-semibold">Review Your Answers:</h3>

            {quiz.map((question, index) => {
              const userAnswer = selectedAnswers[question.id];
              const isCorrect = userAnswer === question.correctAnswerIndex;
              const wasAnswered = userAnswer !== undefined;

              return (
                <div
                  key={question.id}
                  className={`rounded-lg border p-4 ${
                    isCorrect
                      ? 'border-success bg-success/10'
                      : wasAnswered
                        ? 'border-error bg-error/10'
                        : 'border-warning bg-warning/10'
                  }`}
                >
                  <div className="mb-3 flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="text-success mt-1 h-5 w-5 flex-shrink-0" />
                    ) : (
                      <XCircle className="text-error mt-1 h-5 w-5 flex-shrink-0" />
                    )}

                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="font-semibold">Q{index + 1}:</span>
                        <span
                          className={`badge badge-sm ${getDifficultyColor(question.difficulty)}`}
                        >
                          {getDifficultyText(question.difficulty)}
                        </span>
                      </div>
                      <p className="mb-2 font-medium">{question.question}</p>
                    </div>
                  </div>

                  <div className="ml-8 space-y-2">
                    {wasAnswered && (
                      <p className="text-sm">
                        <span className="font-medium">Your answer: </span>
                        <span className={isCorrect ? 'text-success' : 'text-error'}>
                          {question.options[userAnswer]}
                        </span>
                      </p>
                    )}

                    {!isCorrect && (
                      <p className="text-sm">
                        <span className="font-medium">Correct answer: </span>
                        <span className="text-success">
                          {question.options[question.correctAnswerIndex]}
                        </span>
                      </p>
                    )}

                    <div className="bg-base-100/50 rounded p-3 text-sm">
                      <span className="font-medium">Explanation: </span>
                      {question.explanation}
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <motion.div
      className="card bg-base-200 shadow-md"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-body">
        {/* Quiz Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-base-content/60 text-sm">
              Question {currentQuestionIndex + 1} of {quiz.length}
            </span>
            <div className={`badge ${getDifficultyColor(currentQuestion.difficulty)}`}>
              {getDifficultyText(currentQuestion.difficulty)}
            </div>
          </div>

          <AnimatePresence>
            {timeLeft && (
              <motion.div
                className={`flex items-center gap-2 ${
                  timeLeft <= 10 ? 'text-error animate-pulse' : 'text-warning'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Clock className="h-4 w-4" />
                <span className="font-mono text-sm">{timeLeft}s</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="bg-base-300 h-2 w-full rounded-full">
            <motion.div
              className="from-primary to-secondary h-2 rounded-full bg-gradient-to-r transition-all duration-300"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestionIndex + 1) / quiz.length) * 100}%` }}
            />
          </div>
          <div className="text-base-content/60 mt-1 text-right text-xs">
            {Math.round(((currentQuestionIndex + 1) / quiz.length) * 100)}% Complete
          </div>
        </div>

        {/* Question */}
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-base-content mb-6 text-xl font-semibold">
            {currentQuestion.question}
          </h3>

          {/* Answer Options */}
          <div className="mb-8 space-y-3">
            {currentQuestion.options.map((option: string, index: number) => {
              const isSelected = selectedAnswers[currentQuestion.id] === index;
              const letter = String.fromCharCode(65 + index);

              return (
                <motion.button
                  key={index}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-base-300 hover:border-base-content/30 hover:bg-base-300/50'
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`text-lg font-bold ${
                        isSelected ? 'text-primary' : 'text-base-content/60'
                      }`}
                    >
                      {letter}.
                    </span>
                    <span className="flex-1">{option}</span>
                    {isSelected && <CheckCircle className="text-primary h-5 w-5" />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="text-base-content/60 text-sm">
              {selectedAnswers[currentQuestion.id] !== undefined ? (
                <span className="text-success">✓ Answer selected</span>
              ) : (
                <span>Select an answer to continue</span>
              )}
            </div>

            <motion.button
              className={`btn gap-2 ${
                selectedAnswers[currentQuestion.id] !== undefined ? 'btn-primary' : 'btn-disabled'
              }`}
              onClick={handleNextQuestion}
              disabled={selectedAnswers[currentQuestion.id] === undefined}
              whileHover={selectedAnswers[currentQuestion.id] !== undefined ? { scale: 1.05 } : {}}
              whileTap={selectedAnswers[currentQuestion.id] !== undefined ? { scale: 0.95 } : {}}
            >
              {currentQuestionIndex < quiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
