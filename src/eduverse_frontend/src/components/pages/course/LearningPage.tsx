import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  Code,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Award,
  FileText,
  Loader,
  AlertCircle,
  Lock,
  HelpCircle,
  Trophy,
  Star,
  XCircle,
  Download,
  Calendar,
  User,
  Brain,
  Target,
  Timer,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { actor as createActor } from '@/lib/actor';
import { getAuthClient } from '@/lib/authClient';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from 'declarations/eduverse_backend/eduverse_backend.did';
import { motion, useScroll } from 'framer-motion';
import { MOTION_TRANSITION } from '@/constants/motion';

// Types matching Motoko backend
interface Module {
  moduleId: number;
  title: string;
  content: string;
  codeExample?: string;
}

interface CourseMaterial {
  courseId: number;
  modules: Module[];
}

interface CourseInfo {
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

interface UserProgress {
  userId: string;
  courseId: number;
  completedModules: number[];
  quizResults: any[];
  overallProgress: number;
  lastAccessed: number;
}

interface QuizQuestion {
  questionId: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface CourseQuiz {
  courseId: number;
  moduleId: number;
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit: number;
}

interface QuizResult {
  userId: string;
  courseId: number;
  moduleId: number;
  score: number;
  passed: boolean;
  completedAt: number;
  answers: any[];
}

interface Certificate {
  tokenId: number;
  userId: string;
  courseId: number;
  courseName: string;
  completedAt: number;
  issuer: string;
  certificateHash: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string }>;
  };
}

// Helper function to convert BigInt values
const convertBigIntToString = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigIntToString);
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted;
  }
  return obj;
};

// Function to truncate title
const truncateTitle = (title: string, maxLength: number = 50) => {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + '...';
};

// Markdown-like content renderer
const ContentRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');

  return (
    <div className="prose prose-slate max-w-none">
      {lines.map((line, index) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <h3 key={index} className="mt-6 mb-3 text-lg font-bold text-gray-800">
              {line.replace(/\*\*/g, '')}
            </h3>
          );
        } else if (line.startsWith('- **') && line.includes('**:')) {
          const match = line.match(/- \*\*(.*?)\*\*: (.*)/);
          if (match) {
            return (
              <li key={index} className="mb-2 ml-6 list-disc text-white">
                <strong className="text-blue-600">{match[1]}</strong>: {match[2]}
              </li>
            );
          }
        } else if (line.startsWith('- ')) {
          return (
            <li key={index} className="mb-1 ml-6 list-disc text-white">
              {line.substring(2)}
            </li>
          );
        } else if (line.match(/^\d+\. /)) {
          return (
            <li key={index} className="mb-1 ml-6 list-decimal text-white">
              {line.replace(/^\d+\. /, '')}
            </li>
          );
        } else if (line.trim() === '') {
          return <br key={index} />;
        } else {
          return (
            <p key={index} className="mb-4 leading-relaxed text-white">
              {line}
            </p>
          );
        }
      })}
    </div>
  );
};

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={copyToClipboard}
        className="absolute top-3 right-3 z-10 rounded bg-gray-700 px-3 py-1 text-xs text-white transition-colors hover:bg-gray-600"
      >
        {isCopied ? 'Copied!' : 'Copy'}
      </button>
      <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Quiz Component
