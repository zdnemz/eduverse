import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  Code,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
  Award,
  FileText,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { actor as createActor } from '@/lib/actor';
import { getAuthClient } from '@/lib/authClient';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from 'declarations/eduverse_backend/eduverse_backend.did';

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

interface Enrollment {
  userId: string;
  courseId: number;
  enrolledAt: number;
  status: { Active: null } | { Completed: null } | { Suspended: null };
}

// Helper function to convert BigInt values
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
            <h3 key={index} className="mt-6 mb-3 text-lg font-bold text-gray-100">
              {line.replace(/\*\*/g, '')}
            </h3>
          );
        } else if (line.startsWith('- **') && line.includes('**:')) {
          const match = line.match(/- \*\*(.*?)\*\*: (.*)/);
          if (match) {
            return (
              <li key={index} className="mb-2 ml-6 list-disc text-gray-200">
                <strong className="text-blue-300">{match[1]}</strong>: {match[2]}
              </li>
            );
          }
        } else if (line.startsWith('- ')) {
          return (
            <li key={index} className="mb-1 ml-6 list-disc text-gray-200">
              {line.substring(2)}
            </li>
          );
        } else if (line.match(/^\d+\. /)) {
          return (
            <li key={index} className="mb-1 ml-6 list-decimal text-gray-200">
              {line.replace(/^\d+\. /, '')}
            </li>
          );
        } else if (line.trim() === '') {
          return <br key={index} />;
        } else {
          return (
            <p key={index} className="mb-4 leading-relaxed text-gray-200">
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

// Loading component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-400" />
      <p className="text-gray-300">{message}</p>
    </div>
  </div>
);

// Debug component to show current state
const DebugInfo: React.FC<{
  actor: ActorSubclass<_SERVICE> | null;
  courseId: string | undefined;
  isEnrolled: boolean;
  courseInfo: CourseInfo | null;
  courseMaterial: CourseMaterial | null;
  error: string | null;
}> = ({ actor, courseId, isEnrolled, courseInfo, courseMaterial, error }) => {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="rounded-full bg-red-600 px-3 py-1 text-xs text-white"
      >
        Debug
      </button>
      {showDebug && (
        <div className="absolute right-0 bottom-full mb-2 w-80 rounded-lg bg-black p-4 text-xs text-white">
          <div className="space-y-2">
            <div>
              <strong>Actor:</strong> {actor ? '✅ Available' : '❌ Missing'}
            </div>
            <div>
              <strong>Course ID:</strong> {courseId || '❌ Missing'}
            </div>
            <div>
              <strong>Is Enrolled:</strong> {isEnrolled ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>Course Info:</strong> {courseInfo ? '✅ Loaded' : '❌ Missing'}
            </div>
            <div>
              <strong>Course Material:</strong> {courseMaterial ? '✅ Loaded' : '❌ Missing'}
            </div>
            <div>
              <strong>Error:</strong> {error || 'None'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Error component
const ErrorMessage: React.FC<{
  message: string;
  onRetry?: () => void;
  showEnrollButton?: boolean;
  onEnroll?: () => void;
  isEnrolling?: boolean;
}> = ({ message, onRetry, showEnrollButton, onEnroll, isEnrolling }) => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="max-w-md text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100/10">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>
      <h2 className="mb-4 text-xl font-bold text-white">Access Required</h2>
      <p className="mb-6 text-gray-300">{message}</p>
      <div className="flex justify-center gap-3">
        {showEnrollButton && onEnroll && (
          <button
            onClick={onEnroll}
            disabled={isEnrolling}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isEnrolling && <Loader className="h-4 w-4 animate-spin" />}
            {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-lg border border-gray-600 bg-gray-700 px-6 py-2 text-white transition-colors hover:bg-gray-600"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  </div>
);

export default function LearningPage() {
  // Get courseId from URL params
  const { courseId } = useParams<{ courseId: string }>();
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [isReading, setIsReading] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Backend data states
  const [courseMaterial, setCourseMaterial] = useState<CourseMaterial | null>(null);
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Actor state - similar to AllCoursesView
  const [actor, setActor] = useState<ActorSubclass<_SERVICE> | null>(null);

  // Initialize actor - similar to AllCoursesView
  useEffect(() => {
    const initActor = async () => {
      try {
        const client = await getAuthClient();
        const identity = client.getIdentity();
        console.log('Identity principal:', identity.getPrincipal().toText());

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
      console.log('🔍 Starting fetchData...');
      console.log('Actor:', actor);
      console.log('CourseId:', courseId);

      if (!actor) {
        console.log('⏳ Actor not ready yet, waiting...');
        return;
      }

      if (!courseId) {
        console.error('❌ CourseId is missing');
        setError('Course ID is missing from URL');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const courseIdNum = BigInt(courseId);
        console.log('🔢 Course ID as number:', courseIdNum);

        // Fetch course info first
        console.log('📚 Fetching course info...');
        const courseResult = await actor.getCourseById(courseIdNum);
        const convertedCourse = convertBigIntToString(courseResult);
        console.log('📚 Course result:', convertedCourse);

        if (!convertedCourse || convertedCourse.length === 0) {
          console.error('❌ Course not found');
          setError('Course not found');
          setLoading(false);
          return;
        }

        setCourseInfo(convertedCourse[0]);
        console.log('✅ Course info set');

        // Check enrollment status
        console.log('🎓 Checking enrollment status...');
        const enrollments = await actor.getMyEnrollments();
        const convertedEnrollments = convertBigIntToString(enrollments);
        console.log('🎓 Enrollments:', convertedEnrollments);

        const enrolled = convertedEnrollments.some((e: Enrollment) => e.courseId === Number(courseIdNum));
        console.log('🎓 Is enrolled:', enrolled);
        setIsEnrolled(enrolled);

        if (enrolled) {
          console.log('📖 Fetching course materials...');
          // Fetch course materials
          const materialsResult = await actor.getCourseMaterials(courseIdNum);
          console.log('📖 Materials result:', materialsResult);

          if ('ok' in materialsResult) {
            const convertedMaterials = convertBigIntToString(materialsResult.ok);
            setCourseMaterial(convertedMaterials);
            console.log('✅ Course materials set');

            // Fetch user progress
            console.log('📊 Fetching user progress...');
            const progressResult = await actor.getMyProgress(courseIdNum);
            console.log('📊 Progress result:', progressResult);

            if (progressResult && progressResult.length > 0) {
              const convertedProgress = convertBigIntToString(progressResult[0]);
              setUserProgress(convertedProgress);
              setCompletedModules(convertedProgress.completedModules || []);
              console.log('✅ User progress set');
            }
          } else {
            console.error('❌ Failed to load materials:', materialsResult.err);
            setError(materialsResult.err || 'Failed to load course materials');
          }
        } else {
          console.log('⚠️ User is not enrolled');
        }
      } catch (err) {
        console.error('💥 Error fetching course data:', err);
        setError('Failed to load course data. Please try again.');
        toast.error('Failed to load course data');
      } finally {
        console.log('✅ Loading complete');
        setLoading(false);
      }
    };

    fetchData();
  }, [actor, courseId]); // Dependencies include actor

  // Handle enrollment
  const handleEnroll = async () => {
    if (!actor || !courseId) return;

    setIsEnrolling(true);
    try {
      console.log('🎓 Attempting to enroll in course:', courseId);
      const result = await actor.enrollCourse(BigInt(courseId));
      console.log('🎓 Enrollment result:', result);

      if ('ok' in result) {
        console.log('✅ Enrollment successful');
        toast.success(result.ok);
        setIsEnrolled(true);
        // Refetch data after enrollment
        window.location.reload();
      } else {
        console.error('❌ Enrollment failed:', result.err);
        setError(result.err || 'Failed to enroll in course');
        toast.error(result.err || 'Failed to enroll in course');
      }
    } catch (err) {
      console.error('💥 Enrollment error:', err);
      setError('Failed to enroll in course. Please try again.');
      toast.error('Failed to enroll in course');
    } finally {
      setIsEnrolling(false);
    }
  };

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simulate reading progress
  useEffect(() => {
    if (isReading) {
      const interval = setInterval(() => {
        setReadingProgress((prev) => {
          if (prev >= 100) {
            setIsReading(false);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isReading]);

  // Event handlers
  const handleStartReading = () => {
    setIsReading(true);
    setReadingProgress(0);
  };

  const handleCompleteModule = async () => {
    if (!courseMaterial || !actor || !courseId) return;

    const currentModule = courseMaterial.modules[currentModuleIndex];
    if (!completedModules.includes(currentModule.moduleId)) {
      setCompletedModules((prev) => [...prev, currentModule.moduleId]);
    }

    if (currentModuleIndex < courseMaterial.modules.length - 1) {
      setCurrentModuleIndex((prev) => prev + 1);
    }
  };

  const handlePreviousModule = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex((prev) => prev - 1);
      setReadingProgress(0);
      setIsReading(false);
    }
  };

  const handleNextModule = () => {
    if (!courseMaterial) return;

    if (currentModuleIndex < courseMaterial.modules.length - 1) {
      setCurrentModuleIndex((prev) => prev + 1);
      setReadingProgress(0);
      setIsReading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Trigger useEffect to refetch data
    window.location.reload();
  };

  // Loading state - check both actor and other loading states
  if (loading || !actor) {
    return (
      <>
        <LoadingSpinner
          message={!actor ? 'Initializing connection...' : 'Loading course materials...'}
        />
        <DebugInfo
          actor={actor}
          courseId={courseId}
          isEnrolled={isEnrolled}
          courseInfo={courseInfo}
          courseMaterial={courseMaterial}
          error={error}
        />
      </>
    );
  }

  // Error state or not enrolled
  if (error || !isEnrolled) {
    return (
      <>
        <ErrorMessage
          message={error || 'You need to enroll in this course to access the materials'}
          onRetry={error ? handleRetry : undefined}
          showEnrollButton={!error && !isEnrolled}
          onEnroll={handleEnroll}
          isEnrolling={isEnrolling}
        />
        <DebugInfo
          actor={actor}
          courseId={courseId}
          isEnrolled={isEnrolled}
          courseInfo={courseInfo}
          courseMaterial={courseMaterial}
          error={error}
        />
      </>
    );
  }

  // Course not found
  if (!courseMaterial || !courseInfo) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-white">Course not found</h2>
            <Link
              to="/dashboard"
              className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
        <DebugInfo
          actor={actor}
          courseId={courseId}
          isEnrolled={isEnrolled}
          courseInfo={courseInfo}
          courseMaterial={courseMaterial}
          error={error}
        />
      </>
    );
  }

  const currentModule = courseMaterial.modules[currentModuleIndex];
  const isLastModule = currentModuleIndex === courseMaterial.modules.length - 1;
  const isFirstModule = currentModuleIndex === 0;
  const progressPercentage = userProgress
    ? userProgress.overallProgress
    : (completedModules.length / courseMaterial.modules.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Fixed Header */}
      <div
        className={`fixed top-0 left-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/20 bg-black/20 shadow-lg backdrop-blur-md'
            : 'bg-transparent'
        }`}
      >
        <div className="py-3 sm:px-12 md:px-24 lg:px-36 xl:px-48 2xl:px-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="flex cursor-pointer items-center gap-2 text-gray-300 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back</span>
              </Link>
              <div className="border-l border-gray-600 pl-3">
                <h1 className="text-lg font-bold text-white" title={courseInfo.title}>
                  {truncateTitle(courseInfo.title, 45)}
                </h1>
                <p className="text-xs text-gray-400">by {courseInfo.instructor}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs font-medium text-gray-300">
                  Module {currentModuleIndex + 1} of {courseMaterial.modules.length}
                </div>
              </div>

              <div className="w-32">
                <div className="mb-1 flex justify-between">
                  <span className="text-xs font-medium text-gray-300">Progress</span>
                  <span className="text-xs text-gray-400">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-700">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8 pt-32">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar - Module List */}
          <div className="lg:col-span-1">
            <div className="sticky top-36">
              <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
                <BookOpen className="h-5 w-5 text-blue-400" />
                Course Modules
              </h3>
              <div className="space-y-3">
                {courseMaterial.modules.map((module, index) => (
                  <button
                    key={module.moduleId}
                    onClick={() => {
                      setCurrentModuleIndex(index);
                      setReadingProgress(0);
                      setIsReading(false);
                    }}
                    className={`w-full rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] ${
                      index === currentModuleIndex
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg ring-2 ring-blue-400/50'
                        : 'bg-slate-800/60 text-gray-200 shadow-md backdrop-blur-sm hover:bg-slate-800/80 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {completedModules.includes(module.moduleId) ? (
                        <div className="mt-1">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                      ) : (
                        <div
                          className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold ${
                            index === currentModuleIndex
                              ? 'border-white bg-white/20 text-white'
                              : 'border-gray-400 text-gray-400'
                          }`}
                        >
                          {index + 1}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm leading-tight font-semibold" title={module.title}>
                          {truncateTitle(module.title, 30)}
                        </div>
                        <div
                          className={`mt-1 text-xs ${
                            index === currentModuleIndex ? 'text-blue-100' : 'text-gray-400'
                          }`}
                        >
                          Module {index + 1}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              {/* Module Header */}
              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-xl backdrop-blur-sm">
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
                  className="mb-6 text-2xl leading-tight font-bold text-white"
                  title={currentModule.title}
                >
                  {currentModule.title}
                </h2>

                {/* Reading Progress */}
                {readingProgress > 0 && (
                  <div className="mt-6 rounded-xl border border-slate-600/50 bg-slate-900/50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-200">Reading Progress</span>
                      <span className="font-mono text-sm text-blue-400">
                        {Math.round(readingProgress)}%
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-700">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 shadow-sm transition-all duration-300"
                        style={{ width: `${readingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-xl backdrop-blur-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                    <FileText className="h-5 w-5 text-blue-400" />
                    Learning Material
                  </h3>
                  {!isReading && readingProgress === 0 && (
                    <button
                      onClick={handleStartReading}
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg"
                    >
                      <Play className="h-4 w-4" />
                      Start Reading
                    </button>
                  )}
                  {isReading && (
                    <button
                      onClick={() => setIsReading(false)}
                      className="flex items-center gap-2 rounded-lg bg-gray-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-gray-700"
                    >
                      <Pause className="h-4 w-4" />
                      Pause
                    </button>
                  )}
                </div>

                <div className="max-w-none">
                  <ContentRenderer content={currentModule.content} />
                </div>
              </div>

              {/* Code Example */}
              {currentModule.codeExample && (
                <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-xl backdrop-blur-sm">
                  <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
                    <Code className="h-5 w-5 text-blue-400" />
                    Code Example
                  </h3>
                  <CodeBlock code={currentModule.codeExample} />
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-xl backdrop-blur-sm">
                <div>
                  {!isFirstModule ? (
                    <button
                      onClick={handlePreviousModule}
                      className="flex items-center gap-2 font-medium text-gray-300 transition-colors hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous Module
                    </button>
                  ) : (
                    <div></div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {readingProgress >= 100 && !completedModules.includes(currentModule.moduleId) && (
                    <button
                      onClick={handleCompleteModule}
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-5 py-2.5 font-medium text-white transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-green-700 hover:shadow-lg"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark as Complete
                    </button>
                  )}

                  {!isLastModule && (
                    <button
                      onClick={handleNextModule}
                      className={`flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium transition-all duration-200 ${
                        !completedModules.includes(currentModule.moduleId) && readingProgress < 100
                          ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:scale-105 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg'
                      }`}
                      disabled={
                        !completedModules.includes(currentModule.moduleId) && readingProgress < 100
                      }
                    >
                      Next Module
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}

                  {isLastModule && completedModules.includes(currentModule.moduleId) && (
                    <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-5 py-2.5 font-medium text-white transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-green-700 hover:shadow-lg">
                      <Award className="h-4 w-4" />
                      Complete Course
                    </button>
                  )}
                </div>
              </div>

              {/* Course Completion */}
              {completedModules.length === courseMaterial.modules.length && (
                <div className="animate-pulse rounded-2xl border-2 border-green-400/30 bg-slate-800/60 p-8 text-center shadow-xl backdrop-blur-sm">
                  <Award className="mx-auto mb-4 h-16 w-16 text-green-400" />
                  <h3 className="mb-2 text-3xl font-bold text-green-400">Congratulations!</h3>
                  <p className="mb-6 text-lg text-gray-200">
                    You have successfully completed all modules in this course.
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <button className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-green-700 hover:shadow-lg">
                      View Certificate
                    </button>
                    <button
                      onClick={() => {
                        setCurrentModuleIndex(0);
                        setReadingProgress(0);
                        setIsReading(false);
                      }}
                      className="flex items-center gap-2 rounded-lg border border-gray-400 bg-slate-700/50 px-6 py-3 font-medium text-gray-200 transition-all duration-200 hover:scale-105 hover:bg-slate-700 hover:text-white"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Review Course
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info - Only show in development */}
      <DebugInfo
        actor={actor}
        courseId={courseId}
        isEnrolled={isEnrolled}
        courseInfo={courseInfo}
        courseMaterial={courseMaterial}
        error={error}
      />
    </div>
  );
}
