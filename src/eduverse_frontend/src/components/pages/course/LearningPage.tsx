// FIXED LearningPage.tsx - Navigation to Certificate Routes
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, useScroll } from 'framer-motion';
import { toast } from 'sonner';
import { actor as createActor } from '@/lib/actor';
import { getAuthClient } from '@/lib/authClient';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from 'declarations/eduverse_backend/eduverse_backend.did';

// Components (removed CertificateDisplay import)
import LearningHeader from './components/LearningHeader';
import CourseSidebar from './components/CourseSidebar';
import ModuleHeader from './components/ModuleHeader';
import ModuleContent from './components/ModuleContent';
import ModuleNavigation from './components/ModuleNavigation';
import FinalQuizSection from './components/FinalQuizSection';
import LearningProgressSection from './components/LearningProgressSection';
import AccessDenied from './components/AccessDenied';
// REMOVED: import CertificateDisplay from '../certificate/CertificateDisplay';
import QuizComponent from './components/QuizComponent ';

// Services
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
  BackendCompletionStatus, // Added this import
} from '@/services/learningService';
import { Certificate as FrontendCertificate } from '@/types/certificate';
import { Certificate as BackendCertificate } from 'declarations/eduverse_backend/eduverse_backend.did';

// Types (same as before)
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
  quizResult: any; // Single quiz result, not array
  overallProgress: number;
  lastAccessed: number;
}

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
    if (obj.toString && typeof obj.toString === 'function' && obj._arr) {
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

const convertBackendCertificate = (backendCert: BackendCertificate): FrontendCertificate => {
  const converted = convertBigIntToString(backendCert);
  return {
    tokenId: Number(converted.tokenId),
    userId: converted.userId.toString(),
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
  const navigate = useNavigate(); // ADDED: Navigation hook
  const { startLoading, stopLoading } = useLoading('learning-page');

  // REMOVED: Certificate view state since we're using routes now
  const [currentView, setCurrentView] = useState<'learning' | 'quiz'>('learning');
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();

  // State variables
  const [courseMaterial, setCourseMaterial] = useState<CourseMaterial | null>(null);
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // User and auth states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [actor, setActor] = useState<ActorSubclass<_SERVICE> | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isInitializingUser, setIsInitializingUser] = useState(true);
  const [userStateManager] = useState(() => UserStateManager.getInstance());
  const [persistentUserState, setPersistentUserState] = useState<PersistentUserState | null>(null);

  // Quiz and certificate states
  const [currentQuiz, setCurrentQuiz] = useState<EnhancedCourseQuiz | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [userCertificate, setUserCertificate] = useState<FrontendCertificate | null>(null);
  const [finalQuizData, setFinalQuizData] = useState<EnhancedCourseQuiz | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  // FIXED: Use BackendCompletionStatus instead of CourseCompletionStatus for internal status
  const [backendCompletionStatus, setBackendCompletionStatus] =
    useState<BackendCompletionStatus | null>(null);
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(false);

  const learningService = useLearningService(actor);

  // Learning progress hook
  const [learningState, learningActions] = useLearningProgress(
    Number(courseId) || 0,
    courseMaterial,
    actor,
    currentUserId && !isInitializingUser && actor ? currentUserId : undefined
  );

  // Reading and time tracking hooks (same as before)
  const { progress: readingProgress, updateProgress: updateReadingProgress } =
    useReadingProgressHook(
      Number(courseId) || 0,
      learningState.currentModule?.moduleId || 0,
      currentUserId && !isInitializingUser && actor && learningState.currentModule
        ? (progress) => learningActions.updateReadingProgress(progress)
        : () => console.log('⏳ Reading progress update skipped - user not ready')
    );

  const { timeSpent: sessionTimeSpent } = useTimeTracking(
    Number(courseId) || 0,
    learningState.currentModule?.moduleId || 0,
    !!(currentView === 'learning' && currentUserId && !isInitializingUser && actor)
  );

  const { statistics: globalStatistics, refreshStatistics } = useProgressStatistics();

  // FIXED: Simplified completion status checking using backend method only
  const checkCompletionStatus = useCallback(async () => {
    if (!actor || !courseId || isCheckingCompletion) return null;

    setIsCheckingCompletion(true);
    try {
      console.log(`🎓 Checking completion status for course ${courseId}`);

      // FIXED: Get raw response from backend
      const rawBackendStatus = await actor.getCourseCompletionStatus(BigInt(courseId));

      if (!rawBackendStatus) {
        console.log('❌ No completion status found - user not enrolled');
        setBackendCompletionStatus(null);
        return null;
      }

      // FIXED: Handle both Array and Object responses
      let convertedStatus = convertBigIntToString(rawBackendStatus);

      // CRITICAL FIX: If response is Array, take first element
      if (Array.isArray(convertedStatus)) {
        console.log('🔧 Backend returned Array, extracting first element:', convertedStatus);
        if (convertedStatus.length > 0) {
          convertedStatus = convertedStatus[0];
        } else {
          console.log('❌ Empty array from backend');
          setBackendCompletionStatus(null);
          return null;
        }
      }

      // FIXED: Validate all required fields exist
      const requiredFields = [
        'isEnrolled',
        'totalModules',
        'completedModules',
        'completedModulesCount',
        'overallProgress',
        'hasQuizResult',
        'quizPassed',
        'quizScore',
        'canGetCertificate',
      ];

      const missingFields = requiredFields.filter(
        (field) => convertedStatus[field] === undefined || convertedStatus[field] === null
      );

      if (missingFields.length > 0) {
        console.error('❌ Backend status missing fields:', missingFields, convertedStatus);

        // FALLBACK: Calculate manually if backend data incomplete
        const fallbackStatus = await calculateFallbackStatus();
        setBackendCompletionStatus(fallbackStatus);
        return fallbackStatus;
      }

      // SUCCESS: All fields present
      setBackendCompletionStatus(convertedStatus);

      console.log('✅ Backend Completion Status Valid:', {
        isEnrolled: convertedStatus.isEnrolled,
        totalModules: convertedStatus.totalModules,
        completedModulesCount: convertedStatus.completedModulesCount,
        quizPassed: convertedStatus.quizPassed,
        quizScore: convertedStatus.quizScore,
        canGetCertificate: convertedStatus.canGetCertificate,
      });

      // If can get certificate, check for existing certificate
      if (convertedStatus.canGetCertificate) {
        try {
          const certificates = await actor.getMyCertificates();
          if (certificates && certificates.length > 0) {
            const courseIdNum = Number(courseId);
            const courseCert = certificates.find(
              (cert: any) => Number(cert.courseId) === courseIdNum
            );
            if (courseCert) {
              console.log('📜 Certificate found:', courseCert.tokenId);
              const convertedCert = convertBackendCertificate(courseCert);
              setUserCertificate(convertedCert);
            } else {
              console.log('📜 No certificate found yet, might be generating...');
            }
          }
        } catch (certError) {
          console.warn('⚠️ Could not fetch certificates:', certError);
        }
      }

      return convertedStatus;
    } catch (error) {
      console.error('❌ Error checking completion status:', error);

      // FALLBACK: Try manual calculation
      console.log('🔄 Attempting fallback completion status calculation...');
      const fallbackStatus = await calculateFallbackStatus();
      setBackendCompletionStatus(fallbackStatus);
      return fallbackStatus;
    } finally {
      setIsCheckingCompletion(false);
    }
  }, [actor, courseId, isCheckingCompletion]);

  const calculateFallbackStatus = async (): Promise<BackendCompletionStatus | null> => {
    if (!actor || !courseId || !currentUserId) return null;

    try {
      console.log('🔄 Calculating fallback completion status...');

      // Get user progress
      const progressResult = await actor.getMyProgress(BigInt(courseId));
      let progress = null;
      if (progressResult) {
        progress = convertBigIntToString(progressResult);

        // CRITICAL FIX: Ensure completedModules is always an array
        if (!progress.completedModules || !Array.isArray(progress.completedModules)) {
          progress.completedModules = [];
        }

        // ADDITIONAL FIX: Ensure overallProgress is a number
        if (typeof progress.overallProgress !== 'number') {
          progress.overallProgress = 0;
        }
      }

      // Get course materials to know total modules
      const materialsResult = await actor.getCourseMaterials(BigInt(courseId));
      let totalModules = 0;
      if ('ok' in materialsResult) {
        const materials = convertBigIntToString(materialsResult.ok);
        totalModules = materials.modules?.length || 0;
      }

      // Calculate values with safe defaults
      const completedModules = progress?.completedModules || [];
      const completedModulesCount = completedModules.length;
      const overallProgress = progress?.overallProgress || 0;

      // Quiz results - FIXED: Handle both single result and array with null checks
      const hasQuizResult = !!progress?.quizResult;
      const quizPassed = hasQuizResult ? progress.quizResult.passed || false : false;
      const quizScore = hasQuizResult ? progress.quizResult.score || 0 : 0;

      // Certificate eligibility
      const isComplete = completedModulesCount >= totalModules && totalModules > 0;
      const canGetCertificate = isComplete && quizPassed;

      const fallbackStatus: BackendCompletionStatus = {
        isEnrolled: true,
        totalModules,
        completedModules: completedModules.map((id: any) => Number(id)),
        completedModulesCount,
        overallProgress: Number(overallProgress),
        hasQuizResult,
        quizPassed,
        quizScore: Number(quizScore),
        canGetCertificate,
      };

      console.log('📊 Fallback completion status calculated:', fallbackStatus);
      return fallbackStatus;
    } catch (error) {
      console.error('❌ Error in fallback calculation:', error);

      // FINAL FALLBACK: Return safe minimal status
      return {
        isEnrolled: true,
        totalModules: 0,
        completedModules: [],
        completedModulesCount: 0,
        overallProgress: 0,
        hasQuizResult: false,
        quizPassed: false,
        quizScore: 0,
        canGetCertificate: false,
      };
    }
  };

  // User initialization (same as before)
  useEffect(() => {
    const initializeUserAndActor = async () => {
      try {
        console.log('🔐 Initializing Internet Identity and Actor...');
        setIsInitializingUser(true);
        startLoading();

        const savedState = userStateManager.loadUserState();
        if (savedState && userStateManager.isSessionActive()) {
          console.log('♻️ Restoring user session:', savedState.userId.slice(0, 20) + '...');
          setPersistentUserState(savedState);
          setCurrentUserId(savedState.userId);
          if (savedState.profileData) setUserProfile(savedState.profileData);
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
          }
        } else {
          userId = principal.toString();
          console.log('✅ User authenticated:', userId.slice(0, 20) + '...');

          try {
            const profileResult = await newActor.getMyProfile();
            if (profileResult && profileResult.length > 0) {
              const convertedProfile = convertBigIntToString(profileResult[0]);
              setUserProfile(convertedProfile);
              userName = convertedProfile.name;
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
      } catch (error) {
        console.error('❌ Failed to initialize user and actor:', error);
        setError('Failed to initialize connection');
        toast.error('Failed to initialize connection. Please refresh the page.');

        // Fallback user ID
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
      } finally {
        setIsInitializingUser(false);
        stopLoading();
      }
    };

    initializeUserAndActor();
  }, []);

  // Scroll tracking
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => setScrolled(v !== 0));
    return () => unsubscribe();
  }, [scrollYProgress]);

  // FIXED: Enhanced course data fetching with better progress restoration
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

        // Get course info
        const courseResult = await actor.getCourseById(courseIdNum);
        const convertedCourse = convertBigIntToString(courseResult);

        if (!convertedCourse || convertedCourse.length === 0) {
          setError('Course not found');
          stopLoading();
          return;
        }

        setCourseInfo(convertedCourse[0]);

        // Check enrollment
        const enrollments = await actor.getMyEnrollments();
        const convertedEnrollments = convertBigIntToString(enrollments);
        const enrolled = convertedEnrollments.some((e: any) => e.courseId === Number(courseIdNum));
        setIsEnrolled(enrolled);

        if (enrolled) {
          // Load course materials
          const materialsResult = await actor.getCourseMaterials(courseIdNum);
          if ('ok' in materialsResult) {
            const convertedMaterials = convertBigIntToString(materialsResult.ok);
            const enhancedMaterials = {
              ...convertedMaterials,
              title: convertedCourse[0].title,
            };
            setCourseMaterial(enhancedMaterials);

            // FIXED: Enhanced progress restoration
            await restoreUserProgressEnhanced(courseIdNum, service);
            await loadFinalQuizData(Number(courseIdNum), enhancedMaterials, service);

            // FIXED: Check completion status after loading materials
            await checkCompletionStatus();
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
  }, [actor, courseId, currentUserId, isInitializingUser]);

  // FIXED: Enhanced progress restoration with better quiz result handling
  const restoreUserProgressEnhanced = async (courseIdNum: bigint, service: LearningService) => {
    if (!actor || !currentUserId) return;

    try {
      console.log('📊 Restoring user progress...');

      // Get user progress from backend
      const progressResult = await actor.getMyProgress(courseIdNum);
      if (progressResult) {
        const convertedProgress = convertBigIntToString(progressResult);

        // CRITICAL FIX: Ensure completedModules is always an array
        if (!convertedProgress.completedModules) {
          convertedProgress.completedModules = [];
        }

        // ADDITIONAL FIX: Ensure other required fields have defaults
        if (typeof convertedProgress.overallProgress !== 'number') {
          convertedProgress.overallProgress = 0;
        }

        setUserProgress(convertedProgress);

        console.log('📈 Progress restored:', {
          completedModules: convertedProgress.completedModules.length,
          overallProgress: convertedProgress.overallProgress,
          hasQuizResult: !!convertedProgress.quizResult,
        });

        // FIXED: Handle quiz result from progress (single result)
        if (convertedProgress.quizResult) {
          const singleQuizResult: QuizResult = {
            moduleId: 1, // Default for final quiz
            score: convertedProgress.quizResult.score || 0,
            passed: convertedProgress.quizResult.passed || false,
            courseId: convertedProgress.quizResult.courseId || Number(courseIdNum),
            userId: convertedProgress.quizResult.userId?.toString() || currentUserId,
            completedAt: convertedProgress.quizResult.completedAt || Date.now(),
            answers: convertedProgress.quizResult.answers || [],
          };
          setQuizResults([singleQuizResult]);
          console.log('🎯 Quiz result from progress:', singleQuizResult);
        } else {
          // Fallback: Try to get from quiz results endpoint
          try {
            const quizResultsData = await actor.getMyQuizResults(courseIdNum);
            const convertedQuizResults = convertBigIntToString(quizResultsData);

            if (
              convertedQuizResults &&
              Array.isArray(convertedQuizResults) &&
              convertedQuizResults.length > 0
            ) {
              const compatibleResults: QuizResult[] = convertedQuizResults.map((result: any) => ({
                moduleId: result.moduleId || 1,
                score: result.score || 0,
                passed: result.passed || false,
                courseId: result.courseId || Number(courseIdNum),
                userId: result.userId?.toString() || currentUserId,
                completedAt: result.completedAt || Date.now(),
                answers: result.answers || [],
              }));
              setQuizResults(compatibleResults);
              console.log('🎯 Quiz results from endpoint:', compatibleResults.length);
            } else {
              setQuizResults([]);
              console.log('📝 No quiz results found');
            }
          } catch (quizError) {
            console.warn('⚠️ Could not load quiz results:', quizError);
            setQuizResults([]);
          }
        }
      } else {
        // CRITICAL FIX: Handle case when no progress exists yet
        console.log('📝 No existing progress found - initializing empty progress');
        const emptyProgress = {
          userId: currentUserId,
          courseId: Number(courseIdNum),
          completedModules: [],
          quizResult: null,
          overallProgress: 0,
          lastAccessed: Date.now(),
        };
        setUserProgress(emptyProgress);
        setQuizResults([]);
      }
    } catch (error) {
      console.error('❌ Error restoring progress:', error);

      // FALLBACK: Create safe empty state
      console.log('🔄 Creating fallback empty progress state...');
      const fallbackProgress = {
        userId: currentUserId,
        courseId: Number(courseIdNum),
        completedModules: [],
        quizResult: null,
        overallProgress: 0,
        lastAccessed: Date.now(),
      };
      setUserProgress(fallbackProgress);
      setQuizResults([]);
    }
  };

  // FIXED: Enhanced quiz data loading
  const loadFinalQuizData = async (
    courseIdNum: number,
    materials: CourseMaterial,
    service: LearningService
  ) => {
    if (!service) return;

    try {
      setIsLoadingQuiz(true);
      console.log(`🎯 Loading final quiz for course: ${courseIdNum}`);

      const finalQuiz = await service.getFinalQuiz(courseIdNum);

      if (finalQuiz && finalQuiz.questions && finalQuiz.questions.length > 0) {
        console.log(
          '✅ Final quiz loaded:',
          finalQuiz.title,
          '- Questions:',
          finalQuiz.questions.length
        );
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

  // FIXED: Enhanced certificate checking and generation using backend status
  const checkAndGenerateCertificate = async () => {
    if (!actor || !courseId || !currentUserId) {
      console.warn('Missing dependencies for certificate check');
      return;
    }

    try {
      console.log('🎓 Checking for certificate eligibility...');
      startLoading();

      // FIXED: Use backend completion status directly
      const status = await checkCompletionStatus();

      if (!status) {
        toast.error('Failed to check course completion status');
        return;
      }

      console.log('📋 Backend Completion Status:', {
        canGetCertificate: status.canGetCertificate,
        quizPassed: status.quizPassed,
        completedModulesCount: status.completedModulesCount,
        totalModules: status.totalModules,
      });

      // Check if user already has certificate
      if (userCertificate) {
        console.log('📜 Certificate already exists:', userCertificate.tokenId);
        // FIXED: Navigate to certificate route instead of setting view
        navigate(`/certificate/${userCertificate.tokenId}`);
        toast.success('🎉 Certificate found!');
        return;
      }

      // If eligible for certificate
      if (status.canGetCertificate) {
        console.log('✅ User is eligible for certificate');

        // Wait a bit for backend to process, then check for certificate
        setTimeout(async () => {
          try {
            const certificates = await actor.getMyCertificates();
            if (certificates && certificates.length > 0) {
              const courseIdNum = Number(courseId);
              const courseCert = certificates.find(
                (cert: any) => Number(cert.courseId) === courseIdNum
              );
              if (courseCert) {
                console.log('📜 Certificate generated:', courseCert.tokenId);
                const convertedCert = convertBackendCertificate(courseCert);
                setUserCertificate(convertedCert);
                // FIXED: Navigate to certificate detail route
                navigate(`/certificate/${convertedCert.tokenId}`);
                toast.success('🎉 Congratulations! Your certificate has been generated!');
              } else {
                toast.warning(
                  'Certificate is being processed. Please wait a moment and check again.'
                );
              }
            } else {
              toast.warning('Certificate is being processed. Please check again in a moment.');
            }
          } catch (error) {
            console.error('Error in delayed certificate check:', error);
            toast.error('Failed to generate certificate. Please try again.');
          }
        }, 3000);

        toast.info('Certificate is being processed...', { duration: 3000 });
      } else {
        // Provide specific feedback
        if (!status.quizPassed) {
          toast.warning('❌ You need to pass the final quiz to earn your certificate');
          console.log('❌ Quiz not passed yet');
        } else if (status.completedModulesCount < status.totalModules) {
          toast.warning('❌ Complete all course modules to earn your certificate');
          console.log('❌ Not all modules completed');
        } else {
          toast.warning('❌ Complete all requirements to earn your certificate');
          console.log('❌ Requirements not met');
        }
      }
    } catch (error) {
      console.error('❌ Error checking/generating certificate:', error);
      toast.error('Failed to process certificate request. Please try again.');
    } finally {
      stopLoading();
    }
  };

  // FIXED: Enhanced quiz completion handler
  const handleQuizComplete = async (quizResult: any) => {
    console.log('🎯 Quiz completed with result:', quizResult);

    try {
      startLoading();

      // Convert to compatible format
      const compatibleQuizResult: QuizResult = {
        moduleId: quizResult.moduleId || 1,
        score: quizResult.score || 0,
        passed: quizResult.passed || false,
        courseId: quizResult.courseId,
        userId: quizResult.userId ? quizResult.userId.toString() : currentUserId || 'unknown',
        completedAt: quizResult.completedAt,
        answers: quizResult.answers,
      };

      // Update quiz results
      const newQuizResults = [
        ...quizResults.filter((r) => r.courseId !== compatibleQuizResult.courseId),
        compatibleQuizResult,
      ];
      setQuizResults(newQuizResults);

      // Clear current quiz
      setCurrentQuiz(null);
      setCurrentView('learning');

      if (quizResult.passed) {
        console.log('✅ Quiz passed! Score:', quizResult.score);
        toast.success(`🎉 Quiz passed with ${quizResult.score}%! Checking for certificate...`);

        // FIXED: Refresh completion status and check for certificate
        setTimeout(async () => {
          await checkCompletionStatus();
          await checkAndGenerateCertificate();
        }, 2000);
      } else {
        console.log('❌ Quiz failed, score:', quizResult.score);
        toast.error(`❌ Quiz failed. Score: ${quizResult.score}%. You can try again!`);
      }
    } catch (error) {
      console.error('❌ Error handling quiz completion:', error);
      toast.error('Error processing quiz result');
      setCurrentView('learning');
      setCurrentQuiz(null);
    } finally {
      stopLoading();
    }
  };

  // FIXED: Enhanced enrollment handler
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

        // Reload to refresh data
        setTimeout(() => window.location.reload(), 1000);
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

  // Helper functions (same as before)
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

  const handleModuleComplete = async (courseId: number, moduleId: number) => {
    if (!learningService || !currentUserId) {
      console.warn('Missing dependencies for module completion');
      return;
    }

    try {
      console.log(`✅ Marking module ${moduleId} as completed for course ${courseId}`);

      const result = await learningService.completeModule(courseId, moduleId);

      if ('ok' in result) {
        console.log('✅ Module marked as completed successfully');
        toast.success('Module completed! 🎉');

        // Refresh learning progress and completion status
        await learningActions.refresh();
        await checkCompletionStatus();
      } else {
        console.error('❌ Failed to mark module as completed:', result.err);
        toast.error('Failed to save module completion');
      }
    } catch (error) {
      console.error('❌ Error completing module:', error);
      toast.error('Error saving module progress');
    }
  };

  const handleStartQuiz = async () => {
    if (!actor || !courseId || !courseMaterial || !currentUserId || !learningService) return;

    setIsLoadingQuiz(true);
    startLoading();

    try {
      console.log('🎯 Starting final quiz...');

      const finalQuiz = await learningService.getFinalQuiz(Number(courseId));

      if (finalQuiz) {
        setCurrentQuiz(finalQuiz);
        setCurrentView('quiz');
        console.log('✅ Quiz loaded and ready, Questions:', finalQuiz.questions.length);
      } else {
        toast.error('❌ No quiz available for this course');
      }
    } catch (error) {
      console.error('❌ Quiz loading error:', error);
      toast.error('Failed to load quiz. Please try again.');
    } finally {
      setIsLoadingQuiz(false);
      stopLoading();
    }
  };

  // FIXED: Certificate navigation handlers
  const handleViewCertificate = () => {
    if (userCertificate) {
      navigate(`/certificate/${userCertificate.tokenId}`);
    } else {
      // Navigate to general certificate page to show all user's certificates
      navigate('/certificate');
    }
  };

  const handleViewAllCertificates = () => {
    navigate('/certificate');
  };

  const handleShareCertificate = () => {
    if (userCertificate) {
      // Open certificate in new tab for sharing
      window.open(`/certificate/${userCertificate.tokenId}`, '_blank');
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

  // REMOVED: Certificate view - now handled by routes

  // Quiz View
  if (currentView === 'quiz' && currentQuiz) {
    return (
      <QuizComponent
        courseId={Number(courseId)}
        learningService={learningService}
        currentUserId={currentUserId}
        onQuizComplete={handleQuizComplete}
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
              {/* FIXED: Enhanced Completion Status Info Banner using backend status */}
              {backendCompletionStatus && (
                <motion.div
                  className="rounded-xl border border-slate-600/50 bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-6 backdrop-blur-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          backendCompletionStatus.canGetCertificate
                            ? 'bg-green-400'
                            : backendCompletionStatus.quizPassed &&
                                backendCompletionStatus.completedModulesCount >=
                                  backendCompletionStatus.totalModules
                              ? 'bg-yellow-400'
                              : backendCompletionStatus.quizPassed
                                ? 'bg-blue-400'
                                : 'bg-red-400'
                        }`}
                      />
                      <div>
                        <h3 className="font-semibold text-white">
                          {backendCompletionStatus.canGetCertificate
                            ? '🏆 Ready for Certificate!'
                            : backendCompletionStatus.quizPassed &&
                                backendCompletionStatus.completedModulesCount >=
                                  backendCompletionStatus.totalModules
                              ? '⏳ Processing Certificate...'
                              : backendCompletionStatus.quizPassed
                                ? '📚 Complete Remaining Modules'
                                : backendCompletionStatus.completedModulesCount >=
                                    backendCompletionStatus.totalModules
                                  ? '🎯 Take the Final Quiz'
                                  : '📖 Continue Learning'}
                        </h3>
                        <p className="text-sm text-gray-300">
                          Modules: {backendCompletionStatus.completedModulesCount}/
                          {backendCompletionStatus.totalModules} • Quiz:{' '}
                          {backendCompletionStatus.quizPassed
                            ? `✅ Passed (${backendCompletionStatus.quizScore}%)`
                            : '❌ Not passed'}{' '}
                          • Certificate: {userCertificate ? '✅ Earned' : '⏳ Pending'}
                        </p>
                      </div>
                    </div>

                    {/* FIXED: Action Buttons with navigation */}
                    {userCertificate && (
                      <button
                        onClick={handleViewCertificate}
                        className="rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105"
                      >
                        View Certificate
                      </button>
                    )}
                    {!userCertificate && backendCompletionStatus.canGetCertificate && (
                      <button
                        onClick={checkAndGenerateCertificate}
                        disabled={isCheckingCompletion}
                        className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50"
                      >
                        {isCheckingCompletion ? '⏳ Processing...' : '🎓 Get Certificate'}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

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

              {/* FIXED: Enhanced Final Quiz Section using backend status */}
              <FinalQuizSection
                allLearningCompleted={
                  backendCompletionStatus
                    ? backendCompletionStatus.completedModulesCount >=
                      backendCompletionStatus.totalModules
                    : allLearningCompleted
                }
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

              {/* FIXED: Enhanced Certificate Achievement Banner with Route Navigation */}
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
                  <div className="mb-4 rounded-lg bg-slate-700/60 p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-semibold text-green-400">✅ Modules</div>
                        <div className="text-gray-300">
                          {backendCompletionStatus?.completedModulesCount ||
                            learningState.completedModules.length}
                          /{backendCompletionStatus?.totalModules || courseMaterial.modules.length}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-green-400">✅ Quiz</div>
                        <div className="text-gray-300">
                          {backendCompletionStatus?.quizScore ||
                            quizResults.find((q) => q.passed)?.score ||
                            0}
                          % Passed
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-yellow-400">🏆 Certificate</div>
                        <div className="text-gray-300">#{userCertificate.tokenId}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    {/* FIXED: Navigate to certificate routes */}
                    <button
                      onClick={handleViewCertificate}
                      className="rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:scale-105"
                    >
                      🎓 View Your Certificate
                    </button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="rounded-lg border border-yellow-400/50 bg-slate-700/60 px-6 py-3 font-medium text-gray-200 transition-all duration-200 hover:scale-105"
                    >
                      🏠 Back to Dashboard
                    </button>
                    <button
                      onClick={() => learningActions.goToModule(0)}
                      className="rounded-lg border border-gray-400 bg-slate-700/60 px-6 py-3 font-medium text-gray-200 transition-all duration-200 hover:scale-105"
                    >
                      📚 Review Course
                    </button>
                  </div>

                  {/* FIXED: Additional Certificate Actions */}
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={handleViewAllCertificates}
                      className="rounded-lg border border-gray-500/50 bg-slate-700/40 px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:scale-105"
                    >
                      📜 View All Certificates
                    </button>
                  </div>
                </motion.div>
              )}

              {/* FIXED: Enhanced Debug Information with backend status */}
              {process.env.NODE_ENV === 'development' && (
                <motion.div
                  className="mt-6 rounded-lg border border-gray-600/50 bg-gray-800/30 p-4 font-mono text-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <h4 className="mb-2 text-gray-400">Debug Information (Dev Only)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 text-gray-500">
                      <div>
                        <span className="text-gray-400">User ID:</span>{' '}
                        {currentUserId?.slice(0, 20)}...
                      </div>
                      <div>
                        <span className="text-gray-400">Persistent User:</span>{' '}
                        {persistentUserState?.userId.slice(0, 20)}...
                      </div>
                      <div>
                        <span className="text-gray-400">User Name:</span>{' '}
                        {persistentUserState?.userName || 'N/A'}
                      </div>
                      <div>
                        <span className="text-gray-400">Course ID:</span> {courseId}
                      </div>
                      <div>
                        <span className="text-gray-400">Current Module:</span>{' '}
                        {learningState.currentModuleIndex + 1}
                      </div>
                      <div>
                        <span className="text-gray-400">Is Enrolled:</span> {isEnrolled.toString()}
                      </div>
                      <div>
                        <span className="text-gray-400">Backend Status Available:</span>{' '}
                        {!!backendCompletionStatus}
                      </div>
                    </div>
                    <div className="space-y-1 text-gray-500">
                      <div>
                        <span className="text-gray-400">Frontend Completed Modules:</span>{' '}
                        {learningState.completedModules.length}
                      </div>
                      <div>
                        <span className="text-gray-400">Backend Completed Modules:</span>{' '}
                        {backendCompletionStatus?.completedModulesCount || 'N/A'}
                      </div>
                      <div>
                        <span className="text-gray-400">Overall Progress:</span>{' '}
                        {Math.round(learningState.overallProgress)}%
                      </div>
                      <div>
                        <span className="text-gray-400">Frontend Quiz Results:</span>{' '}
                        {quizResults.length}
                      </div>
                      <div>
                        <span className="text-gray-400">Backend Quiz Passed:</span>{' '}
                        {backendCompletionStatus?.quizPassed ? '✅' : '❌'}
                      </div>
                      <div>
                        <span className="text-gray-400">Backend Quiz Score:</span>{' '}
                        {backendCompletionStatus?.quizScore || 'N/A'}%
                      </div>
                      <div>
                        <span className="text-gray-400">Has Certificate:</span> {!!userCertificate}
                      </div>
                      <div>
                        <span className="text-gray-400">Can Get Certificate:</span>{' '}
                        {backendCompletionStatus?.canGetCertificate ? '✅' : '❌'}
                      </div>
                    </div>
                  </div>

                  {/* Manual Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={checkCompletionStatus}
                      disabled={isCheckingCompletion}
                      className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isCheckingCompletion ? 'Checking...' : 'Refresh Backend Status'}
                    </button>
                    <button
                      onClick={() => {
                        console.log('=== DEBUG INFO ===');
                        console.log('User Progress:', userProgress);
                        console.log('Frontend Quiz Results:', quizResults);
                        console.log('Backend Completion Status:', backendCompletionStatus);
                        console.log('Learning State:', learningState);
                        console.log('User Certificate:', userCertificate);
                        console.log('=================');
                      }}
                      className="rounded bg-gray-600 px-3 py-1 text-xs text-white hover:bg-gray-700"
                    >
                      Log Debug
                    </button>
                    <button
                      onClick={async () => {
                        if (actor && courseId) {
                          try {
                            const certificates = await actor.getMyCertificates();
                            console.log('Manual Certificate Check:', certificates);
                            if (certificates && certificates.length > 0) {
                              const courseCert = certificates.find(
                                (cert: any) => Number(cert.courseId) === Number(courseId)
                              );
                              if (courseCert) {
                                const converted = convertBackendCertificate(courseCert);
                                setUserCertificate(converted);
                                toast.success('Certificate found manually!');
                              }
                            }
                          } catch (error) {
                            console.error('Manual certificate check failed:', error);
                          }
                        }
                      }}
                      className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
                    >
                      Manual Cert Check
                    </button>
                    {/* FIXED: Add navigation test buttons */}
                    <button
                      onClick={() => navigate('/certificate')}
                      className="rounded bg-purple-600 px-3 py-1 text-xs text-white hover:bg-purple-700"
                    >
                      Test Cert Page
                    </button>
                    {userCertificate && (
                      <button
                        onClick={() => navigate(`/certificate/${userCertificate.tokenId}`)}
                        className="rounded bg-orange-600 px-3 py-1 text-xs text-white hover:bg-orange-700"
                      >
                        Test Cert Detail
                      </button>
                    )}
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
