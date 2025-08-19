// Enhanced LearningPage.tsx with proper Internet Identity integration and persistent user state - FIXED VERSION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
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
  Trophy,
  Star,
  XCircle,
  User,
  Brain,
  Target,
  Timer,
  Zap,
  BookOpenCheck,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';
import { actor as createActor } from '@/lib/actor';
import { getAuthClient } from '@/lib/authClient';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from 'declarations/eduverse_backend/eduverse_backend.did';
import { motion, useScroll } from 'framer-motion';
import { MOTION_TRANSITION } from '@/constants/motion';
import QuizComponent from './QuizComponent ';

// Import the loading hook
import { useLoading } from '@/hooks/useLoading';

// Import the enhanced hooks and storage - NOW PROPERLY USING IDENTITY
import {
  useLearningProgress,
  useReadingProgress as useReadingProgressHook,
  useTimeTracking,
  useProgressStatistics,
} from '@/hooks/useLearningProgress';
import { LearningService, useLearningService } from '@/services/learningService';

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

interface UserProfile {
  id: any;
  name: string;
  email: string[];
  createdAt: bigint;
  updatedAt: any[];
}

// ====== PERSISTENT USER STATE MANAGEMENT ======

interface PersistentUserState {
  userId: string;
  userName: string;
  principal: string;
  lastSeen: number;
  profileData?: UserProfile;
}

class UserStateManager {
  private static instance: UserStateManager;
  private readonly STORAGE_KEY = 'eduverse_user_state';
  private readonly SESSION_KEY = 'eduverse_session_active';

  static getInstance(): UserStateManager {
    if (!UserStateManager.instance) {
      UserStateManager.instance = new UserStateManager();
    }
    return UserStateManager.instance;
  }

  // Save user state to localStorage
  saveUserState(state: PersistentUserState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      sessionStorage.setItem(this.SESSION_KEY, 'true');
      console.log('💾 User state saved:', state.userId.slice(0, 20) + '...');
    } catch (error) {
      console.error('❌ Failed to save user state:', error);
    }
  }

  // Load user state from localStorage
  loadUserState(): PersistentUserState | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return null;

      const state: PersistentUserState = JSON.parse(saved);

      // Check if session is still valid (within 24 hours)
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (now - state.lastSeen > maxAge) {
        console.log('⏰ User state expired, clearing...');
        this.clearUserState();
        return null;
      }

      console.log('♻️ User state loaded:', state.userId.slice(0, 20) + '...');
      return state;
    } catch (error) {
      console.error('❌ Failed to load user state:', error);
      return null;
    }
  }

  // Update last seen timestamp
  updateLastSeen(userId: string): void {
    const existing = this.loadUserState();
    if (existing && existing.userId === userId) {
      existing.lastSeen = Date.now();
      this.saveUserState(existing);
    }
  }

  // Clear user state
  clearUserState(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.SESSION_KEY);
    console.log('🗑️ User state cleared');
  }

  // Check if session is active
  isSessionActive(): boolean {
    return sessionStorage.getItem(this.SESSION_KEY) === 'true';
  }
}

// Helper functions
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

const truncateTitle = (title: string, maxLength: number = 50) => {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + '...';
};

// Enhanced Content Renderer with proper identity-based progress tracking
const ContentRenderer: React.FC<{
  content: string;
  onProgressUpdate?: (progress: number) => void;
}> = ({ content, onProgressUpdate }) => {
  const [visibleElements, setVisibleElements] = useState(new Set<number>());
  const lines = content.split('\n').filter((line) => line.trim() !== '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          if (entry.isIntersecting) {
            setVisibleElements((prev) => new Set([...prev, index]));
          }
        });
      },
      {
        threshold: 0.7,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    // Observe all content elements
    const elements = document.querySelectorAll('[data-index]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [content]);

  useEffect(() => {
    if (onProgressUpdate && lines.length > 0) {
      const progress = Math.min(100, (visibleElements.size / lines.length) * 100);
      onProgressUpdate(progress);
    }
  }, [visibleElements, lines.length, onProgressUpdate]);

  return (
    <div className="prose prose-slate max-w-none">
      {lines.map((line, index) => {
        const key = `line-${index}`;
        const dataIndex = index;

        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <h3
              key={key}
              data-index={dataIndex}
              className="mt-6 mb-3 text-lg font-bold text-gray-800"
            >
              {line.replace(/\*\*/g, '')}
            </h3>
          );
        } else if (line.startsWith('- **') && line.includes('**:')) {
          const match = line.match(/- \*\*(.*?)\*\*: (.*)/);
          if (match) {
            return (
              <li key={key} data-index={dataIndex} className="mb-2 ml-6 list-disc text-white">
                <strong className="text-blue-600">{match[1]}</strong>: {match[2]}
              </li>
            );
          }
        } else if (line.startsWith('- ')) {
          return (
            <li key={key} data-index={dataIndex} className="mb-1 ml-6 list-disc text-white">
              {line.substring(2)}
            </li>
          );
        } else if (line.match(/^\d+\. /)) {
          return (
            <li key={key} data-index={dataIndex} className="mb-1 ml-6 list-decimal text-white">
              {line.replace(/^\d+\. /, '')}
            </li>
          );
        } else if (line.trim() === '') {
          return <br key={key} />;
        } else {
          return (
            <p key={key} data-index={dataIndex} className="mb-4 leading-relaxed text-white">
              {line}
            </p>
          );
        }
      })}
    </div>
  );
};

// Enhanced Code Block Component
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

