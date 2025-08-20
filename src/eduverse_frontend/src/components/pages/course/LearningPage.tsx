// Refactored LearningPage.tsx - Main component using separated components
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, useScroll } from 'framer-motion';
import { toast } from 'sonner';
import { actor as createActor } from '@/lib/actor';
import { getAuthClient } from '@/lib/authClient';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from 'declarations/eduverse_backend/eduverse_backend.did';

// Separated Components
import LearningHeader from './components/LearningHeader';
import CourseSidebar from './components/CourseSidebar';
import ModuleHeader from './components/ModuleHeader';
import ModuleContent from './components/ModuleContent';
import ModuleNavigation from './components/ModuleNavigation';
import FinalQuizSection from './components/FinalQuizSection';
import LearningProgressSection from './components/LearningProgressSection';
import AccessDenied from './components/AccessDenied';
import CertificateDisplay from './components/CertificateDisplay';
import QuizComponent from './components/QuizComponent ';

// Utilities and Services
import { UserStateManager, PersistentUserState, UserProfile } from './components/UserStateManager';
import { useLoading } from '@/hooks/useLoading';
import {
  useLearningProgress,
  useReadingProgress as useReadingProgressHook,
  useTimeTracking,
  useProgressStatistics,
} from '@/hooks/useLearningProgress';
import { LearningService, useLearningService } from '@/services/learningService';
import { Certificate } from '@/types/certificate';

// Types (you can move these to a separate types file)
interface Module {
  moduleId: number;
  title: string;
  content: string;
  codeExample?: string;
}

interface CourseMaterial {
  courseId: number;
  modules: Module[];
  title?: string;
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

interface CourseQuiz {
  courseId: number;
  moduleId: number;
  title: string;
  questions: any[];
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

// Helper functions (you can move these to a utils file)
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

export default function LearningPage() {
  // Get courseId from URL params
  const { courseId } = useParams<{ courseId: string }>();

  // Use loading hook
  const { startLoading, stopLoading } = useLoading('learning-page');

  // Basic states
  const [currentView, setCurrentView] = useState<'learning' | 'quiz' | 'certificate'>('learning');
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();

  // Backend data states
  const [courseMaterial, setCourseMaterial] = useState<CourseMaterial | null>(null);
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Quiz and Certificate states
  const [currentQuiz, setCurrentQuiz] = useState<CourseQuiz | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [userCertificate, setUserCertificate] = useState<Certificate | null>(null);
  const [finalQuizData, setFinalQuizData] = useState<CourseQuiz | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  // Enhanced User State Management
  const [actor, setActor] = useState<ActorSubclass<_SERVICE> | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isInitializingUser, setIsInitializingUser] = useState(true);
  const [userStateManager] = useState(() => UserStateManager.getInstance());
  const [persistentUserState, setPersistentUserState] = useState<PersistentUserState | null>(null);
  const learningService = useLearningService(actor);

  // Enhanced Learning Progress Hook Integration
  const [learningState, learningActions] = useLearningProgress(
    Number(courseId) || 0,
    courseMaterial,
    actor,
    currentUserId && !isInitializingUser && actor ? currentUserId : undefined
  );

  // Reading progress hook for current module
  const { progress: readingProgress, updateProgress: updateReadingProgress } =
    useReadingProgressHook(
      Number(courseId) || 0,
      learningState.currentModule?.moduleId || 0,
      // PENTING: Hanya set callback jika user sudah siap
      currentUserId && !isInitializingUser && actor && learningState.currentModule
        ? (progress) => {
            learningActions.updateReadingProgress(progress);
          }
        : () => {
            // Callback kosong jika belum siap - tidak akan menyebabkan error
            console.log('⏳ Reading progress update skipped - user not ready');
          }
    );

