// FIXED LearningPage.tsx - Data Persistence on Refresh
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, useScroll } from 'framer-motion';
import { toast } from 'sonner';
import { actor as createActor } from '@/lib/actor';
import { getAuthClient } from '@/lib/authClient';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from 'declarations/eduverse_backend/eduverse_backend.did';

// Components
import LearningHeader from './components/LearningHeader';
import CourseSidebar from './components/CourseSidebar';
import ModuleHeader from './components/ModuleHeader';
import ModuleContent from './components/ModuleContent';
import ModuleNavigation from './components/ModuleNavigation';
import FinalQuizSection from './components/FinalQuizSection';
import LearningProgressSection from './components/LearningProgressSection';
import AccessDenied from './components/AccessDenied';
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
  BackendCompletionStatus,
} from '@/services/learningService';
import { Certificate as FrontendCertificate } from '@/types/certificate';
import { Certificate as BackendCertificate } from 'declarations/eduverse_backend/eduverse_backend.did';

// ===== FIXED: PERSISTENT DATA STORAGE =====

const LEARNING_PAGE_STORAGE_KEY = 'eduverse_learning_page_data';
const STORAGE_VERSION = '1.0.0';

interface PersistedLearningData {
  version: string;
  userId: string;
  courseId: number;
  courseMaterial: CourseMaterial | null;
  courseInfo: CourseInfo | null;
  userProgress: UserProgress | null;
  quizResults: QuizResult[];
  userCertificate: FrontendCertificate | null;
  backendCompletionStatus: BackendCompletionStatus | null;
  isEnrolled: boolean;
  timestamp: number;
}

const saveToStorage = (data: PersistedLearningData) => {
  try {
    localStorage.setItem(LEARNING_PAGE_STORAGE_KEY, JSON.stringify(data));
    console.log(`💾 Learning page data saved for user: ${data.userId.slice(0, 20)}...`);
  } catch (error) {
    console.warn('⚠️ Could not save learning page data:', error);
  }
};

const loadFromStorage = (userId: string, courseId: number): PersistedLearningData | null => {
  try {
    const stored = localStorage.getItem(LEARNING_PAGE_STORAGE_KEY);
    if (!stored) return null;

    const data: PersistedLearningData = JSON.parse(stored);

    // Validate data
    if (
      data.version !== STORAGE_VERSION ||
      data.userId !== userId ||
      data.courseId !== courseId ||
      Date.now() - data.timestamp > 24 * 60 * 60 * 1000 // 24 hours expiry
    ) {
      console.log('📦 Stored data invalid or expired, will fetch fresh');
      return null;
    }

    console.log(`♻️ Loading cached learning data for user: ${userId.slice(0, 20)}...`);
    return data;
  } catch (error) {
    console.warn('⚠️ Could not load learning page data:', error);
    return null;
  }
};

// ===== TYPES =====

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
  quizResult: any;
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

// ===== HELPER FUNCTIONS =====

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

// ===== FIXED USER ID MANAGEMENT =====

const USER_ID_STORAGE_KEY = 'eduverse_authenticated_user_id';
const USER_SESSION_KEY = 'eduverse_user_session_data';

interface UserSession {
  userId: string;
  principal: string;
  isAuthenticated: boolean;
  lastSeen: number;
  profileData?: UserProfile;
}

const saveUserSession = (session: UserSession) => {
  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(USER_ID_STORAGE_KEY, session.userId);
    console.log(`💾 User session saved: ${session.userId.slice(0, 20)}...`);
  } catch (error) {
    console.warn('⚠️ Could not save user session:', error);
  }
};

const loadUserSession = (): UserSession | null => {
  try {
    const stored = localStorage.getItem(USER_SESSION_KEY);
    if (!stored) return null;

    const session: UserSession = JSON.parse(stored);

    // Session valid for 24 hours
    if (Date.now() - session.lastSeen > 24 * 60 * 60 * 1000) {
      console.log('🕐 User session expired');
      return null;
    }

    console.log(`♻️ Loading user session: ${session.userId.slice(0, 20)}...`);
    return session;
  } catch (error) {
    console.warn('⚠️ Could not load user session:', error);
    return null;
  }
};

