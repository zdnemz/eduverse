// Fixed LearningPage.tsx - Removed moduleId error and aligned with learningService
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
import {
  LearningService,
  useLearningService,
  EnhancedCourseQuiz,
  EnhancedQuizResult,
} from '@/services/learningService';
import { Certificate as FrontendCertificate } from '@/types/certificate';

// Import backend certificate type with alias to avoid naming conflict
import { Certificate as BackendCertificate } from 'declarations/eduverse_backend/eduverse_backend.did';

// Types (aligned with learningService)
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

// FIXED: QuizResult interface yang kompatibel dengan CourseSidebar
interface QuizResult {
  moduleId: number;
  score: number;
  passed: boolean;
  courseId?: number;
  userId?: string;
  completedAt?: number;
  answers?: any[];
}

// Helper functions
const convertBigIntToString = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigIntToString);
  if (typeof obj === 'object') {
    // Handle Principal objects specifically
    if (obj.toString && typeof obj.toString === 'function' && obj._arr) {
      // This is likely a Principal object
      return obj.toString();
    }
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted;
  }
  return obj;
};

// FIXED: Helper function untuk mengkonversi EnhancedQuizResult ke QuizResult dengan handling Principal
const convertEnhancedQuizResultsToQuizResults = (
  enhancedResults: EnhancedQuizResult[],
  fallbackUserId: string
): QuizResult[] => {
  return enhancedResults.map((result) => ({
    moduleId: 1, // Default moduleId karena quiz final
    score: result.score,
    passed: result.passed,
    courseId: result.courseId,
    userId:
      typeof result.userId === 'object' && result.userId.toString
        ? result.userId.toString()
        : fallbackUserId,
    completedAt: result.completedAt,
    answers: result.answers,
  }));
};

// FIXED: Certificate type conversion helper matching backend schema
const convertBackendCertificate = (backendCert: BackendCertificate): FrontendCertificate => {
  // Convert BigInt values to numbers for frontend use
  const converted = convertBigIntToString(backendCert);

  return {
    tokenId: Number(converted.tokenId),
    userId: converted.userId.toString(), // Principal to string
    courseId: Number(converted.courseId),
    courseName: converted.courseName,
    completedAt: Number(converted.completedAt),
    issuer: converted.issuer,
    certificateHash: converted.certificateHash,
    metadata: {
      name: converted.metadata?.name || `${converted.courseName} Certificate`,
      description:
        converted.metadata?.description ||
        `Certificate of completion for ${converted.courseName} course`,
      image: converted.metadata?.image || `/certificates/${converted.tokenId}.png`,
      attributes: converted.metadata?.attributes || [
        { trait_type: 'Course', value: converted.courseName },
        { trait_type: 'Issuer', value: converted.issuer },
        { trait_type: 'Token ID', value: String(converted.tokenId) },
        {
          trait_type: 'Issue Date',
          value: new Date(Number(converted.completedAt)).toLocaleDateString(),
        },
      ],
    },
  };
};