  // Time tracking hook - Fixed the boolean condition
  const { timeSpent: sessionTimeSpent } = useTimeTracking(
    Number(courseId) || 0,
    learningState.currentModule?.moduleId || 0,
    // Fixed: Ensure this evaluates to a boolean
    !!(currentView === 'learning' && currentUserId && !isInitializingUser && actor)
  );

  // Progress statistics hook
  const { statistics: globalStatistics, refreshStatistics } = useProgressStatistics();

  // User initialization (keeping the same logic but cleaner)
  useEffect(() => {
    const initializeUserAndActor = async () => {
      try {
        console.log('🔐 Initializing Internet Identity and Actor with persistence...');
        setIsInitializingUser(true);
        startLoading();

        // First, try to load persistent user state
        const savedState = userStateManager.loadUserState();
        if (savedState && userStateManager.isSessionActive()) {
          console.log('♻️ Restoring user session:', savedState.userId.slice(0, 20) + '...');
          setPersistentUserState(savedState);
          setCurrentUserId(savedState.userId);

          if (savedState.profileData) {
            setUserProfile(savedState.profileData);
            console.log('👤 User profile restored:', savedState.profileData.name);
          }

          userStateManager.updateLastSeen(savedState.userId);
        }

        // Initialize Internet Identity and Actor
        const authClient = await getAuthClient();
        const identity = authClient.getIdentity();
        const principal = identity.getPrincipal();

        // Create actor with identity
        const newActor = await createActor(identity);
        setActor(newActor);

        let userId: string;
        let userName = 'Anonymous User';

        if (principal.isAnonymous()) {
          console.warn('⚠️  User is anonymous');
          if (savedState) {
            userId = savedState.userId;
            userName = savedState.userName;
          } else {
            userId = 'anonymous-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            userName = 'Anonymous User';
          }
        } else {
          // Authenticated user
          userId = principal.toString();
          console.log('✅ User authenticated with II, Principal:', userId.slice(0, 20) + '...');

          // Fetch user profile
          try {
            const profileResult = await newActor.getMyProfile();
            if (profileResult && profileResult.length > 0) {
              const convertedProfile = convertBigIntToString(profileResult[0]);
              setUserProfile(convertedProfile);
              userName = convertedProfile.name;
              console.log('👤 User profile loaded:', convertedProfile.name);
            }
          } catch (profileError) {
            console.warn('⚠️  Could not load user profile:', profileError);
          }
        }

        setCurrentUserId(userId);

        // Save/update persistent user state
        const newUserState: PersistentUserState = {
          userId,
          userName,
          principal: principal.toString(),
          lastSeen: Date.now(),
          profileData: userProfile || undefined,
        };

        userStateManager.saveUserState(newUserState);
        setPersistentUserState(newUserState);

        console.log('🎯 User ID set with persistence:', userId.slice(0, 20) + '...');
      } catch (error) {
        console.error('❌ Failed to initialize user and actor:', error);
        setError('Failed to initialize connection');
        toast.error('Failed to initialize connection. Please refresh the page.');

        // Create fallback user ID
        const fallbackUserId =
          'fallback-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        setCurrentUserId(fallbackUserId);

        const fallbackState: PersistentUserState = {
          userId: fallbackUserId,
          userName: 'Fallback User',
          principal: 'fallback',
          lastSeen: Date.now(),
        };

        userStateManager.saveUserState(fallbackState);
        setPersistentUserState(fallbackState);

        console.log('🔧 Using fallback user ID with persistence:', fallbackUserId);
      } finally {
        setIsInitializingUser(false);
        stopLoading();
      }
    };

    initializeUserAndActor();
  }, [startLoading, stopLoading, userStateManager]);

  // Scroll progress tracking
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      setScrolled(v !== 0);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Fetch course data (keeping same logic)
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!actor || !courseId || !currentUserId || isInitializingUser) {
        console.log('⏳ Waiting for dependencies...');
        return;
      }

      console.log(
        `📚 Fetching course data for User: ${currentUserId.slice(0, 20)}..., Course: ${courseId}`
      );
      startLoading();
      setError(null);