const QuizComponent: React.FC<{
  quiz: CourseQuiz;
  onSubmit: (answers: number[]) => Promise<void>;
  isSubmitting: boolean;
}> = ({ quiz, onSubmit, isSubmitting }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(quiz.questions.length).fill(-1));
  const [showResults, setShowResults] = useState<boolean[]>(
    new Array(quiz.questions.length).fill(false)
  );
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit);
  const [isTimerActive, setIsTimerActive] = useState(true);

  useEffect(() => {
    if (timeLeft > 0 && isTimerActive) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isTimerActive) {
      handleSubmit();
    }
  }, [timeLeft, isTimerActive]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const checkAnswer = () => {
    const newShowResults = [...showResults];
    newShowResults[currentQuestionIndex] = true;
    setShowResults(newShowResults);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsTimerActive(false);
    await onSubmit(answers);
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const hasAnswered = answers[currentQuestionIndex] !== -1;
  const showResult = showResults[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-4xl">
        {/* Quiz Header */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                Q
              </div>
              <h1 className="text-2xl font-bold text-gray-800">{quiz.title}</h1>
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
          <h2 className="mb-6 text-xl font-bold text-gray-800">{currentQuestion.question}</h2>

          <div className="mb-8 space-y-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
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
                }`}
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
              {hasAnswered && !showResult && (
                <button
                  onClick={checkAnswer}
                  className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Check Answer
                </button>
              )}
            </div>

            <div>
              {showResult && (
                <button
                  onClick={nextQuestion}
                  className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {currentQuestionIndex === quiz.questions.length - 1
                    ? 'Finish Quiz'
                    : 'Next Question'}
                </button>
              )}
            </div>
          </div>

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

// Certificate Display Component
const CertificateDisplay: React.FC<{
  certificate: Certificate;
  onViewCertificate: () => void;
  userName?: string;
}> = ({ certificate, onViewCertificate, userName }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100 p-4">
      <div>
        {/* Certificate */}
        <div className="mx-auto max-w-2xl rounded-lg border-8 border-yellow-400 bg-white p-8 text-center shadow-2xl">
          <div className="rounded-lg border-4 border-yellow-300 p-6">
            <div className="mb-4 text-yellow-600">
              <Award size={64} className="mx-auto" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-800">CERTIFICATE OF COMPLETION</h1>
            <div className="mb-6 text-lg text-gray-600">{certificate.courseName}</div>

            <div className="mb-4 text-xl text-gray-700">This certifies that</div>
            <div className="mb-4 border-b-2 border-blue-200 pb-2 text-3xl font-bold text-blue-600">
              {userName || 'Student'}
            </div>
            <div className="mb-6 text-lg text-gray-700">
              has successfully completed the course
              <br />
              <strong>"{certificate.courseName}"</strong>
              <br />
              and earned this NFT certificate
            </div>

            <div className="mt-8 flex items-end justify-between border-t-2 border-gray-200 pt-6">
              <div className="text-left">
                <div className="mb-1 text-sm text-gray-500">Completion Date</div>
                <div className="font-semibold">
                  {new Date(certificate.completedAt / 1000000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="mb-1 text-sm text-gray-500">Issuer</div>
                <div className="font-semibold">{certificate.issuer}</div>
              </div>
            </div>

            <div className="mt-6 text-xs text-gray-400">
              Certificate ID: #{certificate.tokenId} • Hash:{' '}
              {certificate.certificateHash.slice(0, 16)}...
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="flex justify-center gap-4">
            <button
              onClick={onViewCertificate}
              className="flex items-center gap-2 rounded-lg bg-yellow-600 px-6 py-3 font-medium text-white transition-colors hover:bg-yellow-700"
            >
              <Award className="h-4 w-4" />
              View Certificate
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  window.location.href + '/certificate/' + certificate.tokenId
                );
                toast.success('Certificate link copied to clipboard!');
              }}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Share Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

export default function LearningPage() {
  // Get courseId from URL params
  const { courseId } = useParams<{ courseId: string }>();
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [currentView, setCurrentView] = useState<'learning' | 'quiz' | 'certificate'>('learning');

  // Backend data states
  const [courseMaterial, setCourseMaterial] = useState<CourseMaterial | null>(null);
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();

  // Quiz and Certificate states
  const [currentQuiz, setCurrentQuiz] = useState<CourseQuiz | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [userCertificate, setUserCertificate] = useState<Certificate | null>(null);
  const [finalQuizData, setFinalQuizData] = useState<CourseQuiz | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  // Actor state
  const [actor, setActor] = useState<ActorSubclass<_SERVICE> | null>(null);

  // Initialize actor
  useEffect(() => {
    const initActor = async () => {
      try {
        const client = await getAuthClient();
        const identity = client.getIdentity();
        const newActor = await createActor(identity);
        setActor(newActor);
      } catch (error) {
        console.error('Failed to initialize actor:', error);
        setError('Failed to initialize connection');
        toast.error('Failed to initialize connection');
      }
    };

    initActor();
  }, []);

  // Initialize and fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!actor || !courseId) return;

      setLoading(true);
      setError(null);

      try {
        const courseIdNum = BigInt(courseId);

        // Fetch course info
        const courseResult = await actor.getCourseById(courseIdNum);
        const convertedCourse = convertBigIntToString(courseResult);

        if (!convertedCourse || convertedCourse.length === 0) {
          setError('Course not found');
          setLoading(false);
          return;
        }

        setCourseInfo(convertedCourse[0]);

        // Check enrollment status
        const enrollments = await actor.getMyEnrollments();
        const convertedEnrollments = convertBigIntToString(enrollments);
        const enrolled = convertedEnrollments.some((e: any) => e.courseId === Number(courseIdNum));
        setIsEnrolled(enrolled);

        if (enrolled) {
          // Fetch course materials
          const materialsResult = await actor.getCourseMaterials(courseIdNum);

          if ('ok' in materialsResult) {
            const convertedMaterials = convertBigIntToString(materialsResult.ok);
            setCourseMaterial(convertedMaterials);

            // Fetch user progress
            const progressResult = await actor.getMyProgress(courseIdNum);
            if (progressResult && progressResult.length > 0) {
              const convertedProgress = convertBigIntToString(progressResult[0]);
              setUserProgress(convertedProgress);
              setCompletedModules(convertedProgress.completedModules || []);
            }

            // Fetch quiz results
            const quizResultsData = await actor.getMyQuizResults(courseIdNum);
            const convertedQuizResults = convertBigIntToString(quizResultsData);
            setQuizResults(convertedQuizResults || []);

            // Check for certificate
            const certificates = await actor.getMyCertificates();
            const convertedCertificates = convertBigIntToString(certificates);
            const courseCert = convertedCertificates.find(
              (cert: Certificate) => cert.courseId === Number(courseIdNum)
            );
            if (courseCert) {
              setUserCertificate(courseCert);
              setCurrentView('certificate');
            }

            // Try to load final quiz data from backend
            await loadFinalQuizData(Number(courseIdNum));
          } else {
            setError(materialsResult.err || 'Failed to load course materials');
          }
        }
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError('Failed to load course data. Please try again.');
        toast.error('Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [actor, courseId]);

  // Load final quiz data from backend
  const loadFinalQuizData = async (courseIdNum: number) => {
    if (!actor || !courseMaterial) return;

    try {
      // Try to get quiz for the last module or a general final quiz
      // For now, let's try to get quiz for moduleId 999 (which is commonly used for final quizzes)
      const finalQuizResult = await actor.getQuiz(BigInt(courseIdNum), BigInt(999));

      if ('ok' in finalQuizResult) {
        const convertedQuiz = convertBigIntToString(finalQuizResult.ok);
        setFinalQuizData(convertedQuiz);
      } else {
        // If no specific final quiz exists, we can create one from all module quizzes
        // or use the existing logic to create a sample quiz
        console.log('No final quiz found in backend, using fallback');
      }
    } catch (error) {
      console.log('Error loading final quiz from backend:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      setScrolled(v !== 0);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Handle enrollment
  const handleEnroll = async () => {
    if (!actor || !courseId) return;

    setIsEnrolling(true);
    try {
      const result = await actor.enrollCourse(BigInt(courseId));

      if ('ok' in result) {
        toast.success(result.ok);
        setIsEnrolled(true);
        window.location.reload();
      } else {
        setError(result.err || 'Failed to enroll in course');
        toast.error(result.err || 'Failed to enroll in course');
      }
    } catch (err) {
      setError('Failed to enroll in course. Please try again.');
      toast.error('Failed to enroll in course');
    } finally {
      setIsEnrolling(false);
    }
  };

  // Helper functions
  const isModuleLocked = (moduleIndex: number) => {
    if (moduleIndex === 0) return false;
    return !completedModules.includes(courseMaterial?.modules[moduleIndex - 1]?.moduleId || 0);
  };

  const canAccessQuiz = () => {
    if (!courseMaterial) return false;
    return courseMaterial.modules.every((module) => completedModules.includes(module.moduleId));
  };

  const allQuizzesPassed = () => {
    if (!courseMaterial) return false;
    return courseMaterial.modules.every((module) =>
      quizResults.some((result) => result.moduleId === module.moduleId && result.passed)
    );
  };

  const handleCompleteModule = async (moduleIndex: number) => {
    if (!courseMaterial || !actor || !courseId) return;

    const currentModule = courseMaterial.modules[moduleIndex];

    if (!completedModules.includes(currentModule.moduleId)) {
      setCompletedModules((prev) => [...prev, currentModule.moduleId]);
      toast.success('Module completed!');
    }
  };

  const handleModuleClick = (moduleIndex: number) => {
    if (isModuleLocked(moduleIndex)) {
      toast.warning('Complete the previous module first to unlock this one.');
      return;
    }

    setCurrentModuleIndex(moduleIndex);
    setCurrentView('learning');
  };

  const handleStartQuiz = async () => {
    if (!actor || !courseId || !courseMaterial) return;

    setIsLoadingQuiz(true);

    try {
      let quizToUse = null;

      // First try to use the final quiz from backend if available
      if (finalQuizData) {
        quizToUse = finalQuizData;
      } else {
        // Fallback to creating a quiz from backend data or sample data
        quizToUse = {
          courseId: Number(courseId),
          moduleId: 999,
          title: 'Final Quiz - ' + courseInfo?.title,
          questions: courseMaterial.modules.map((module, index) => ({
            questionId: index + 1,
            question: `What is the main concept covered in "${module.title}"?`,
            options: [
              'Basic understanding of the topic',
              'Advanced implementation techniques',
              'Practical applications and examples',
              'Theoretical foundations',
            ],
            correctAnswer: 1,
            explanation: `This covers the core concepts from the module: ${module.title}`,
          })),
          passingScore: 75,
          timeLimit: 900, // 15 minutes
        };
      }

      setCurrentQuiz(quizToUse);
      setCurrentView('quiz');
    } catch (error) {
      toast.error('Failed to load quiz');
      console.error('Quiz loading error:', error);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleQuizSubmit = async (answers: number[]) => {
    if (!actor || !courseId || !currentQuiz) return;

    setIsSubmittingQuiz(true);
    try {
      // Convert answers to the format expected by backend
      const formattedAnswers = answers.map((answer, index) => ({
        questionId: index + 1,
        selectedAnswer: answer,
      }));

      // Try to submit to backend first
      try {
        const submitResult = await actor.submitQuiz(
          BigInt(courseId),
          BigInt(currentQuiz.moduleId),
          formattedAnswers.map((a) => ({
            questionId: BigInt(a.questionId),
            selectedAnswer: BigInt(a.selectedAnswer),
          }))
        );

        if ('ok' in submitResult) {
          const result = convertBigIntToString(submitResult.ok);

          if (result.passed) {
            toast.success(`Quiz passed with ${result.score}%! Generating certificate...`);

            // The backend should automatically generate certificate, let's check for it
            setTimeout(async () => {
              try {
                const certificates = await actor.getMyCertificates();
                const convertedCertificates = convertBigIntToString(certificates);
                const courseCert = convertedCertificates.find(
                  (cert: Certificate) => cert.courseId === Number(courseId)
                );

                if (courseCert) {
                  setUserCertificate(courseCert);
                  setCurrentView('certificate');
                  toast.success('🎉 Congratulations! Your certificate has been generated!');
                }
              } catch (error) {
                console.error('Error checking certificate:', error);
              }
            }, 1000);
          } else {
            toast.error(
              `Quiz failed with ${result.score}%. You need ${currentQuiz.passingScore}% to pass.`
            );
          }
        } else {
          throw new Error(submitResult.err || 'Failed to submit quiz');
        }
      } catch (backendError) {
        console.error('Backend submission failed, using fallback:', backendError);

        // Fallback calculation if backend fails
        const correctAnswers = currentQuiz.questions.reduce((acc, question, index) => {
          return acc + (answers[index] === question.correctAnswer ? 1 : 0);
        }, 0);

        const score = Math.round((correctAnswers / currentQuiz.questions.length) * 100);
        const passed = score >= currentQuiz.passingScore;

        const quizResult: QuizResult = {
          userId: 'current-user',
          courseId: Number(courseId),
          moduleId: currentQuiz.moduleId,
          score,
          passed,
          completedAt: Date.now() * 1000000,
          answers: [],
        };

        setQuizResults([quizResult]);

        if (passed) {
          toast.success(`Quiz passed with ${score}%! Generating certificate...`);

          setTimeout(() => {
            const certificate: Certificate = {
              tokenId: Date.now(),
              userId: 'current-user',
              courseId: Number(courseId),
              courseName: courseInfo?.title || 'Course',
              completedAt: Date.now() * 1000000,
              issuer: 'Learning Platform',
              certificateHash: 'hash-' + Date.now(),
              metadata: {
                name: `Certificate - ${courseInfo?.title}`,
                description: `Certificate of completion for ${courseInfo?.title}`,
                image: '',
                attributes: [],
              },
            };

            setUserCertificate(certificate);
            setCurrentView('certificate');
            toast.success('🎉 Congratulations! Your certificate has been generated!');
          }, 1000);
        } else {
          toast.error(`Quiz failed with ${score}%. You need ${currentQuiz.passingScore}% to pass.`);
        }
      }

      setCurrentQuiz(null);
      setCurrentView('learning');
    } catch (error) {
      console.error('Quiz submission error:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Loading state
  if (loading || !actor) {
    return (
      <LoadingSpinner
        message={!actor ? 'Initializing connection...' : 'Loading course materials...'}
      />
    );
  }

  if (error || !isEnrolled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
        <div className="max-w-md rounded-xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-base-content mb-4 text-xl font-bold">Access Required</h2>
          <p className="text-accent mb-6">
            {error || 'You need to enroll in this course to access the materials'}
          </p>
          <div className="flex justify-center gap-3">
            {!error && !isEnrolled && (
              <button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isEnrolling && <Loader className="h-4 w-4 animate-spin" />}
                {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
              </button>
            )}
            <Link
              to="/dashboard"
              className="rounded-lg border border-gray-300 bg-gray-100 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-200"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!courseMaterial || !courseInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="rounded-xl bg-white p-8 text-center shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-gray-800">Course not found</h2>
          <Link
            to="/dashboard"
            className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentModule = courseMaterial.modules[currentModuleIndex];
  const progressPercentage = (completedModules.length / courseMaterial.modules.length) * 100;
  const allLearningCompleted = completedModules.length === courseMaterial.modules.length;

  if (currentView === 'certificate' && userCertificate) {
    return (
      <CertificateDisplay
        certificate={userCertificate}
        onViewCertificate={() => {
          window.open(`/certificate/${userCertificate.tokenId}`, '_blank');
        }}
        userName="Student"
      />
    );
  }

  // Show Quiz View
  if (currentView === 'quiz' && currentQuiz) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={() => {
              setCurrentView('learning');
              setCurrentQuiz(null);
            }}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-gray-700 shadow-lg transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Course</span>
          </button>
        </div>

        <QuizComponent
          quiz={currentQuiz}
          onSubmit={handleQuizSubmit}
          isSubmitting={isSubmittingQuiz}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Fixed Header */}
      <header
        className={cn(
          'fixed top-0 left-0 z-50 flex w-full items-center justify-between px-6 py-2 transition-all duration-300 md:px-12',
          scrolled && 'border-base-content/30 bg-base-200/80 border-b shadow-sm backdrop-blur-md'
        )}
      >
        <div className="py-3 sm:px-12 md:px-24 lg:px-36 xl:px-48 2xl:px-60">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center space-x-2">
              {/* Back Button */}
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-300 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 transition-transform" />
                <span>Back</span>
              </Link>

              {/* Divider */}
              <div className="h-6 w-px bg-slate-600"></div>

              {/* Course Title */}
              <div className="min-w-0 flex-1">
                <h1
                  className="max-w-md truncate text-sm font-semibold text-white"
                  title={courseInfo.title}
                >
                  {truncateTitle(courseInfo.title, 40)}
                </h1>
                <p className="text-xs text-slate-400 capitalize">
                  by <span className="text-accent font-medium">{courseInfo.instructor}</span>
                </p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-6">
              {/* Module Info */}
              <div className="hidden items-center space-x-3 sm:flex">
                <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1">
                  <span className="text-xs font-medium text-blue-400">
                    Module {currentModuleIndex + 1}/{courseMaterial.modules.length}
                  </span>
                </div>
              </div>

              {/* Progress Section */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-xs font-medium text-slate-300">Progress</div>
                  <div className="text-lg font-bold text-white">
                    {Math.round(progressPercentage)}%
                  </div>
                </div>
                <div className="relative h-12 w-12 transform cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95">
                  <svg
                    className="progress-circle h-12 w-12 -rotate-90 transform"
                    viewBox="0 0 36 36"
                  >
                    {/* Background Circle */}
                    <path
                      className="text-slate-700"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Progress Circle with smooth animation */}
                    <path
                      className="text-blue-500 transition-all duration-1000 ease-out"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="transparent"
                      strokeDasharray={`${progressPercentage}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      style={{
                        strokeDashoffset: 0,
                        transition: 'stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </svg>
                  {/* Center Text with animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-400 transition-all duration-300">
                      {Math.round(progressPercentage)}
                    </span>
                  </div>

                  {/* Ripple effect on click */}
                  <div
                    className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-blue-500/20 opacity-0"
                    id="ripple"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-8 pt-20">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar - Module List */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <motion.div
                transition={MOTION_TRANSITION}
                initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                  Course Modules
                </h3>
                <div className="space-y-3">
                  {courseMaterial.modules.map((module, index) => {
                    const isUnlocked =
                      index === 0 ||
                      completedModules.includes(courseMaterial.modules[index - 1]?.moduleId);
                    const isCompleted = completedModules.includes(module.moduleId);
                    const isCurrent = currentModuleIndex === index;
                    const hasPassedQuiz = quizResults.some(
                      (r) => r.moduleId === module.moduleId && r.passed
                    );

                    return (
                      <button
                        key={module.moduleId}
                        onClick={() => handleModuleClick(index)}
                        disabled={!isUnlocked}
                        className={`w-full rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] ${
                          isCurrent && isUnlocked
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg ring-2 ring-blue-400/50'
                            : isCompleted
                              ? 'bg-slate-800/60 text-green-100 shadow-md backdrop-blur-sm hover:bg-slate-800/80 hover:shadow-lg'
                              : isUnlocked
                                ? 'bg-slate-800/60 text-gray-200 shadow-md backdrop-blur-sm hover:bg-slate-800/80 hover:shadow-lg'
                                : 'cursor-not-allowed bg-slate-800/40 text-gray-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Status Icon */}
                          <div
                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              hasPassedQuiz
                                ? 'bg-yellow-500 text-white'
                                : isCompleted
                                  ? 'bg-green-500 text-white'
                                  : isCurrent && isUnlocked
                                    ? 'border-white bg-white/20 text-white'
                                    : isUnlocked
                                      ? 'border-gray-400 text-gray-400'
                                      : 'border-gray-500 text-gray-500'
                            }`}
                          >
                            {hasPassedQuiz ? (
                              <Star size={12} />
                            ) : isCompleted ? (
                              <CheckCircle size={12} />
                            ) : !isUnlocked ? (
                              <Lock size={10} />
                            ) : (
                              <span>{index + 1}</span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div
                              className="text-sm leading-tight font-semibold"
                              title={module.title}
                            >
                              {truncateTitle(module.title, 30)}
                            </div>
                            <div
                              className={`mt-1 text-xs ${
                                isCurrent && isUnlocked
                                  ? 'text-blue-100'
                                  : isCompleted
                                    ? 'text-green-300'
                                    : isUnlocked
                                      ? 'text-gray-400'
                                      : 'text-gray-500'
                              }`}
                            >
                              Module {index + 1}
                              {hasPassedQuiz && <span className="ml-1">⭐</span>}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Quiz Button in Sidebar */}
                <div className="mt-6 border-t border-slate-600/50 pt-4">
                  {allLearningCompleted ? (
                    <button
                      onClick={handleStartQuiz}
                      disabled={isLoadingQuiz}
                      className="from-primary to-primary/80 hover:from-primary/90 hover:to-primary w-full rounded-lg bg-gradient-to-r px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50"
                    >
                      {isLoadingQuiz ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader className="h-4 w-4 animate-spin" />
                          Loading Quiz...
                        </div>
                      ) : (
                        '🚀 Start Final Quiz'
                      )}
                    </button>
                  ) : (
                    <div className="w-full rounded-lg bg-slate-700/50 px-4 py-3 text-center text-sm font-medium text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <Lock size={14} />
                        Quiz Locked
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              {/* Module Header */}
              <motion.div
                className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow backdrop-blur-sm"
                transition={MOTION_TRANSITION}
                initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
                    Module {currentModuleIndex + 1}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="h-4 w-4" />
                    ~15 min read
                  </div>
                </div>
                <h2
                  className="mb-6 text-3xl leading-tight font-bold text-white"
                  title={currentModule.title}
                >
                  {currentModule.title}
                </h2>

                {/* Module Status Badge */}
                <div className="flex justify-end">
                  {completedModules.includes(currentModule.moduleId) ? (
                    <div className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-sm font-medium text-white shadow-lg">
                      <CheckCircle size={16} />
                      Completed
                    </div>
                  ) : (
                    <div className="bg-primary rounded-full px-3 py-1 text-sm font-medium text-white shadow-lg">
                      In Progress
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Content */}
              <motion.div
                className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow backdrop-blur-sm"
                transition={MOTION_TRANSITION}
                initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Learning Material
                </h3>

                <div className="rounded-lg border border-slate-600/50 bg-slate-900/50 p-6">
                  <ContentRenderer content={currentModule.content} />

                  <div className="mt-6 border-t border-slate-600/50 pt-4">
                    {!completedModules.includes(currentModule.moduleId) ? (
                      <button
                        onClick={() => handleCompleteModule(currentModuleIndex)}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-green-700 hover:shadow-lg"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark as Completed
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle size={20} />
                        <span className="font-medium">Module completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Code Example */}
              {currentModule.codeExample && (
                <motion.div
                  className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-xl backdrop-blur-sm"
                  transition={MOTION_TRANSITION}
                  initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
                  whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
                    <Code className="h-5 w-5 text-blue-400" />
                    Code Example
                  </h3>
                  <CodeBlock code={currentModule.codeExample} />
                </motion.div>
              )}

              {/* Navigation */}
              <motion.div
                className="flex items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-xl backdrop-blur-sm"
                transition={MOTION_TRANSITION}
                initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div>
                  {currentModuleIndex > 0 ? (
                    <button
                      onClick={() => handleModuleClick(currentModuleIndex - 1)}
                      className="flex items-center gap-2 font-medium text-gray-300 transition-colors hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous Module
                    </button>
                  ) : (
                    <div></div>
                  )}
                </div>

                <span className="text-center text-gray-400">
                  <div>
                    Module {currentModuleIndex + 1} of {courseMaterial.modules.length}
                  </div>
                  {currentModuleIndex < courseMaterial.modules.length - 1 &&
                    !completedModules.includes(currentModule.moduleId) && (
                      <div className="mt-1 flex items-center justify-center gap-1 text-xs text-orange-400">
                        <Lock size={12} />
                        Complete this module to unlock next
                      </div>
                    )}
                </span>

                <div className="flex items-center gap-4">
                  {currentModuleIndex < courseMaterial.modules.length - 1 && (
                    <button
                      onClick={() => handleModuleClick(currentModuleIndex + 1)}
                      disabled={isModuleLocked(currentModuleIndex + 1)}
                      className={`flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium transition-all duration-200 ${
                        isModuleLocked(currentModuleIndex + 1)
                          ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:scale-105 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg'
                      }`}
                    >
                      {isModuleLocked(currentModuleIndex + 1) ? (
                        <>
                          <Lock size={16} />
                          Locked
                        </>
                      ) : (
                        <>
                          Next Module
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}

                  {currentModuleIndex === courseMaterial.modules.length - 1 &&
                    completedModules.includes(currentModule.moduleId) && (
                      <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-5 py-2.5 font-medium text-white transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-green-700 hover:shadow-lg">
                        <Award className="h-4 w-4" />
                        Complete Course
                      </button>
                    )}
                </div>
              </motion.div>

              {/* Final Quiz Section - Updated Design */}
              {allLearningCompleted && !userCertificate && (
                <motion.div
                  className="border-primary/30 from-primary/10 via-primary/5 relative mt-6 overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent shadow-2xl backdrop-blur-sm"
                  transition={MOTION_TRANSITION}
                  initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
                  whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
                  viewport={{ once: true, amount: 0.2 }}
                >
                  {/* Animated Background Elements */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="bg-primary/30 absolute top-4 right-4 h-20 w-20 rounded-full blur-xl"></div>
                    <div className="bg-primary/20 absolute bottom-4 left-4 h-16 w-16 rounded-full blur-lg"></div>
                    <div className="bg-primary/10 absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"></div>
                  </div>

                  <div className="relative p-8">
                    <div className="text-center">
                      {/* Icon Container with Animation */}
                      <div className="relative mx-auto mb-6">
                        <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-xl"></div>
                        <div className="from-primary to-primary/80 relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br shadow-lg">
                          <Brain className="h-10 w-10 text-white" />
                        </div>
                      </div>

                      {/* Title with Gradient */}
                      <h3 className="from-primary to-primary/70 mb-4 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent">
                        🎉 Ready for Final Assessment!
                      </h3>

                      <p className="mb-8 text-lg leading-relaxed text-gray-300">
                        Excellent work! You've mastered all learning modules.
                        <br />
                        <span className="font-semibold text-white">
                          Take the comprehensive final quiz to earn your NFT certificate.
                        </span>
                      </p>

                      {/* Quiz Features Grid */}
                      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="border-primary/20 bg-primary/5 rounded-xl border p-4 backdrop-blur-sm">
                          <div className="mb-2 flex items-center justify-center">
                            <Target className="text-primary mr-2 h-6 w-6" />
                            <h4 className="font-bold text-white">Smart Questions</h4>
                          </div>
                          <p className="text-sm text-gray-300">
                            Carefully crafted questions covering all key concepts from your learning
                            journey
                          </p>
                        </div>

                        <div className="border-primary/20 bg-primary/5 rounded-xl border p-4 backdrop-blur-sm">
                          <div className="mb-2 flex items-center justify-center">
                            <Timer className="text-primary mr-2 h-6 w-6" />
                            <h4 className="font-bold text-white">Generous Time</h4>
                          </div>
                          <p className="text-sm text-gray-300">
                            {finalQuizData?.timeLimit
                              ? Math.floor(finalQuizData.timeLimit / 60)
                              : 15}{' '}
                            minutes to demonstrate your knowledge without pressure
                          </p>
                        </div>

                        <div className="border-primary/20 bg-primary/5 rounded-xl border p-4 backdrop-blur-sm">
                          <div className="mb-2 flex items-center justify-center">
                            <Zap className="text-primary mr-2 h-6 w-6" />
                            <h4 className="font-bold text-white">Instant Feedback</h4>
                          </div>
                          <p className="text-sm text-gray-300">
                            Get immediate explanations for each answer to reinforce your learning
                          </p>
                        </div>

                        <div className="border-primary/20 bg-primary/5 rounded-xl border p-4 backdrop-blur-sm">
                          <div className="mb-2 flex items-center justify-center">
                            <Award className="text-primary mr-2 h-6 w-6" />
                            <h4 className="font-bold text-white">NFT Certificate</h4>
                          </div>
                          <p className="text-sm text-gray-300">
                            Pass with {finalQuizData?.passingScore || 75}%+ to earn your
                            blockchain-verified certificate
                          </p>
                        </div>
                      </div>

                      {/* Quiz Stats */}
                      <div className="mb-8 flex items-center justify-center gap-8 text-sm">
                        <div className="text-center">
                          <div className="text-primary text-2xl font-bold">
                            {finalQuizData?.questions.length || courseMaterial.modules.length}
                          </div>
                          <div className="text-gray-400">Questions</div>
                        </div>
                        <div className="h-8 w-px bg-gray-600"></div>
                        <div className="text-center">
                          <div className="text-primary text-2xl font-bold">
                            {finalQuizData?.passingScore || 75}%
                          </div>
                          <div className="text-gray-400">To Pass</div>
                        </div>
                        <div className="h-8 w-px bg-gray-600"></div>
                        <div className="text-center">
                          <div className="text-primary text-2xl font-bold">
                            {finalQuizData?.timeLimit
                              ? Math.floor(finalQuizData.timeLimit / 60)
                              : 15}
                          </div>
                          <div className="text-gray-400">Minutes</div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex justify-center">
                        <button
                          onClick={handleStartQuiz}
                          disabled={isLoadingQuiz}
                          className="group from-primary to-primary/80 relative overflow-hidden rounded-xl bg-gradient-to-r px-12 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {/* Button Background Animation */}
                          <div className="from-primary/80 to-primary absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

                          <div className="relative flex items-center gap-3">
                            {isLoadingQuiz ? (
                              <>
                                <Loader className="h-5 w-5 animate-spin" />
                                Loading Quiz...
                              </>
                            ) : (
                              <>
                                <Brain className="h-5 w-5" />
                                Start Final Assessment
                                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                              </>
                            )}
                          </div>
                        </button>
                      </div>

                      {/* Motivation Text */}
                      <div className="mt-6 text-sm text-gray-400">
                        <p>
                          💡 <span className="font-medium text-gray-300">Pro tip:</span> Review your
                          learning materials before starting.
                          <br />
                          You've got this! Show off everything you've learned.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Learning Progress Info */}
              {!allLearningCompleted && (
                <motion.div
                  className="border-primary/30 mt-6 rounded-2xl border-2 bg-slate-800/60 p-6 backdrop-blur-sm"
                  transition={MOTION_TRANSITION}
                  initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
                  whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/20 flex h-12 w-12 items-center justify-center rounded-full">
                      <Lock className="text-primary" size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-primary mb-2 font-bold">Final Assessment Locked</h4>
                      <p className="mb-4 text-gray-300">
                        Complete all learning modules to unlock the comprehensive final quiz and
                        earn your NFT certificate.
                      </p>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="mb-2 flex justify-between text-sm text-gray-400">
                          <span>Learning Progress</span>
                          <span>
                            {completedModules.length} of {courseMaterial.modules.length} modules
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                          <div
                            className="from-primary to-primary/80 h-full bg-gradient-to-r transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-400">
                        <p className="mb-2 flex items-center gap-2">
                          <BookOpen size={14} className="text-primary" />
                          Module Completion Checklist:
                        </p>
                        <ul className="ml-6 space-y-1">
                          {courseMaterial.modules.map((module, index) => (
                            <li key={module.moduleId} className="flex items-center gap-2">
                              {completedModules.includes(module.moduleId) ? (
                                <CheckCircle size={14} className="text-green-400" />
                              ) : (
                                <div className="border-primary/50 h-3.5 w-3.5 rounded-full border-2"></div>
                              )}
                              <span
                                className={
                                  completedModules.includes(module.moduleId)
                                    ? 'text-green-300 line-through'
                                    : 'text-gray-300'
                                }
                              >
                                {module.title}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Certificate Achievement Banner */}
              {userCertificate && (
                <motion.div
                  className="mt-6 animate-pulse rounded-2xl border-2 border-yellow-400/50 bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-8 text-center shadow-xl backdrop-blur-sm"
                  transition={MOTION_TRANSITION}
                  initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
                  whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <Trophy className="mx-auto mb-4 h-16 w-16 text-yellow-400" />
                  <h3 className="mb-2 text-3xl font-bold text-yellow-400">Course Completed! 🎉</h3>
                  <p className="mb-6 text-lg text-gray-200">
                    You have successfully earned your NFT certificate!
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setCurrentView('certificate')}
                      className="rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:scale-105 hover:from-yellow-600 hover:to-yellow-700 hover:shadow-lg"
                    >
                      <Award className="mr-2 inline h-4 w-4" />
                      View Certificate
                    </button>
                    <button
                      onClick={() => {
                        setCurrentModuleIndex(0);
                      }}
                      className="flex items-center gap-2 rounded-lg border border-gray-400 bg-slate-700/60 px-6 py-3 font-medium text-gray-200 transition-all duration-200 hover:scale-105 hover:bg-slate-700/80"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Review Course
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