// Certificate Display Component - ENHANCED WITH NAVY DESIGN
const CertificateDisplay: React.FC<{
  certificate: Certificate;
  onViewCertificate: () => void;
  onViewMaterials: () => void;
  onChooseNewCourse: () => void;
  userName?: string;
  currentUserId?: string | null;
}> = ({
  certificate,
  onViewCertificate,
  onViewMaterials,
  onChooseNewCourse,
  userName,
  currentUserId,
}) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
      <div className="w-full max-w-4xl">
        {/* Certificate Container - WHITE BACKGROUND */}
        <div className="border-navy-200 mx-auto max-w-3xl rounded-2xl border-4 bg-white p-8 shadow-2xl">
          {/* Certificate Content */}
          <div className="border-navy-300 from-navy-50 relative rounded-lg border-4 bg-gradient-to-br to-blue-50 p-8 text-center">
            {/* Decorative Elements */}
            <div className="border-navy-200 absolute top-4 left-4 h-16 w-16 rounded-full border-4 opacity-20"></div>
            <div className="border-navy-200 absolute top-4 right-4 h-16 w-16 rounded-full border-4 opacity-20"></div>
            <div className="border-navy-200 absolute bottom-4 left-4 h-12 w-12 rounded-full border-4 opacity-20"></div>
            <div className="border-navy-200 absolute right-4 bottom-4 h-12 w-12 rounded-full border-4 opacity-20"></div>

            {/* Certificate Header */}
            <div className="relative z-10">
              <div className="text-navy-600 mb-6">
                <GraduationCap size={80} className="mx-auto" />
              </div>

              <h1 className="text-navy-800 mb-4 text-4xl font-bold tracking-wide">
                CERTIFICATE OF COMPLETION
              </h1>

              <div className="from-navy-400 mx-auto mb-8 h-1 w-32 rounded-full bg-gradient-to-r to-blue-500"></div>

              <div className="text-navy-600 mb-6 text-lg font-medium">This is to certify that</div>

              {/* Student Name - ENHANCED STYLING */}
              <div className="relative mb-8">
                <div className="text-navy-800 mb-2 text-4xl font-bold tracking-wide">
                  {userName || 'Distinguished Learner'}
                </div>
                <div className="bg-navy-300 mx-auto h-0.5 w-64"></div>
                <div className="text-navy-500 mt-2 text-sm italic">Student Name</div>
              </div>

              <div className="text-navy-700 mb-6 text-lg leading-relaxed">
                has successfully completed the comprehensive course
              </div>

              {/* Course Name - ENHANCED STYLING */}
              <div className="relative mb-8">
                <div className="text-navy-800 mb-2 text-2xl leading-tight font-bold">
                  "{certificate.courseName}"
                </div>
                <div className="text-navy-500 text-sm italic">Course Title</div>
              </div>

              <div className="text-navy-600 mb-8">
                and has demonstrated mastery of all required competencies
                <br />
                to earn this blockchain-verified NFT certificate
              </div>

              {/* Certificate Details */}
              <div className="border-navy-200 mt-10 flex items-center justify-between border-t-2 pt-8">
                <div className="text-left">
                  <div className="text-navy-500 mb-1 text-sm tracking-wide uppercase">
                    Completion Date
                  </div>
                  <div className="text-navy-800 text-lg font-semibold">
                    {new Date(certificate.completedAt / 1000000).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="text-center">
                  <div className="from-navy-500 mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br to-blue-600">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-navy-600 text-sm font-medium">Verified</div>
                </div>

                <div className="text-right">
                  <div className="text-navy-500 mb-1 text-sm tracking-wide uppercase">Issuer</div>
                  <div className="text-navy-800 text-lg font-semibold">{certificate.issuer}</div>
                </div>
              </div>

              {/* Certificate Meta Info */}
              <div className="text-navy-400 border-navy-100 mt-8 border-t pt-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Certificate ID:</span> #{certificate.tokenId}
                  </div>
                  <div>
                    <span className="font-medium">Hash:</span>{' '}
                    {certificate.certificateHash.slice(0, 12)}...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - ENHANCED DESIGN */}
        <div className="mt-8 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={onViewCertificate}
              className="group from-navy-600 to-navy-700 hover:from-navy-700 hover:to-navy-800 flex items-center gap-3 rounded-xl bg-gradient-to-r px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <Award className="h-5 w-5 transition-transform group-hover:rotate-12" />
              View Full Certificate
            </button>

            <button
              onClick={onViewMaterials}
              className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
            >
              <BookOpen className="h-5 w-5 transition-transform group-hover:scale-110" />
              Review Materials
            </button>

            <button
              onClick={onChooseNewCourse}
              className="group border-navy-300 text-navy-700 hover:bg-navy-50 hover:border-navy-400 flex items-center gap-3 rounded-xl border-2 bg-white px-8 py-4 font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <BookOpenCheck className="h-5 w-5 transition-transform group-hover:scale-110" />
              Choose New Course
            </button>
          </div>

          {/* Share Certificate */}
          <div className="mt-6">
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  window.location.href + '/certificate/' + certificate.tokenId
                );
                toast.success('Certificate link copied to clipboard!');
              }}
              className="text-navy-600 hover:text-navy-800 decoration-navy-300 hover:decoration-navy-500 font-medium underline transition-colors"
            >
              📋 Share Certificate Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LearningPage() {
  // Get courseId from URL params
  const { courseId } = useParams<{ courseId: string }>();

  // Use loading hook instead of local loading states
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

  // ====== ENHANCED USER STATE MANAGEMENT ======
  const [actor, setActor] = useState<ActorSubclass<_SERVICE> | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isInitializingUser, setIsInitializingUser] = useState(true);
  const [userStateManager] = useState(() => UserStateManager.getInstance());
  const [persistentUserState, setPersistentUserState] = useState<PersistentUserState | null>(null);
  const learningService = useLearningService(actor);

  // Enhanced Learning Progress Hook Integration - NOW USING PROPER USER ID
  const [learningState, learningActions] = useLearningProgress(
    Number(courseId) || 0,
    courseMaterial,
    actor,
    currentUserId || undefined
  );

  // Reading progress hook for current module - IDENTITY INTEGRATED
  const { progress: readingProgress, updateProgress: updateReadingProgress } =
    useReadingProgressHook(
      Number(courseId) || 0,
      learningState.currentModule?.moduleId || 0,
      (progress) => {
        learningActions.updateReadingProgress(progress);
      }
    );

  // Time tracking hook - IDENTITY INTEGRATED
  const { timeSpent: sessionTimeSpent } = useTimeTracking(
    Number(courseId) || 0,
    learningState.currentModule?.moduleId || 0,
    currentView === 'learning'
  );

  // Progress statistics hook - IDENTITY INTEGRATED
  const { statistics: globalStatistics, refreshStatistics } = useProgressStatistics();

  // ====== ENHANCED USER INITIALIZATION WITH PERSISTENCE ======
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

          // Update last seen timestamp
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
          // If we have saved state, use that, otherwise create new anonymous ID
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

  // ====== PERSISTENT STATE RECOVERY ON PAGE LOAD ======
  useEffect(() => {
    const handlePageLoad = () => {
      // Additional recovery logic for page refresh
      if (!currentUserId && !isInitializingUser) {
        const savedState = userStateManager.loadUserState();
        if (savedState) {
          console.log(
            '🔄 Recovering user state after page refresh:',
            savedState.userId.slice(0, 20) + '...'
          );
          setCurrentUserId(savedState.userId);
          setPersistentUserState(savedState);

          if (savedState.profileData) {
            setUserProfile(savedState.profileData);
          }

          toast.success(`Welcome back, ${savedState.userName}!`, {
            description: 'Your progress has been restored.',
          });
        }
      }
    };

    // Handle page refresh/reload
    if (document.readyState === 'complete') {
      handlePageLoad();
    } else {
      window.addEventListener('load', handlePageLoad);
      return () => window.removeEventListener('load', handlePageLoad);
    }
  }, [currentUserId, isInitializingUser, userStateManager]);

  // ====== VISIBILITY CHANGE HANDLER FOR STATE PERSISTENCE ======
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentUserId && persistentUserState) {
        // Page is being hidden, save current state
        const updatedState: PersistentUserState = {
          ...persistentUserState,
          lastSeen: Date.now(),
          profileData: userProfile || undefined,
        };

        userStateManager.saveUserState(updatedState);
        console.log('💾 State saved on visibility change');
      } else if (!document.hidden && currentUserId) {
        // Page is visible again, update last seen
        userStateManager.updateLastSeen(currentUserId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUserId, persistentUserState, userProfile, userStateManager]);

  // ====== BEFOREUNLOAD HANDLER FOR STATE PERSISTENCE ======
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentUserId && persistentUserState) {
        const updatedState: PersistentUserState = {
          ...persistentUserState,
          lastSeen: Date.now(),
          profileData: userProfile || undefined,
        };

        userStateManager.saveUserState(updatedState);
        console.log('💾 State saved before page unload');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUserId, persistentUserState, userProfile, userStateManager]);

  // Scroll progress tracking
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      setScrolled(v !== 0);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Fetch course data - USING PROPER USER IDENTITY WITH PERSISTENCE
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!actor || !courseId || !currentUserId || isInitializingUser) {
        console.log('⏳ Waiting for dependencies...', {
          actor: !!actor,
          courseId,
          currentUserId: !!currentUserId,
          isInitializingUser,
        });
        return;
      }

      console.log(
        `📚 Fetching course data for User: ${currentUserId.slice(0, 20)}..., Course: ${courseId}`
      );
      startLoading();
      setError(null);

      try {
        const courseIdNum = BigInt(courseId);

        // Create learning service instance
        const service = new LearningService(actor);

        // Fetch course info
        console.log('📖 Fetching course info...');
        const courseResult = await actor.getCourseById(courseIdNum);
        const convertedCourse = convertBigIntToString(courseResult);

        if (!convertedCourse || convertedCourse.length === 0) {
          setError('Course not found');
          stopLoading();
          return;
        }

        setCourseInfo(convertedCourse[0]);
        console.log('✅ Course info loaded:', convertedCourse[0].title);

        // Check enrollment status
        console.log(`🎫 Checking enrollment for user: ${currentUserId.slice(0, 20)}...`);
        const enrollments = await actor.getMyEnrollments();
        const convertedEnrollments = convertBigIntToString(enrollments);
        const enrolled = convertedEnrollments.some((e: any) => e.courseId === Number(courseIdNum));
        setIsEnrolled(enrolled);

        console.log(`✅ Enrollment status: ${enrolled ? 'ENROLLED' : 'NOT ENROLLED'}`);

        if (enrolled) {
          // Check for existing certificate first
          console.log('🎓 Checking for existing certificate...');
          const certificates = await service.getUserCertificates();
          const courseCert = certificates.find(
            (cert: any) => cert.courseId === Number(courseIdNum)
          );

          if (courseCert) {
            setUserCertificate(courseCert);
            setCurrentView('certificate');
            console.log('🎓 Certificate found - redirecting to certificate view');
            stopLoading();
            return;
          }

          // Fetch course materials
          console.log('📘 Fetching course materials...');
          const materialsResult = await actor.getCourseMaterials(courseIdNum);

          if ('ok' in materialsResult) {
            const convertedMaterials = convertBigIntToString(materialsResult.ok);
            const enhancedMaterials = {
              ...convertedMaterials,
              title: convertedCourse[0].title,
            };
            setCourseMaterial(enhancedMaterials);
            console.log(
              '✅ Course materials loaded:',
              enhancedMaterials.modules?.length,
              'modules'
            );

            // Restore user progress
            await restoreUserProgress(courseIdNum);

            // Load final quiz data from Motoko backend
            await loadFinalQuizData(Number(courseIdNum), enhancedMaterials);

            // Check module quiz availability
            await checkModuleQuizAvailability(Number(courseIdNum));
          } else {
            setError(materialsResult.err || 'Failed to load course materials');
            console.error('❌ Failed to load materials:', materialsResult.err);
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

  // Restore user progress - USER-SPECIFIC PROGRESS RESTORATION WITH PERSISTENCE
  const restoreUserProgress = async (courseIdNum: bigint) => {
    if (!actor || !currentUserId) return;

    try {
      console.log(
        `📊 Restoring progress for User: ${currentUserId.slice(0, 20)}..., Course: ${Number(courseIdNum)}`
      );

      // Fetch backend progress for THIS USER
      const progressResult = await actor.getMyProgress(courseIdNum);
      if (progressResult && progressResult.length > 0) {
        const convertedProgress = convertBigIntToString(progressResult[0]);
        setUserProgress(convertedProgress);
        console.log(
          '✅ Backend progress restored for user:',
          currentUserId.slice(0, 20) + '...',
          'Progress:',
          convertedProgress.overallProgress + '%'
        );
      } else {
        console.log('ℹ️  No backend progress found for user:', currentUserId.slice(0, 20) + '...');
      }

      // Fetch quiz results for THIS USER
      const quizResultsData = await actor.getMyQuizResults(courseIdNum);
      const convertedQuizResults = convertBigIntToString(quizResultsData);
      setQuizResults(convertedQuizResults || []);
      console.log(
        '✅ Quiz results loaded for user:',
        currentUserId.slice(0, 20) + '...',
        convertedQuizResults?.length || 0,
        'results'
      );
    } catch (error) {
      console.error(
        '❌ Error restoring progress for user:',
        currentUserId.slice(0, 20) + '...',
        error
      );
    }
  };

  // Load final quiz data from backend
  const loadFinalQuizData = async (courseIdNum: number, materials: CourseMaterial) => {
    if (!actor || !learningService) return;

    try {
      console.log('🎯 Loading final quiz from Motoko backend for course:', courseIdNum);
      setIsLoadingQuiz(true);

      // ✅ FIXED: Use instance method instead of static
      const finalQuiz = await learningService.getFinalQuiz(courseIdNum);

      if (finalQuiz) {
        setFinalQuizData(finalQuiz);
        console.log('✅ Final quiz loaded from Motoko backend:', finalQuiz.title);
      } else {
        console.log('⚠️  No final quiz found in backend, creating fallback...');

        // Create fallback quiz only if no backend quiz exists
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
            correctAnswer: 1, // Index of correct answer
            explanation: `This covers the core concepts from the module: ${module.title}`,
          })),
          passingScore: 75,
          timeLimit: 900, // 15 minutes
        };

        setFinalQuizData(fallbackQuiz);
        console.log('✅ Fallback final quiz created');
      }
    } catch (error) {
      console.error('❌ Error loading final quiz:', error);

      // Create basic fallback on error
      const errorFallbackQuiz: CourseQuiz = {
        courseId: courseIdNum,
        moduleId: 999,
        title: 'Final Assessment - ' + (courseInfo?.title || 'Course'),
        questions: [
          {
            questionId: 1,
            question: 'What did you learn in this course?',
            options: [
              'Basic concepts',
              'Advanced techniques',
              'Practical skills',
              'All of the above',
            ],
            correctAnswer: 3,
            explanation: 'This course covered comprehensive learning across all areas.',
          },
        ],
        passingScore: 75,
        timeLimit: 300,
      };

      setFinalQuizData(errorFallbackQuiz);
      console.log('🔧 Error fallback quiz created');
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  // Handle enrollment - USER-SPECIFIC ENROLLMENT WITH PERSISTENCE
  const handleEnroll = async () => {
    if (!actor || !courseId || !currentUserId) return;

    console.log(`🎫 Enrolling user ${currentUserId.slice(0, 20)}... in course ${courseId}`);
    setIsEnrolling(true);
    startLoading();

    try {
      const result = await actor.enrollCourse(BigInt(courseId));

      if ('ok' in result) {
        toast.success(result.ok);
        setIsEnrolled(true);
        console.log('✅ Enrollment successful for user:', currentUserId.slice(0, 20) + '...');

        // Update persistent state
        if (persistentUserState) {
          const updatedState: PersistentUserState = {
            ...persistentUserState,
            lastSeen: Date.now(),
          };
          userStateManager.saveUserState(updatedState);
        }

        // Reload the page to fetch enrolled content
        window.location.reload();
      } else {
        setError(result.err || 'Failed to enroll in course');
        toast.error(result.err || 'Failed to enroll in course');
        console.error('❌ Enrollment failed:', result.err);
      }
    } catch (err) {
      setError('Failed to enroll in course. Please try again.');
      toast.error('Failed to enroll in course');
      console.error('❌ Enrollment error for user:', currentUserId.slice(0, 20) + '...', err);
    } finally {
      setIsEnrolling(false);
      stopLoading();
    }
  };

  // Helper functions using learning state - IDENTITY-AWARE
  const isModuleLocked = (moduleIndex: number) => {
    if (moduleIndex === 0) return false;
    const prevModule = courseMaterial?.modules[moduleIndex - 1];
    return prevModule && !learningState.completedModules.includes(prevModule.moduleId);
  };

  const canAccessQuiz = () => {
    if (!courseMaterial) return false;
    return courseMaterial.modules.every((module) =>
      learningState.completedModules.includes(module.moduleId)
    );
  };

  const handleModuleClick = (moduleIndex: number) => {
    if (isModuleLocked(moduleIndex)) {
      toast.warning('Complete the previous module first to unlock this one.');
      return;
    }

    console.log(`📖 User ${currentUserId?.slice(0, 20)}... switched to module ${moduleIndex + 1}`);
    learningActions.goToModule(moduleIndex);
    setCurrentView('learning');
  };

  const handleStartQuiz = async () => {
    if (!actor || !courseId || !courseMaterial || !currentUserId || !learningService) return;

    console.log(
      `🧠 User ${currentUserId.slice(0, 20)}... starting final quiz for course ${courseId}`
    );
    setIsLoadingQuiz(true);
    startLoading();

    try {
      setCurrentQuiz({
        moduleId: 1, 
        courseId: Number(courseId),
        title: 'Final Assessment',
        questions: [], // Akan diload oleh QuizComponent baru
        passingScore: 75,
        timeLimit: 15,
      });
      setCurrentView('quiz');
      console.log('✅ Quiz started for user:', currentUserId.slice(0, 20) + '...');
    } catch (error) {
      console.error('❌ Quiz loading error for user:', currentUserId.slice(0, 20) + '...', error);
      toast.error('Failed to load quiz. Please try again.');
    } finally {
      setIsLoadingQuiz(false);
      stopLoading();
    }
  };

  const handleQuizSubmit = async (answers: number[]) => {
    if (!actor || !courseId || !currentQuiz || !currentUserId || !learningService) return;

    console.log(`📝 User ${currentUserId.slice(0, 20)}... submitting quiz for course ${courseId}`);
    setIsSubmittingQuiz(true);
    startLoading();

    try {
      // Convert answers to the format expected by backend
      const formattedAnswers = answers.map((answer, index) => ({
        questionId: index + 1,
        selectedAnswer: answer,
      }));

      let quizResult: any = null;

      // Try to submit to Motoko backend first
      try {
        // ✅ FIXED: Use instance method instead of static
        quizResult = await learningService.submitQuiz(
          Number(courseId),
          currentQuiz.moduleId,
          formattedAnswers
        );

        if (quizResult) {
          console.log('✅ Quiz submitted to Motoko backend:', {
            score: quizResult.score,
            passed: quizResult.passed,
          });

          if (quizResult.passed) {
            toast.success(`🎉 Quiz passed with ${quizResult.score}%! Generating certificate...`);

            // Check for certificate after successful quiz
            setTimeout(async () => {
              try {
                // ✅ FIXED: Use instance method instead of static
                const certificates = await learningService.getUserCertificates();
                const courseCert = certificates.find(
                  (cert: any) => cert.courseId === Number(courseId)
                );

                if (courseCert) {
                  setUserCertificate(courseCert);
                  setCurrentView('certificate');

                  // Complete course in learning state
                  await learningActions.completeCourse(courseCert.tokenId);

                  // Update persistent state
                  if (persistentUserState) {
                    const updatedState: PersistentUserState = {
                      ...persistentUserState,
                      lastSeen: Date.now(),
                    };
                    userStateManager.saveUserState(updatedState);
                  }

                  toast.success('🎓 Congratulations! Your certificate has been generated!');
                  console.log('🎓 Certificate generated:', courseCert.tokenId);
                } else {
                  console.log('⏳ Certificate not yet available, may take a moment...');
                  toast.info('Certificate is being generated, please wait...');
                }
              } catch (certError) {
                console.error('❌ Error checking certificate:', certError);
              }
            }, 2000);
          } else {
            toast.error(
              `❌ Quiz failed with ${quizResult.score}%. You need ${currentQuiz.passingScore}% to pass.`
            );
            console.log('❌ Quiz failed:', quizResult.score + '%');
          }
        }
      } catch (backendError) {
        console.error('❌ Backend submission failed:', backendError);

        // Fallback calculation if Motoko backend fails
        console.log('🔧 Using fallback quiz calculation...');

        const correctAnswers = currentQuiz.questions.reduce((acc, question, index) => {
          return acc + (answers[index] === question.correctAnswer ? 1 : 0);
        }, 0);

        const score = Math.round((correctAnswers / currentQuiz.questions.length) * 100);
        const passed = score >= currentQuiz.passingScore;

        quizResult = {
          userId: currentUserId,
          courseId: Number(courseId),
          moduleId: currentQuiz.moduleId,
          score,
          passed,
          completedAt: Date.now() * 1000000,
          answers: formattedAnswers,
        };

        setQuizResults([quizResult]);
        console.log('🔧 Fallback quiz result calculated:', { score, passed });

        if (passed) {
          toast.success(`🎉 Quiz passed with ${score}%! Generating certificate...`);

          // Generate fallback certificate
          setTimeout(async () => {
            const fallbackCertificate: Certificate = {
              tokenId: Date.now(),
              userId: currentUserId,
              courseId: Number(courseId),
              courseName: courseInfo?.title || 'Course',
              completedAt: Date.now() * 1000000,
              issuer: 'Learning Platform',
              certificateHash: 'fallback-hash-' + Date.now(),
              metadata: {
                name: `Certificate - ${courseInfo?.title}`,
                description: `Certificate of completion for ${courseInfo?.title}`,
                image: '',
                attributes: [],
              },
            };

            setUserCertificate(fallbackCertificate);
            setCurrentView('certificate');

            // Complete course in learning state
            await learningActions.completeCourse(fallbackCertificate.tokenId);

            // Update persistent state
            if (persistentUserState) {
              const updatedState: PersistentUserState = {
                ...persistentUserState,
                lastSeen: Date.now(),
              };
              userStateManager.saveUserState(updatedState);
            }

            toast.success('🎓 Congratulations! Your certificate has been generated!');
            console.log('🎓 Fallback certificate generated');
          }, 1500);
        } else {
          toast.error(
            `❌ Quiz failed with ${score}%. You need ${currentQuiz.passingScore}% to pass.`
          );
        }
      }

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

  const checkModuleQuizAvailability = async (courseIdNum: number) => {
    if (!learningService) return {};

    try {
      console.log('📋 Checking module quiz availability...');

      // ✅ FIXED: Use instance method instead of static
      const availability = await learningService.getQuizAvailability(courseIdNum);
      console.log('✅ Module quiz availability:', availability);

      return availability;
    } catch (error) {
      console.error('❌ Error checking quiz availability:', error);
      return {};
    }
  };

  // Certificate view handlers
  const handleViewCertificate = () => {
    if (userCertificate) {
      window.open(`/certificate/${userCertificate.tokenId}`, '_blank');
    }
  };

  const handleViewMaterials = () => {
    setCurrentView('learning');
    learningActions.goToModule(0);
  };

  const handleChooseNewCourse = () => {
    window.location.href = '/dashboard';
  };

  // ====== USER STATE DISPLAY COMPONENT ======

  // Error state or not enrolled - USER-SPECIFIC MESSAGING WITH PERSISTENT STATE
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

          {/* Enhanced User Identity Display with Persistent State */}
          {persistentUserState && (
            <div className="mb-4 rounded-lg bg-slate-100 p-3">
              <div className="text-xs text-gray-500">Current User</div>
              <div className="text-sm font-medium text-gray-700">
                {persistentUserState.userName}
              </div>
              <div className="font-mono text-xs text-gray-500">
                ID: {persistentUserState.userId.slice(0, 20)}...
                {persistentUserState.userId.slice(-8)}
              </div>
              <div className="text-xs text-green-600">
                Session Active • Last seen:{' '}
                {new Date(persistentUserState.lastSeen).toLocaleTimeString()}
              </div>
            </div>
          )}

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

  const currentModule = learningState.currentModule;
  const allLearningCompleted =
    learningState.completedModules.length === courseMaterial.modules.length;

  // Certificate View - USER-SPECIFIC CERTIFICATE WITH ENHANCED DESIGN AND PERSISTENCE
  if (currentView === 'certificate' && userCertificate) {
    return (
      <CertificateDisplay
        certificate={userCertificate}
        currentUserId={currentUserId}
        onViewCertificate={handleViewCertificate}
        onViewMaterials={handleViewMaterials}
        onChooseNewCourse={handleChooseNewCourse}
        userName={persistentUserState?.userName || userProfile?.name || 'Distinguished Learner'}
      />
    );
  }

  // Quiz View - USER-SPECIFIC QUIZ WITH PERSISTENCE
  if (currentView === 'quiz' && currentQuiz) {
    return (
      <>
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
            courseId={Number(courseId)}
            moduleId={currentQuiz.moduleId}
            learningService={learningService}
            currentUserId={currentUserId}
            onQuizComplete={(result) => {
              // Handle quiz completion
              handleQuizSubmit([]); // Trigger existing completion logic
            }}
            onBack={() => {
              setCurrentView('learning');
              setCurrentQuiz(null);
            }}
          />
        </div>
      </>
    );
  }

  // Main Learning Interface - ENHANCED HEADER DESIGN WITH PERSISTENT USER STATE
  return (
    <div className="min-h-screen bg-transparent">
      {/* ENHANCED FIXED HEADER WITH PERSISTENT USER INFO */}
      <header
        className={cn(
          'fixed top-0 left-0 z-50 w-full transition-all duration-300',
          scrolled
            ? 'border-b border-slate-700/30 bg-slate-900/95 shadow-2xl backdrop-blur-xl'
            : 'bg-transparent'
        )}
      >
        <div className="px-6 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            {/* LEFT: Back Button */}
            <div className="flex items-center">
              <Link
                to="/dashboard"
                className="group flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/60 px-4 py-2.5 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:border-slate-600/50 hover:bg-slate-700/80"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
            </div>

            {/* CENTER: Course Info */}
            <div className="max-w-2xl flex-1 px-8 text-center">
              <h1
                className="mb-1 truncate text-xl font-bold text-white md:text-2xl"
                title={courseInfo.title}
              >
                {truncateTitle(courseInfo.title, 50)}
              </h1>
              <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <span>by</span>
                  <span className="font-medium text-blue-400 capitalize">
                    {courseInfo.instructor}
                  </span>
                </div>
                {persistentUserState && (
                  <div className="flex items-center gap-2">
                    -
                    <span className="font-medium text-green-400 capitalize">
                      {persistentUserState.userName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Progress & Stats */}
            <div className="flex items-center gap-4">
              {/* Module Info */}
              <div className="hidden items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-2 backdrop-blur-sm sm:flex">
                <BookOpen className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium whitespace-nowrap text-white">
                  {learningState.currentModuleIndex + 1}/{courseMaterial.modules.length}
                </span>
              </div>

              {/* Reading Progress Bar */}
              <div className="hidden flex-col items-center gap-1 md:flex">
                <div className="text-xs font-medium text-slate-400">Reading</div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-slate-700/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700 ease-out"
                      style={{ width: `${learningState.readingProgress}%` }}
                    />
                  </div>
                  <span className="min-w-[2.5rem] text-right text-xs font-bold text-green-400">
                    {Math.round(learningState.readingProgress)}%
                  </span>
                </div>
              </div>

              {/* Overall Progress Circle */}
              <div className="flex flex-col items-center gap-1">
                <div className="text-xs font-medium text-slate-400">Progress</div>
                <div className="relative">
                  <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 36 36">
                    <path
                      className="text-slate-700/60"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      fill="transparent"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-blue-500 transition-all duration-1000 ease-out"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="transparent"
                      strokeDasharray={`${learningState.overallProgress}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-400">
                      {Math.round(learningState.overallProgress)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-8 pt-24">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar - Module List - USER-SPECIFIC PROGRESS WITH PERSISTENT STATE */}
          <div className="lg:col-span-1">
            <div className="sticky top-36">
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

                {/* Enhanced User Progress Summary with Persistent State */}
                <div className="mb-4 rounded-lg bg-slate-800/40 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Your Progress</span>
                    {persistentUserState && (
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-400"></div>
                        <span className="text-xs text-green-400">
                          {persistentUserState.userName}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-white">
                    {learningState.completedModules.length} of {courseMaterial.modules.length}{' '}
                    modules
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${learningState.overallProgress}%` }}
                    />
                  </div>
                  {persistentUserState && (
                    <div className="mt-2 text-xs text-slate-400">
                      User ID: {persistentUserState.userId.slice(-8)}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {courseMaterial.modules.map((module, index) => {
                    const moduleId = Number(module.moduleId);
                    const isUnlocked =
                      index === 0 ||
                      learningState.completedModules.includes(
                        courseMaterial.modules[index - 1]?.moduleId
                      );
                    const isCompleted = learningState.completedModules.includes(moduleId);
                    const isCurrent = learningState.currentModuleIndex === index;

                    // Enhanced quiz status from Motoko backend
                    const moduleQuizResult = quizResults.find((r) => r.moduleId === moduleId);
                    const hasQuiz = moduleQuizResult !== undefined; // Will be true if quiz exists in backend
                    const hasPassedQuiz = moduleQuizResult ? moduleQuizResult.passed : false;
                    const quizScore = moduleQuizResult ? moduleQuizResult.score : 0;

                    return (
                      <button
                        key={moduleId}
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
                          {/* Enhanced Status Icon with Quiz Info */}
                          <div
                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              hasPassedQuiz
                                ? 'bg-yellow-500 text-white' // Passed quiz
                                : hasQuiz && isCompleted
                                  ? 'bg-orange-500 text-white' // Has quiz but not taken
                                  : isCompleted
                                    ? 'bg-green-500 text-white' // Completed, no quiz
                                    : isCurrent && isUnlocked
                                      ? 'border-white bg-white/20 text-white'
                                      : isUnlocked
                                        ? 'border-gray-400 text-gray-400'
                                        : 'border-gray-500 text-gray-500'
                            }`}
                          >
                            {hasPassedQuiz ? (
                              <Star size={12} />
                            ) : hasQuiz && isCompleted ? (
                              <Brain size={12} />
                            ) : isCompleted ? (
                              <CheckCircle size={12} />
                            ) : !isUnlocked ? (
                              <Lock size={10} />
                            ) : (
                              <span>{index + 1}</span>
                            )}
                          </div>

                          {/* Content with Quiz Status */}
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
                              {hasPassedQuiz && <span className="ml-1">⭐ Quiz: {quizScore}%</span>}
                              {hasQuiz && !hasPassedQuiz && isCompleted && (
                                <span className="ml-1 text-orange-400">🧠 Quiz Available</span>
                              )}
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

                {/* Enhanced Learning Statistics with Persistent User Context */}
                {learningState.statistics && (
                  <div className="mt-4 rounded-lg bg-slate-800/40 p-4">
                    <h4 className="mb-3 text-sm font-semibold text-slate-300">
                      Your Learning Stats
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Time:</span>
                        <span className="text-white">
                          {Math.floor(learningState.statistics.totalTimeSpent / 60)} min
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Bookmarks:</span>
                        <span className="text-white">{learningState.statistics.bookmarkCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Notes:</span>
                        <span className="text-white">{learningState.statistics.noteCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Completion:</span>
                        <span className="text-white">
                          {Math.round(learningState.statistics.completionRate)}%
                        </span>
                      </div>
                      {persistentUserState && (
                        <div className="mt-2 flex justify-between border-t border-slate-600/50 pt-2">
                          <span className="text-slate-400">Student:</span>
                          <span className="text-green-400">{persistentUserState.userName}</span>
                        </div>
                      )}
                      <div className="mt-1 flex justify-between">
                        <span className="text-slate-400">Session:</span>
                        <span className="text-blue-400">
                          Active • {persistentUserState?.userId.slice(-6)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Main Content - USER-SPECIFIC LEARNING EXPERIENCE WITH PERSISTENT STATE */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              {/* Module Header - ENHANCED WITH PERSISTENT USER CONTEXT */}
              {currentModule && (
                <motion.div
                  className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow backdrop-blur-sm"
                  transition={MOTION_TRANSITION}
                  initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
                  whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
                      Module {learningState.currentModuleIndex + 1}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        ~15 min read
                      </div>
                      {learningState.timeSpent > 0 && (
                        <div className="flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          {Math.floor(learningState.timeSpent / 60)}m spent
                        </div>
                      )}
                      {/* User Session Time */}
                      {sessionTimeSpent > 0 && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {Math.floor(sessionTimeSpent / 60)}m session
                        </div>
                      )}
                    </div>
                  </div>
                  <h2
                    className="mb-6 text-3xl leading-tight font-bold text-white"
                    title={currentModule.title}
                  >
                    {currentModule.title}
                  </h2>

                  {/* Module Status and Actions - USER-SPECIFIC WITH PERSISTENT STATE */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {learningState.completedModules.includes(currentModule.moduleId) ? (
                        <div className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-sm font-medium text-white shadow-lg">
                          <CheckCircle size={16} />
                          Completed by You
                        </div>
                      ) : (
                        <div className="bg-primary rounded-full px-3 py-1 text-sm font-medium text-white shadow-lg">
                          In Progress
                        </div>
                      )}

                      {/* Reading Progress */}
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-slate-600">
                          <div
                            className="h-full rounded-full bg-blue-400 transition-all duration-300"
                            style={{ width: `${learningState.readingProgress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">
                          {Math.round(learningState.readingProgress)}%
                        </span>
                      </div>
                    </div>

                    {/* Module Actions - USER-SPECIFIC WITH PERSISTENT USER INDICATOR */}
                    <div className="flex items-center gap-2">
                      {/* Bookmark Button */}
                      <button
                        onClick={() => learningActions.toggleBookmark(currentModule.moduleId)}
                        className={`rounded-lg p-2 text-sm transition-colors ${
                          learningState.bookmarkedModules.includes(currentModule.moduleId)
                            ? 'bg-yellow-500 text-white'
                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                        title={
                          learningState.bookmarkedModules.includes(currentModule.moduleId)
                            ? 'Remove bookmark'
                            : 'Bookmark this module'
                        }
                      >
                        <Star size={16} />
                      </button>

                      {/* Notes Button */}
                      <button
                        onClick={() => {
                          const currentNote =
                            learningState.moduleNotes[currentModule.moduleId] || '';
                          const note = prompt('Add a note for this module:', currentNote);
                          if (note !== null) {
                            learningActions.saveNote(note, currentModule.moduleId);
                          }
                        }}
                        className={`rounded-lg p-2 text-sm transition-colors ${
                          learningState.moduleNotes[currentModule.moduleId]
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                        title={
                          learningState.moduleNotes[currentModule.moduleId]
                            ? 'Edit your note'
                            : 'Add a note'
                        }
                      >
                        <FileText size={16} />
                      </button>

                      {/* Persistent User Indicator */}
                      {persistentUserState && (
                        <div className="rounded-lg border border-green-500/30 bg-green-500/20 px-2 py-1">
                          <span className="text-xs text-green-400">
                            {persistentUserState.userName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Content - USER-SPECIFIC READING TRACKING WITH PERSISTENT STATE */}
              {currentModule && (
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
                    {persistentUserState && (
                      <span className="ml-auto text-sm font-normal text-slate-400">
                        Student: {persistentUserState.userName}
                      </span>
                    )}
                  </h3>

                  <div className="rounded-lg border border-slate-600/50 bg-slate-900/50 p-6">
                    <ContentRenderer
                      content={currentModule.content}
                      onProgressUpdate={updateReadingProgress}
                    />

                    {/* Show saved note if exists - USER-SPECIFIC WITH PERSISTENT STATE */}
                    {learningState.moduleNotes[currentModule.moduleId] && (
                      <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-400">
                          <FileText size={14} />
                          Your Personal Note
                          {persistentUserState && (
                            <span className="ml-auto text-xs text-blue-300">
                              by {persistentUserState.userName}
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-blue-100">
                          {learningState.moduleNotes[currentModule.moduleId]}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 border-t border-slate-600/50 pt-4">
                      {!learningState.completedModules.includes(currentModule.moduleId) ? (
                        <button
                          onClick={() => learningActions.completeCurrentModule()}
                          disabled={learningState.readingProgress < 80}
                          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-green-700 hover:shadow-lg disabled:cursor-not-allowed disabled:from-gray-500 disabled:to-gray-600 disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {learningState.readingProgress < 80
                            ? `Read ${80 - Math.round(learningState.readingProgress)}% more to complete`
                            : 'Mark as Completed'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle size={20} />
                          <span className="font-medium">Module completed by you</span>
                          {persistentUserState && (
                            <span className="ml-2 text-xs text-green-300">
                              ({persistentUserState.userName})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Code Example */}
              {currentModule && currentModule.codeExample && (
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

              {/* Navigation - USER-SPECIFIC PROGRESS CONSTRAINTS WITH PERSISTENT STATE */}
              <motion.div
                className="flex items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-xl backdrop-blur-sm"
                transition={MOTION_TRANSITION}
                initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div>
                  {learningState.currentModuleIndex > 0 ? (
                    <button
                      onClick={() => learningActions.goToPreviousModule()}
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
                  <div className="flex items-center gap-2">
                    Module {learningState.currentModuleIndex + 1} of {courseMaterial.modules.length}
                    {persistentUserState && (
                      <span className="text-xs text-green-400">
                        ({persistentUserState.userName})
                      </span>
                    )}
                  </div>
                  {learningState.currentModuleIndex < courseMaterial.modules.length - 1 &&
                    currentModule &&
                    !learningState.completedModules.includes(currentModule.moduleId) && (
                      <div className="mt-1 flex items-center justify-center gap-1 text-xs text-orange-400">
                        <Lock size={12} />
                        Complete this module to unlock next
                      </div>
                    )}
                </span>

                <div className="flex items-center gap-4">
                  {learningState.currentModuleIndex < courseMaterial.modules.length - 1 && (
                    <button
                      onClick={() => learningActions.goToNextModule()}
                      disabled={isModuleLocked(learningState.currentModuleIndex + 1)}
                      className={`flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium transition-all duration-200 ${
                        isModuleLocked(learningState.currentModuleIndex + 1)
                          ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:scale-105 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg'
                      }`}
                    >
                      {isModuleLocked(learningState.currentModuleIndex + 1) ? (
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

                  {learningState.currentModuleIndex === courseMaterial.modules.length - 1 &&
                    currentModule &&
                    learningState.completedModules.includes(currentModule.moduleId) && (
                      <button
                        onClick={() => {
                          toast.success(
                            'All learning modules completed! Take the final quiz to earn your certificate.'
                          );
                          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                        }}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-5 py-2.5 font-medium text-white transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-green-700 hover:shadow-lg"
                      >
                        <Award className="h-4 w-4" />
                        Ready for Quiz
                      </button>
                    )}
                </div>
              </motion.div>

              {/* Final Quiz Section - USER-SPECIFIC ASSESSMENT WITH PERSISTENT STATE */}
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
                    <div className="bg-primary/30 absolute top-4 right-4 h-20 w-20 rounded-full blur-xl" />
                    <div className="bg-primary/20 absolute bottom-4 left-4 h-16 w-16 rounded-full blur-lg" />
                    <div className="bg-primary/10 absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl" />
                  </div>

                  <div className="relative p-8">
                    <div className="text-center">
                      {/* Icon Container with Animation */}
                      <div className="relative mx-auto mb-6">
                        <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-xl" />
                        <div className="from-primary to-primary/80 relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br shadow-lg">
                          <Brain className="h-10 w-10 text-white" />
                        </div>
                      </div>

                      {/* Title with Gradient */}
                      <h3 className="from-primary to-primary/70 mb-4 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent">
                        🎉 Ready for Final Assessment!
                      </h3>

                      <p className="mb-8 text-lg leading-relaxed text-gray-300">
                        Excellent work{persistentUserState && `, ${persistentUserState.userName}`}!
                        You've mastered all learning modules.
                        <br />
                        <span className="font-semibold text-white">
                          Take the comprehensive final quiz to earn your NFT certificate.
                        </span>
                      </p>

                      {/* Enhanced User Achievement Summary with Persistent State */}
                      <div className="mb-8 rounded-xl bg-slate-800/60 p-4">
                        <h4 className="mb-3 font-bold text-white">Your Achievement Summary</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">
                              {courseMaterial.modules.length}
                            </div>
                            <div className="text-gray-400">Modules Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">
                              {Math.floor((learningState.statistics?.totalTimeSpent || 0) / 60)}
                            </div>
                            <div className="text-gray-400">Minutes Studied</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">
                              {learningState.bookmarkedModules.length}
                            </div>
                            <div className="text-gray-400">Bookmarks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">
                              {Object.keys(learningState.moduleNotes).length}
                            </div>
                            <div className="text-gray-400">Notes</div>
                          </div>
                        </div>
                        {persistentUserState && (
                          <div className="mt-4 flex items-center justify-center gap-2 border-t border-slate-600/50 pt-3">
                            <div className="h-2 w-2 rounded-full bg-green-400"></div>
                            <span className="text-sm text-green-400">
                              Completed by {persistentUserState.userName} • Session Active
                            </span>
                          </div>
                        )}
                      </div>

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
                        <div className="h-8 w-px bg-gray-600" />
                        <div className="text-center">
                          <div className="text-primary text-2xl font-bold">
                            {finalQuizData?.passingScore || 75}%
                          </div>
                          <div className="text-gray-400">To Pass</div>
                        </div>
                        <div className="h-8 w-px bg-gray-600" />
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
                          <div className="from-primary/80 to-primary absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

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

                      {/* User ID & Motivation Text with Persistent State */}
                      <div className="mt-6 text-sm text-gray-400">
                        <p className="mb-2">
                          💡 <span className="font-medium text-gray-300">Pro tip:</span> Review your
                          learning materials before starting.
                        </p>
                        {persistentUserState && (
                          <p className="text-xs text-green-400">
                            You've got this, {persistentUserState.userName}! Show off everything
                            you've learned.
                            <br />
                            <span className="text-slate-500">
                              Session ID: {persistentUserState.userId.slice(-8)}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Learning Progress Info - USER-SPECIFIC STATUS WITH PERSISTENT STATE */}
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

                      {/* Enhanced user-specific progress indication with persistent state */}
                      <div className="mb-4 rounded-lg bg-slate-700/50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm text-gray-300">Your Progress</span>
                          {persistentUserState && (
                            <div className="flex items-center gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                              <span className="text-xs text-green-400">
                                {persistentUserState.userName}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-white">
                          {learningState.completedModules.length} of {courseMaterial.modules.length}{' '}
                          modules completed
                        </div>
                        {persistentUserState && (
                          <div className="mt-1 text-xs text-slate-400">
                            Session: {persistentUserState.userId.slice(-8)} • Active since{' '}
                            {new Date(persistentUserState.lastSeen).toLocaleTimeString()}
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="mb-2 flex justify-between text-sm text-gray-400">
                          <span>Learning Progress</span>
                          <span>
                            {learningState.completedModules.length} of{' '}
                            {courseMaterial.modules.length} modules
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                          <div
                            className="from-primary to-primary/80 h-full bg-gradient-to-r transition-all duration-300"
                            style={{ width: `${learningState.overallProgress}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-sm text-gray-400">
                        <p className="mb-2 flex items-center gap-2">
                          <BookOpen size={14} className="text-primary" />
                          Module Completion Checklist
                          {persistentUserState && ` for ${persistentUserState.userName}`}:
                        </p>
                        <ul className="ml-6 space-y-1">
                          {courseMaterial.modules.map((module, index) => (
                            <li key={module.moduleId} className="flex items-center gap-2">
                              {learningState.completedModules.includes(module.moduleId) ? (
                                <CheckCircle size={14} className="text-green-400" />
                              ) : (
                                <div className="border-primary/50 h-3.5 w-3.5 rounded-full border-2" />
                              )}
                              <span
                                className={
                                  learningState.completedModules.includes(module.moduleId)
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

              {/* Certificate Achievement Banner - USER-SPECIFIC CERTIFICATE WITH PERSISTENT STATE */}
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
                  <p className="mb-2 text-lg text-gray-200">
                    Congratulations{persistentUserState && `, ${persistentUserState.userName}`}! You
                    have successfully earned your NFT certificate!
                  </p>
                  <p className="mb-6 text-sm text-gray-400">
                    Certificate issued to:{' '}
                    {persistentUserState?.userName || 'Distinguished Learner'}
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setCurrentView('certificate')}
                      className="rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:scale-105 hover:from-yellow-600 hover:to-yellow-700 hover:shadow-lg"
                    >
                      <Award className="mr-2 inline h-4 w-4" />
                      View Your Certificate
                    </button>
                    <button
                      onClick={() => {
                        learningActions.goToModule(0);
                      }}
                      className="flex items-center gap-2 rounded-lg border border-gray-400 bg-slate-700/60 px-6 py-3 font-medium text-gray-200 transition-all duration-200 hover:scale-105 hover:bg-slate-700/80"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Review Course
                    </button>
                  </div>

                  {/* Enhanced Certificate Details with Persistent State */}
                  <div className="mt-6 rounded-lg bg-slate-800/60 p-4">
                    <h4 className="mb-3 text-sm font-semibold text-yellow-300">
                      Certificate Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400">Token ID:</span>
                        <div className="font-mono text-yellow-400">#{userCertificate.tokenId}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Issue Date:</span>
                        <div className="text-yellow-400">
                          {new Date(userCertificate.completedAt / 1000000).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Course:</span>
                        <div className="truncate text-yellow-400">{userCertificate.courseName}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Student:</span>
                        <div className="text-yellow-400">
                          {persistentUserState?.userName || 'Distinguished Learner'}
                        </div>
                      </div>
                      {persistentUserState && (
                        <div className="col-span-2">
                          <span className="text-gray-400">Session ID:</span>
                          <div className="font-mono text-xs text-yellow-400">
                            {persistentUserState.userId.slice(-12)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Enhanced Debug Information with Persistent State (Development Only) */}
              {process.env.NODE_ENV === 'development' && (
                <motion.div
                  className="mt-6 rounded-lg border border-gray-600/50 bg-gray-800/30 p-4 font-mono text-xs"
                  transition={MOTION_TRANSITION}
                  initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
                  whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <h4 className="mb-2 text-gray-400">Debug Information (Dev Only)</h4>
                  <div className="space-y-1 text-gray-500">
                    <div>Current User ID: {currentUserId}</div>
                    <div>Persistent User ID: {persistentUserState?.userId}</div>
                    <div>User Name: {persistentUserState?.userName || 'N/A'}</div>
                    <div>Principal: {persistentUserState?.principal}</div>
                    <div>Session Active: {userStateManager.isSessionActive().toString()}</div>
                    <div>
                      Last Seen:{' '}
                      {persistentUserState
                        ? new Date(persistentUserState.lastSeen).toLocaleString()
                        : 'N/A'}
                    </div>
                    <div>Course ID: {courseId}</div>
                    <div>Current Module: {learningState.currentModuleIndex + 1}</div>
                    <div>Completed Modules: {learningState.completedModules.length}</div>
                    <div>Overall Progress: {Math.round(learningState.overallProgress)}%</div>
                    <div>Reading Progress: {Math.round(learningState.readingProgress)}%</div>
                    <div>Time Spent: {Math.floor(learningState.timeSpent / 60)}m</div>
                    <div>Session Time: {Math.floor(sessionTimeSpent / 60)}m</div>
                    <div>Bookmarks: {learningState.bookmarkedModules.length}</div>
                    <div>Notes: {Object.keys(learningState.moduleNotes).length}</div>
                    <div>Is Enrolled: {isEnrolled.toString()}</div>
                    <div>Has Certificate: {!!userCertificate}</div>
                    <div>Is Initializing: {isInitializingUser.toString()}</div>
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