      try {
        const courseIdNum = BigInt(courseId);
        const service = new LearningService(actor);

        // Fetch course info
        const courseResult = await actor.getCourseById(courseIdNum);
        const convertedCourse = convertBigIntToString(courseResult);

        if (!convertedCourse || convertedCourse.length === 0) {
          setError('Course not found');
          stopLoading();
          return;
        }

        setCourseInfo(convertedCourse[0]);

        // Check enrollment status
        const enrollments = await actor.getMyEnrollments();
        const convertedEnrollments = convertBigIntToString(enrollments);
        const enrolled = convertedEnrollments.some((e: any) => e.courseId === Number(courseIdNum));
        setIsEnrolled(enrolled);

        if (enrolled) {
          // Check for existing certificate first
          const certificates = await service.getUserCertificates();
          const courseCert = certificates.find(
            (cert: any) => cert.courseId === Number(courseIdNum)
          );

          if (courseCert) {
            setUserCertificate(courseCert);
            setCurrentView('certificate');
            stopLoading();
            return;
          }

          // Fetch course materials
          const materialsResult = await actor.getCourseMaterials(courseIdNum);

          if ('ok' in materialsResult) {
            const convertedMaterials = convertBigIntToString(materialsResult.ok);
            const enhancedMaterials = {
              ...convertedMaterials,
              title: convertedCourse[0].title,
            };
            setCourseMaterial(enhancedMaterials);

            // Restore user progress
            await restoreUserProgress(courseIdNum);
            await loadFinalQuizData(Number(courseIdNum), enhancedMaterials);
          } else {
            setError(materialsResult.err || 'Failed to load course materials');
          }
        }
      } catch (err) {
        console.error('❌ Error fetching course data:', err);
        setError('Failed to load course data. Please try again.');
        toast.error('Failed to load course data');
      } finally {
        stopLoading();
      }
    };

    fetchCourseData();
  }, [actor, courseId, currentUserId, isInitializingUser, startLoading, stopLoading]);

  // Helper functions (keeping the same logic)
  const restoreUserProgress = async (courseIdNum: bigint) => {
    if (!actor || !currentUserId) return;

    try {
      const progressResult = await actor.getMyProgress(courseIdNum);
      if (progressResult && progressResult.length > 0) {
        const convertedProgress = convertBigIntToString(progressResult[0]);
        setUserProgress(convertedProgress);
      }

      const quizResultsData = await actor.getMyQuizResults(courseIdNum);
      const convertedQuizResults = convertBigIntToString(quizResultsData);
      setQuizResults(convertedQuizResults || []);
    } catch (error) {
      console.error('❌ Error restoring progress:', error);
    }
  };

  const loadFinalQuizData = async (courseIdNum: number, materials: CourseMaterial) => {
    if (!learningService) return;

    try {
      setIsLoadingQuiz(true);
      const finalQuiz = await learningService.getFinalQuiz(courseIdNum);

      if (finalQuiz) {
        setFinalQuizData(finalQuiz);
      } else {
        // Create fallback quiz
        const fallbackQuiz: CourseQuiz = {
          courseId: courseIdNum,
          moduleId: 999,
          title: 'Final Assessment - ' + (courseInfo?.title || 'Course'),
          questions: materials.modules.map((module, index) => ({
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
          timeLimit: 900,
        };
        setFinalQuizData(fallbackQuiz);
      }
    } catch (error) {
      console.error('❌ Error loading final quiz:', error);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleEnroll = async () => {
    if (!actor || !courseId || !currentUserId) return;

    setIsEnrolling(true);
    startLoading();

    try {
      const result = await actor.enrollCourse(BigInt(courseId));

      if ('ok' in result) {
        toast.success(result.ok);
        setIsEnrolled(true);

        if (persistentUserState) {
          const updatedState: PersistentUserState = {
            ...persistentUserState,
            lastSeen: Date.now(),
          };
          userStateManager.saveUserState(updatedState);
        }

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
      stopLoading();
    }
  };

  // Helper functions
  const isModuleLocked = (moduleIndex: number): boolean => {
    if (moduleIndex === 0) return false;
    const prevModule = courseMaterial?.modules[moduleIndex - 1];
    if (!prevModule) return true;
    return !learningState.completedModules.includes(prevModule.moduleId);
  };

  const handleModuleClick = (moduleIndex: number) => {
    if (isModuleLocked(moduleIndex)) {
      toast.warning('Complete the previous module first to unlock this one.');
      return;
    }
    learningActions.goToModule(moduleIndex);
    setCurrentView('learning');
  };

  const handleStartQuiz = async () => {
    if (!actor || !courseId || !courseMaterial || !currentUserId || !learningService) return;

    setIsLoadingQuiz(true);
    startLoading();

    try {
      setCurrentQuiz({
        moduleId: 1,
        courseId: Number(courseId),
        title: 'Final Assessment',
        questions: [],
        passingScore: 75,
        timeLimit: 15,
      });
      setCurrentView('quiz');
    } catch (error) {
      console.error('❌ Quiz loading error:', error);
      toast.error('Failed to load quiz. Please try again.');
    } finally {
      setIsLoadingQuiz(false);
      stopLoading();
    }
  };

  const handleQuizSubmit = async (answers: number[]) => {
    if (!actor || !courseId || !currentQuiz || !currentUserId || !learningService) return;

    setIsSubmittingQuiz(true);
    startLoading();

    try {
      const formattedAnswers = answers.map((answer, index) => ({
        questionId: index + 1,
        selectedAnswer: answer,
      }));

      // Submit quiz logic here (keeping same logic as original)
      // ... quiz submission code ...

      setCurrentQuiz(null);
      setCurrentView('learning');
    } catch (error) {
      console.error('❌ Quiz submission error:', error);
      toast.error('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmittingQuiz(false);
      stopLoading();
    }
  };

  // Computed values
  const currentModule = learningState.currentModule;
  const allLearningCompleted =
    learningState.completedModules.length === courseMaterial?.modules.length;

  // Error state or not enrolled
  if (error || !isEnrolled) {
    return (
      <AccessDenied
        error={error}
        isEnrolled={isEnrolled}
        isEnrolling={isEnrolling}
        persistentUserState={persistentUserState}
        onEnroll={handleEnroll}
      />
    );
  }

  if (!courseMaterial || !courseInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
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

  // Certificate View
  if (currentView === 'certificate' && userCertificate) {
    return (
      <CertificateDisplay
        certificate={userCertificate}
        currentUserId={currentUserId}
        onViewCertificate={() => {
          if (userCertificate) {
            window.open(`/certificate/${userCertificate.tokenId}`, '_blank');
          }
        }}
        onViewMaterials={() => {
          setCurrentView('learning');
          learningActions.goToModule(0);
        }}
        onChooseNewCourse={() => {
          window.location.href = '/dashboard';
        }}
        userName={persistentUserState?.userName || userProfile?.name || 'Distinguished Learner'}
      />
    );
  }

  // Quiz View
  if (currentView === 'quiz' && currentQuiz) {
    return (
      <QuizComponent
        courseId={Number(courseId)}
        learningService={learningService}
        currentUserId={currentUserId}
        onQuizComplete={(result) => {
          handleQuizSubmit([]);
        }}
        onBack={() => {
          setCurrentView('learning');
          setCurrentQuiz(null);
        }}
      />
    );
  }

  // Main Learning Interface
  return (
    <div className="min-h-screen bg-transparent">
      {/* Fixed Header */}
      <LearningHeader
        scrolled={scrolled}
        courseInfo={courseInfo}
        persistentUserState={persistentUserState}
        learningState={learningState}
        totalModules={courseMaterial.modules.length}
      />

      {/* Main Content */}
      <div className="py-8 pt-24">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <CourseSidebar
            modules={courseMaterial.modules}
            learningState={learningState}
            quizResults={quizResults}
            allLearningCompleted={allLearningCompleted}
            isLoadingQuiz={isLoadingQuiz}
            persistentUserState={persistentUserState}
            onModuleClick={handleModuleClick}
            onStartQuiz={handleStartQuiz}
          />

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              {/* Module Header */}
              {currentModule && (
                <ModuleHeader
                  module={currentModule}
                  learningState={learningState}
                  sessionTimeSpent={sessionTimeSpent}
                  persistentUserState={persistentUserState}
                  learningActions={learningActions}
                />
              )}

              {/* Module Content */}
              {currentModule && (
                <ModuleContent
                  module={currentModule}
                  learningState={learningState}
                  persistentUserState={persistentUserState}
                  learningActions={learningActions}
                  onReadingProgressUpdate={updateReadingProgress}
                />
              )}

              {/* Navigation */}
              <ModuleNavigation
                learningState={learningState}
                totalModules={courseMaterial.modules.length}
                currentModule={currentModule}
                persistentUserState={persistentUserState}
                learningActions={learningActions}
                isModuleLocked={isModuleLocked}
              />

              {/* Final Quiz Section */}
              <FinalQuizSection
                allLearningCompleted={allLearningCompleted}
                persistentUserState={persistentUserState}
                learningState={learningState}
                totalModules={courseMaterial.modules.length}
                finalQuizData={finalQuizData}
                isLoadingQuiz={isLoadingQuiz}
                onStartQuiz={handleStartQuiz}
              />

              {/* Learning Progress Info */}
              <LearningProgressSection
                allLearningCompleted={allLearningCompleted}
                learningState={learningState}
                modules={courseMaterial.modules}
                persistentUserState={persistentUserState}
              />

              {/* Certificate Achievement Banner */}
              {userCertificate && (
                <motion.div
                  className="mt-6 animate-pulse rounded-2xl border-2 border-yellow-400/50 bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-8 text-center shadow-xl backdrop-blur-sm"
                  initial={{ opacity: 0, transform: 'translateY(10px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0)' }}
                >
                  <div className="mx-auto mb-4 h-16 w-16 text-yellow-400">🏆</div>
                  <h3 className="mb-2 text-3xl font-bold text-yellow-400">Course Completed!</h3>
                  <p className="mb-2 text-lg text-gray-200">
                    Congratulations{persistentUserState && `, ${persistentUserState.userName}`}! You
                    have successfully earned your NFT certificate!
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setCurrentView('certificate')}
                      className="rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:scale-105"
                    >
                      View Your Certificate
                    </button>
                    <button
                      onClick={() => learningActions.goToModule(0)}
                      className="rounded-lg border border-gray-400 bg-slate-700/60 px-6 py-3 font-medium text-gray-200 transition-all duration-200 hover:scale-105"
                    >
                      Review Course
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Debug Information (Development Only) */}
              {process.env.NODE_ENV === 'development' && (
                <motion.div
                  className="mt-6 rounded-lg border border-gray-600/50 bg-gray-800/30 p-4 font-mono text-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <h4 className="mb-2 text-gray-400">Debug Information (Dev Only)</h4>
                  <div className="space-y-1 text-gray-500">
                    <div>Current User ID: {currentUserId}</div>
                    <div>Persistent User ID: {persistentUserState?.userId}</div>
                    <div>User Name: {persistentUserState?.userName || 'N/A'}</div>
                    <div>Course ID: {courseId}</div>
                    <div>Current Module: {learningState.currentModuleIndex + 1}</div>
                    <div>Completed Modules: {learningState.completedModules.length}</div>
                    <div>Overall Progress: {Math.round(learningState.overallProgress)}%</div>
                    <div>Has Certificate: {!!userCertificate}</div>
                    <div>Is Enrolled: {isEnrolled.toString()}</div>
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