// ===== MAIN COMPONENT =====

export default function LearningPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading('learning-page');

  // FIXED: Persistent state management
  const [currentView, setCurrentView] = useState<'learning' | 'quiz'>('learning');
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();

  // FIXED: Data persistence state
  const [isDataRestored, setIsDataRestored] = useState(false);
  const [restorationAttempted, setRestorationAttempted] = useState(false);

  // State variables with persistence
  const [courseMaterial, setCourseMaterial] = useState<CourseMaterial | null>(null);
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // FIXED: User and auth states with session management
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [actor, setActor] = useState<ActorSubclass<_SERVICE> | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isInitializingUser, setIsInitializingUser] = useState(true);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [userStateManager] = useState(() => UserStateManager.getInstance());
  const [persistentUserState, setPersistentUserState] = useState<PersistentUserState | null>(null);

  // Quiz and certificate states
  const [currentQuiz, setCurrentQuiz] = useState<EnhancedCourseQuiz | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [userCertificate, setUserCertificate] = useState<FrontendCertificate | null>(null);
  const [finalQuizData, setFinalQuizData] = useState<EnhancedCourseQuiz | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  const [backendCompletionStatus, setBackendCompletionStatus] =
    useState<BackendCompletionStatus | null>(null);
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(false);

  const learningService = useLearningService(actor);

  // FIXED: Enhanced learning progress hook with stable user ID
  const [learningState, learningActions] = useLearningProgress(
    Number(courseId) || 0,
    courseMaterial,
    actor,
    currentUserId || undefined
  );

  // Reading and time tracking hooks
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

  // ===== FIXED DATA RESTORATION =====

  const restoreDataFromCache = useCallback(
    (userId: string, courseIdNum: number) => {
      if (restorationAttempted) return false;
      setRestorationAttempted(true);

      console.log(
        `📦 Attempting to restore cached data for user: ${userId.slice(0, 20)}..., course: ${courseIdNum}`
      );

      const cachedData = loadFromStorage(userId, courseIdNum);
      if (!cachedData) {
        console.log('📦 No valid cached data found');
        return false;
      }

      // Restore state from cache
      if (cachedData.courseMaterial) {
        setCourseMaterial(cachedData.courseMaterial);
        console.log('♻️ Course material restored from cache');
      }

      if (cachedData.courseInfo) {
        setCourseInfo(cachedData.courseInfo);
        console.log('♻️ Course info restored from cache');
      }

      if (cachedData.userProgress) {
        setUserProgress(cachedData.userProgress);
        console.log('♻️ User progress restored from cache');
      }

      if (cachedData.quizResults) {
        setQuizResults(cachedData.quizResults);
        console.log('♻️ Quiz results restored from cache');
      }

      if (cachedData.userCertificate) {
        setUserCertificate(cachedData.userCertificate);
        console.log('♻️ User certificate restored from cache');
      }

      if (cachedData.backendCompletionStatus) {
        setBackendCompletionStatus(cachedData.backendCompletionStatus);
        console.log('♻️ Backend completion status restored from cache');
      }

      setIsEnrolled(cachedData.isEnrolled);
      setIsDataRestored(true);

      toast.success('📦 Learning data restored from cache!', {
        description: 'Your progress has been preserved',
        duration: 3000,
      });

      console.log('✅ Data restoration completed');
      return true;
    },
    [restorationAttempted]
  );

  const persistDataToCache = useCallback(() => {
    if (!currentUserId || !courseId || !isDataRestored) return;

    const dataToSave: PersistedLearningData = {
      version: STORAGE_VERSION,
      userId: currentUserId,
      courseId: Number(courseId),
      courseMaterial,
      courseInfo,
      userProgress,
      quizResults,
      userCertificate,
      backendCompletionStatus,
      isEnrolled,
      timestamp: Date.now(),
    };

    saveToStorage(dataToSave);
  }, [
    currentUserId,
    courseId,
    courseMaterial,
    courseInfo,
    userProgress,
    quizResults,
    userCertificate,
    backendCompletionStatus,
    isEnrolled,
    isDataRestored,
  ]);

  // Auto-save data changes
  useEffect(() => {
    if (isDataRestored) {
      persistDataToCache();
    }
  }, [persistDataToCache, isDataRestored]);

  // ===== FIXED USER INITIALIZATION =====

  useEffect(() => {
    const initializeUserAndActor = async () => {
      try {
        console.log('🔐 Initializing User Session and Actor...');
        setIsInitializingUser(true);
        startLoading();

        // STEP 1: Try to restore user session
        const savedSession = loadUserSession();
        if (savedSession) {
          console.log('♻️ Restoring user session');
          setUserSession(savedSession);
          setCurrentUserId(savedSession.userId);
          if (savedSession.profileData) setUserProfile(savedSession.profileData);
        }

        // STEP 2: Initialize Internet Identity and Actor
        const authClient = await getAuthClient();
        const identity = authClient.getIdentity();
        const principal = identity.getPrincipal();
        const newActor = await createActor(identity);
        setActor(newActor);

        let finalUserId: string;
        let userName = 'Anonymous User';
        let isAuthenticated = false;

        if (principal.isAnonymous()) {
          console.warn('⚠️ User is anonymous');
          if (savedSession) {
            finalUserId = savedSession.userId;
            userName = persistentUserState?.userName || 'Anonymous User';
          } else {
            finalUserId = `anonymous-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          }
        } else {
          finalUserId = principal.toString();
          isAuthenticated = true;
          console.log('✅ User authenticated:', finalUserId.slice(0, 20) + '...');

          // Try to get profile
          try {
            const profileResult = await newActor.getMyProfile();
            if (profileResult && profileResult.length > 0) {
              const convertedProfile = convertBigIntToString(profileResult[0]);
              setUserProfile(convertedProfile);
              userName = convertedProfile.name;
            }
          } catch (profileError) {
            console.warn('⚠️ Could not load user profile:', profileError);
          }
        }

        // STEP 3: Update user ID and save session
        setCurrentUserId(finalUserId);

        const newSession: UserSession = {
          userId: finalUserId,
          principal: principal.toString(),
          isAuthenticated,
          lastSeen: Date.now(),
          profileData: userProfile || undefined,
        };

        saveUserSession(newSession);
        setUserSession(newSession);

        // STEP 4: Initialize legacy user state for compatibility
        const newUserState: PersistentUserState = {
          userId: finalUserId,
          userName,
          principal: principal.toString(),
          lastSeen: Date.now(),
          profileData: userProfile || undefined,
        };

        userStateManager.saveUserState(newUserState);
        setPersistentUserState(newUserState);

        // STEP 5: Try to restore cached data if available
        if (courseId) {
          const wasRestored = restoreDataFromCache(finalUserId, Number(courseId));
          if (wasRestored) {
            setIsDataRestored(true);
          }
        }

        console.log('✅ User and Actor initialization completed');
      } catch (error) {
        console.error('❌ Failed to initialize user and actor:', error);
        setError('Failed to initialize connection');
        toast.error('Failed to initialize connection. Please refresh the page.');

        // Fallback user ID with session
        const fallbackUserId = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setCurrentUserId(fallbackUserId);

        const fallbackSession: UserSession = {
          userId: fallbackUserId,
          principal: 'fallback',
          isAuthenticated: false,
          lastSeen: Date.now(),
        };
        saveUserSession(fallbackSession);
        setUserSession(fallbackSession);

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

  // ===== FIXED COURSE DATA FETCHING =====

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!actor || !courseId || !currentUserId || isInitializingUser) {
        console.log('⏳ Waiting for dependencies...');
        return;
      }

      // Skip fetching if data was already restored from cache
      if (isDataRestored) {
        console.log('✅ Data already restored from cache, skipping fetch');
        return;
      }

      console.log(
        `📚 Fetching fresh course data for User: ${currentUserId.slice(0, 20)}..., Course: ${courseId}`
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

            // Enhanced progress restoration
            await restoreUserProgressEnhanced(courseIdNum, service);
            await loadFinalQuizData(Number(courseIdNum), enhancedMaterials, service);

            // Check completion status
            await checkCompletionStatus();

            // Mark data as fresh and enable persistence
            setIsDataRestored(true);
          } else {
            setError(materialsResult.err || 'Failed to load course materials');
          }
        } else {
          // Mark data as loaded even if not enrolled
          setIsDataRestored(true);
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
  }, [actor, courseId, currentUserId, isInitializingUser, isDataRestored]);

  // ===== COMPLETION STATUS CHECKING =====

  const checkCompletionStatus = useCallback(async () => {
    if (!actor || !courseId || isCheckingCompletion) return null;

    setIsCheckingCompletion(true);
    try {
      console.log(`🎓 Checking completion status for course ${courseId}`);

      const rawBackendStatus = await actor.getCourseCompletionStatus(BigInt(courseId));

      if (!rawBackendStatus) {
        console.log('❌ No completion status found - user not enrolled');
        setBackendCompletionStatus(null);
        return null;
      }

      let convertedStatus = convertBigIntToString(rawBackendStatus);

      // Handle Array responses
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

      // Validate required fields
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
        const fallbackStatus = await calculateFallbackStatus();
        setBackendCompletionStatus(fallbackStatus);
        return fallbackStatus;
      }

      setBackendCompletionStatus(convertedStatus);

      console.log('✅ Backend Completion Status Valid:', {
        isEnrolled: convertedStatus.isEnrolled,
        totalModules: convertedStatus.totalModules,
        completedModulesCount: convertedStatus.completedModulesCount,
        quizPassed: convertedStatus.quizPassed,
        quizScore: convertedStatus.quizScore,
        canGetCertificate: convertedStatus.canGetCertificate,
      });

      // Check for existing certificate if eligible
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

      const progressResult = await actor.getMyProgress(BigInt(courseId));
      let progress = null;
      if (progressResult) {
        progress = convertBigIntToString(progressResult);

        if (!progress.completedModules || !Array.isArray(progress.completedModules)) {
          progress.completedModules = [];
        }

        if (typeof progress.overallProgress !== 'number') {
          progress.overallProgress = 0;
        }
      }

      const materialsResult = await actor.getCourseMaterials(BigInt(courseId));
      let totalModules = 0;
      if ('ok' in materialsResult) {
        const materials = convertBigIntToString(materialsResult.ok);
        totalModules = materials.modules?.length || 0;
      }

      const completedModules = progress?.completedModules || [];
      const completedModulesCount = completedModules.length;
      const overallProgress = progress?.overallProgress || 0;

      const hasQuizResult = !!progress?.quizResult;
      const quizPassed = hasQuizResult ? progress.quizResult.passed || false : false;
      const quizScore = hasQuizResult ? progress.quizResult.score || 0 : 0;

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

  // ===== PROGRESS RESTORATION =====

  const restoreUserProgressEnhanced = async (courseIdNum: bigint, service: LearningService) => {
    if (!actor || !currentUserId) return;

    try {
      console.log('📊 Restoring user progress...');

      const progressResult = await actor.getMyProgress(courseIdNum);
      if (progressResult) {
        const convertedProgress = convertBigIntToString(progressResult);

        if (!convertedProgress.completedModules) {
          convertedProgress.completedModules = [];
        }

        if (typeof convertedProgress.overallProgress !== 'number') {
          convertedProgress.overallProgress = 0;
        }

        setUserProgress(convertedProgress);

        console.log('📈 Progress restored:', {
          completedModules: convertedProgress.completedModules.length,
          overallProgress: convertedProgress.overallProgress,
          hasQuizResult: !!convertedProgress.quizResult,
        });

        if (convertedProgress.quizResult) {
          const singleQuizResult: QuizResult = {
            moduleId: 1,
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

  // ===== CERTIFICATE MANAGEMENT =====

  const checkAndGenerateCertificate = async () => {
    if (!actor || !courseId || !currentUserId) {
      console.warn('Missing dependencies for certificate check');
      return;
    }

    try {
      console.log('🎓 Checking for certificate eligibility...');
      startLoading();

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

      if (userCertificate) {
        console.log('📜 Certificate already exists:', userCertificate.tokenId);
        navigate(`/certificate/${userCertificate.tokenId}`);
        toast.success('🎉 Certificate found!');
        return;
      }

      if (status.canGetCertificate) {
        console.log('✅ User is eligible for certificate');

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

  // ===== EVENT HANDLERS =====

  const handleQuizComplete = async (quizResult: any) => {
    console.log('🎯 Quiz completed with result:', quizResult);

    try {
      startLoading();

      const compatibleQuizResult: QuizResult = {
        moduleId: quizResult.moduleId || 1,
        score: quizResult.score || 0,
        passed: quizResult.passed || false,
        courseId: quizResult.courseId,
        userId: quizResult.userId ? quizResult.userId.toString() : currentUserId || 'unknown',
        completedAt: quizResult.completedAt,
        answers: quizResult.answers,
      };

      const newQuizResults = [
        ...quizResults.filter((r) => r.courseId !== compatibleQuizResult.courseId),
        compatibleQuizResult,
      ];
      setQuizResults(newQuizResults);

      setCurrentQuiz(null);
      setCurrentView('learning');

      if (quizResult.passed) {
        console.log('✅ Quiz passed! Score:', quizResult.score);
        toast.success(`🎉 Quiz passed with ${quizResult.score}%! Checking for certificate...`);

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

  const handleEnroll = async () => {
    if (!actor || !courseId || !currentUserId) return;

    setIsEnrolling(true);
    startLoading();

    try {
      const result = await actor.enrollCourse(BigInt(courseId));

      if ('ok' in result) {
        toast.success(result.ok);
        setIsEnrolled(true);

        if (userSession) {
          const updatedSession: UserSession = {
            ...userSession,
            lastSeen: Date.now(),
          };
          saveUserSession(updatedSession);
        }

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

  // ===== HELPER FUNCTIONS =====

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

  const handleViewCertificate = () => {
    if (userCertificate) {
      navigate(`/certificate/${userCertificate.tokenId}`);
    } else {
      navigate('/certificate');
    }
  };

  const handleViewAllCertificates = () => {
    navigate('/certificate');
  };

  const handleShareCertificate = () => {
    if (userCertificate) {
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
      {/* FIXED: Data Status Indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-20 right-4 z-50 rounded-lg bg-black/80 p-2 text-xs text-white">
          <div>User: {currentUserId?.slice(0, 10)}...</div>
          <div>Data: {isDataRestored ? '💾 Cached' : '🔄 Fresh'}</div>
          <div>Session: {userSession?.isAuthenticated ? '✅ Auth' : '👤 Anon'}</div>
        </div>
      )}

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
              {/* Enhanced Completion Status Info Banner */}
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

                    {/* Action Buttons */}
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

              {/* Final Quiz Section */}
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

              {/* FIXED: Enhanced Debug Information with data persistence status */}
              {process.env.NODE_ENV === 'development' && (
                <motion.div
                  className="mt-6 rounded-lg border border-gray-600/50 bg-gray-800/30 p-4 font-mono text-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <h4 className="mb-2 text-gray-400">Debug Information (Dev Only)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1 text-gray-500">
                      <div>
                        <span className="text-gray-400">User ID:</span>{' '}
                        {currentUserId?.slice(0, 20)}...
                      </div>
                      <div>
                        <span className="text-gray-400">User Session:</span>{' '}
                        {userSession?.isAuthenticated ? '✅ Authenticated' : '👤 Anonymous'}
                      </div>
                      <div>
                        <span className="text-gray-400">Data Status:</span>{' '}
                        {isDataRestored ? '💾 Persisted' : '🔄 Loading'}
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
                    </div>
                    <div className="space-y-1 text-gray-500">
                      <div>
                        <span className="text-gray-400">Frontend Completed:</span>{' '}
                        {learningState.completedModules.length}
                      </div>
                      <div>
                        <span className="text-gray-400">Backend Completed:</span>{' '}
                        {backendCompletionStatus?.completedModulesCount || 'N/A'}
                      </div>
                      <div>
                        <span className="text-gray-400">Overall Progress:</span>{' '}
                        {Math.round(learningState.overallProgress)}%
                      </div>
                      <div>
                        <span className="text-gray-400">Quiz Results:</span> {quizResults.length}
                      </div>
                      <div>
                        <span className="text-gray-400">Quiz Passed:</span>{' '}
                        {backendCompletionStatus?.quizPassed ? '✅' : '❌'}
                      </div>
                      <div>
                        <span className="text-gray-400">Has Certificate:</span> {!!userCertificate}
                      </div>
                    </div>
                    <div className="space-y-1 text-gray-500">
                      <div>
                        <span className="text-gray-400">Storage Restored:</span>{' '}
                        {restorationAttempted ? '✅' : '❌'}
                      </div>
                      <div>
                        <span className="text-gray-400">Cached Data Valid:</span>{' '}
                        {isDataRestored ? '✅' : '❌'}
                      </div>
                      <div>
                        <span className="text-gray-400">User Init Done:</span>{' '}
                        {!isInitializingUser ? '✅' : '⏳'}
                      </div>
                      <div>
                        <span className="text-gray-400">Backend Status:</span>{' '}
                        {!!backendCompletionStatus ? '✅' : '❌'}
                      </div>
                      <div>
                        <span className="text-gray-400">Learning Service:</span>{' '}
                        {!!learningService ? '✅' : '❌'}
                      </div>
                      <div>
                        <span className="text-gray-400">Session Timestamp:</span>{' '}
                        {userSession?.lastSeen
                          ? new Date(userSession.lastSeen).toLocaleTimeString()
                          : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Debug Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={checkCompletionStatus}
                      disabled={isCheckingCompletion}
                      className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isCheckingCompletion ? 'Checking...' : 'Refresh Status'}
                    </button>
                    <button
                      onClick={() => {
                        console.log('=== DEBUG DATA DUMP ===');
                        console.log('User Session:', userSession);
                        console.log('User Progress:', userProgress);
                        console.log('Quiz Results:', quizResults);
                        console.log('Backend Status:', backendCompletionStatus);
                        console.log('Learning State:', learningState);
                        console.log('Certificate:', userCertificate);
                        console.log('Data Restored:', isDataRestored);
                        console.log('Restoration Attempted:', restorationAttempted);
                        console.log('========================');
                      }}
                      className="rounded bg-gray-600 px-3 py-1 text-xs text-white hover:bg-gray-700"
                    >
                      Log Debug Data
                    </button>
                    <button
                      onClick={() => {
                        // Clear cache and reload
                        localStorage.removeItem(LEARNING_PAGE_STORAGE_KEY);
                        toast.success('Cache cleared, reloading...');
                        setTimeout(() => window.location.reload(), 1000);
                      }}
                      className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                    >
                      Clear Cache & Reload
                    </button>
                    <button
                      onClick={persistDataToCache}
                      className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
                    >
                      Force Save Cache
                    </button>
                    <button
                      onClick={() => navigate('/certificate')}
                      className="rounded bg-purple-600 px-3 py-1 text-xs text-white hover:bg-purple-700"
                    >
                      Test Cert Page
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