export default function LearningPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { startLoading, stopLoading } = useLoading('learning-page');
  const [currentView, setCurrentView] = useState<'learning' | 'quiz' | 'certificate'>('learning');
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const [courseMaterial, setCourseMaterial] = useState<CourseMaterial | null>(null);
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Quiz and Certificate states - FIXED: Using proper QuizResult type
  const [currentQuiz, setCurrentQuiz] = useState<EnhancedCourseQuiz | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [userCertificate, setUserCertificate] = useState<FrontendCertificate | null>(null);
  const [finalQuizData, setFinalQuizData] = useState<EnhancedCourseQuiz | null>(null);
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
      currentUserId && !isInitializingUser && actor && learningState.currentModule
        ? (progress) => {
            learningActions.updateReadingProgress(progress);
          }
        : () => {
            console.log('⏳ Reading progress update skipped - user not ready');
          }
    );

  // Time tracking hook
  const { timeSpent: sessionTimeSpent } = useTimeTracking(
    Number(courseId) || 0,
    learningState.currentModule?.moduleId || 0,
    !!(currentView === 'learning' && currentUserId && !isInitializingUser && actor)
  );

  // Progress statistics hook
  const { statistics: globalStatistics, refreshStatistics } = useProgressStatistics();

  // User initialization
  useEffect(() => {
    const initializeUserAndActor = async () => {
      try {
        console.log('🔐 Initializing Internet Identity and Actor with persistence...');
        setIsInitializingUser(true);
        startLoading();

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

        const authClient = await getAuthClient();
        const identity = authClient.getIdentity();
        const principal = identity.getPrincipal();

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
          userId = principal.toString();
          console.log('✅ User authenticated with II, Principal:', userId.slice(0, 20) + '...');

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

  // Fetch course data
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

        const courseResult = await actor.getCourseById(courseIdNum);
        const convertedCourse = convertBigIntToString(courseResult);

        if (!convertedCourse || convertedCourse.length === 0) {
          setError('Course not found');
          stopLoading();
          return;
        }

        setCourseInfo(convertedCourse[0]);

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
            // FIXED: Convert backend certificate to frontend type
            const convertedCert = convertBackendCertificate(courseCert);
            setUserCertificate(convertedCert);
            setCurrentView('certificate');
            stopLoading();
            return;
          }

          const materialsResult = await actor.getCourseMaterials(courseIdNum);

          if ('ok' in materialsResult) {
            const convertedMaterials = convertBigIntToString(materialsResult.ok);
            const enhancedMaterials = {
              ...convertedMaterials,
              title: convertedCourse[0].title,
            };
            setCourseMaterial(enhancedMaterials);

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

  // Helper functions
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

      if (convertedQuizResults && Array.isArray(convertedQuizResults)) {
        const compatibleQuizResults: QuizResult[] = convertedQuizResults.map((result: any) => ({
          moduleId: result.moduleId || 1,
          score: result.score || 0,
          passed: result.passed || false,
          courseId: result.courseId,
          userId: result.userId ? result.userId.toString() : currentUserId,
          completedAt: result.completedAt,
          answers: result.answers,
        }));
        setQuizResults(compatibleQuizResults);
      } else {
        setQuizResults([]);
      }
    } catch (error) {
      console.error('❌ Error restoring progress:', error);
      setQuizResults([]);
    }
  };

  const loadFinalQuizData = async (courseIdNum: number, materials: CourseMaterial) => {
    if (!learningService) {
      console.warn('⚠️ Learning service not available');
      return;
    }

    try {
      setIsLoadingQuiz(true);
      console.log(`🎯 Loading final quiz for course: ${courseIdNum}`);

      const finalQuiz = await learningService.getFinalQuiz(courseIdNum);

      if (finalQuiz && finalQuiz.questions && finalQuiz.questions.length > 0) {
        console.log('✅ Final quiz loaded:', finalQuiz.title);
        setFinalQuizData(finalQuiz);
      } else {
        console.log('❌ No final quiz available for this course');
        setFinalQuizData(null);
      }
    } catch (error) {
      console.error('❌ Error loading final quiz:', error);
      setFinalQuizData(null);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  // ENHANCED: Function to check and generate certificate after quiz completion
  const checkAndGenerateCertificate = async () => {
    if (!actor || !courseId || !currentUserId || !learningService) {
      console.warn('Missing dependencies for certificate check');
      return;
    }

    try {
      console.log('Checking for certificate eligibility...');
      startLoading();

      // Use the comprehensive completion check from learning service
      const completionStatus = await learningService.checkCourseCompletion(Number(courseId));

      console.log('Completion status received:', completionStatus);

      // If certificate already exists, show it
      if (completionStatus.certificate) {
        console.log('Certificate already exists:', completionStatus.certificate.tokenId);
        // FIXED: Convert backend certificate to frontend type
        const convertedCert = convertBackendCertificate(completionStatus.certificate);
        setUserCertificate(convertedCert);
        setCurrentView('certificate');
        toast.success('Certificate retrieved successfully!');
        return;
      }

      // If eligible for certificate, generate it
      if (completionStatus.canGetCertificate) {
        console.log('User is eligible for certificate, generating...');

        // FIXED: Use getCertificate method from learningService instead
        const certificateResult = await learningService.getCertificate(Number(courseId));

        if (certificateResult) {
          console.log('Certificate generated successfully:', certificateResult.tokenId);
          // FIXED: Convert backend certificate to frontend type
          const convertedCert = convertBackendCertificate(certificateResult);
          setUserCertificate(convertedCert);
          setCurrentView('certificate');
          toast.success('Congratulations! Your certificate has been generated!');
        } else {
          throw new Error('Failed to generate certificate');
        }
      } else {
        // Provide specific feedback based on completion status
        if (!completionStatus.hasQuizPassed) {
          toast.warning('You need to pass the final quiz to earn your certificate');
        } else if (!completionStatus.isComplete) {
          toast.warning('Complete all course modules to earn your certificate');
        } else {
          toast.warning('Complete all requirements to earn your certificate');
        }
      }
    } catch (error) {
      console.error('Error checking/generating certificate:', error);
      toast.error('Failed to generate certificate. Please try again.');
    } finally {
      stopLoading();
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

  // FIXED: Simplified quiz start handler
  const handleStartQuiz = async () => {
    if (!actor || !courseId || !courseMaterial || !currentUserId || !learningService) return;

    setIsLoadingQuiz(true);
    startLoading();

    try {
      console.log('🎯 Starting final quiz...');

      // Load the actual final quiz from the service
      const finalQuiz = await learningService.getFinalQuiz(Number(courseId));

      if (finalQuiz) {
        setCurrentQuiz(finalQuiz);
        setCurrentView('quiz');
        console.log('✅ Quiz loaded and ready');
      } else {
        toast.error('No quiz available for this course');
      }
    } catch (error) {
      console.error('❌ Quiz loading error:', error);
      toast.error('Failed to load quiz. Please try again.');
    } finally {
      setIsLoadingQuiz(false);
      stopLoading();
    }
  };

  // UPDATED: Enhanced quiz completion handler dengan konversi tipe yang benar
  const handleQuizComplete = async (quizResult: any) => {
    console.log('Quiz completed with result:', quizResult);

    try {
      startLoading();

      // FIXED: Konversi ke format QuizResult yang kompatibel dengan sidebar
      const compatibleQuizResult: QuizResult = {
        moduleId: quizResult.moduleId || 1, // Default ke module 1 untuk final quiz
        score: quizResult.score || 0,
        passed: quizResult.passed || false,
        courseId: quizResult.courseId,
        userId: quizResult.userId ? quizResult.userId.toString() : currentUserId || 'unknown', // Konversi Principal ke string
        completedAt: quizResult.completedAt,
        answers: quizResult.answers,
      };

      // Update quiz results state dengan format yang benar
      const newQuizResults = [...quizResults, compatibleQuizResult];
      setQuizResults(newQuizResults);

      // Check if quiz passed
      if (quizResult.passed) {
        console.log('Quiz passed! Checking for certificate...');
        toast.success('Quiz passed! Checking for certificate...');

        // Clear current quiz first
        setCurrentQuiz(null);

        // Small delay to ensure backend is updated, then check certificate
        setTimeout(async () => {
          await checkAndGenerateCertificate();
        }, 2000); // Increased delay to ensure backend processing
      } else {
        console.log('Quiz failed, score:', quizResult.score);
        toast.error(`Quiz failed. Score: ${quizResult.score}%. Try again!`);
        setCurrentView('learning');
        setCurrentQuiz(null);
      }
    } catch (error) {
      console.error('Error handling quiz completion:', error);
      toast.error('Error processing quiz result');
      setCurrentView('learning');
      setCurrentQuiz(null);
    } finally {
      stopLoading();
    }
  };

  // REMOVED: handleQuizSubmit function as it's now handled by QuizComponent

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

  // Quiz View - UPDATED with proper completion handler
  if (currentView === 'quiz' && currentQuiz) {
    return (
      <QuizComponent
        courseId={Number(courseId)}
        learningService={learningService}
        currentUserId={currentUserId}
        onQuizComplete={handleQuizComplete} // FIXED: Use proper completion handler
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
                    <div>Quiz Results: {quizResults.length}</div>
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
