import { BookOpen, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOTION_TRANSITION } from '@/constants/motion';
import { useLoading } from '@/hooks/useLoading';
import { useAuthUser } from '@/stores/auth-store';
import { CourseInfo } from 'declarations/eduverse_backend/eduverse_backend.did';
import { toast } from 'sonner';
import { useCourse } from '@/services/auth-service';
import { actor as createActor } from '@/lib/actor';
import { getAuthClient } from '@/lib/authClient';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from 'declarations/eduverse_backend/eduverse_backend.did';
import CourseIntroModal from '../course/CourseIntroductionModal';

const getDifficultyText = (difficulty: any): string => {
  if ('Beginner' in difficulty) return 'Beginner';
  if ('Intermediate' in difficulty) return 'Intermediate';
  if ('Advanced' in difficulty) return 'Advanced';
  return 'Beginner';
};

const getDifficultyBadgeClass = (difficulty: any): string => {
  const text = getDifficultyText(difficulty);
  switch (text) {
    case 'Beginner':
      return 'badge-success';
    case 'Intermediate':
      return 'badge-warning';
    case 'Advanced':
      return 'badge-error';
    default:
      return 'badge-success';
  }
};

interface LearningProps {
  onViewAll: () => void;
}

interface ExtendedCourseInfo extends CourseInfo {
  progress?: number;
  completedLessons?: number;
  nextLesson?: string;
}

export default function Learning({ onViewAll }: LearningProps) {
  const navigate = useNavigate();
  const user = useAuthUser();
  const { startLoading, stopLoading } = useLoading('learning');
  const [recentCourses, setRecentCourses] = useState<ExtendedCourseInfo[]>([]);
  const [actor, setActor] = useState<ActorSubclass<_SERVICE> | null>(null);

  const [showIntroModal, setShowIntroModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<ExtendedCourseInfo | null>(null);

  useEffect(() => {
    const initActor = async () => {
      try {
        startLoading();
        const client = await getAuthClient();

        const identity = client.getIdentity(); // Hapus isAuthenticated check
        const newActor = await createActor(identity);
        setActor(newActor);
      } catch (error) {
        console.error('Failed to initialize actor:', error);
        toast.error('Failed to initialize connection');
      } finally {
        stopLoading();
      }
    };

    initActor();
  }, []);

  const courses = useCourse(actor!);

  useEffect(() => {
    if (courses.length > 0) {
      const coursesWithProgress = courses
        .map((course, index) => ({
          ...course,
          progress: Math.floor(Math.random() * 85) + 15,
          completedLessons: Math.floor(Number(course.totalLessons) * (Math.random() * 0.8 + 0.2)),
          nextLesson: getNextLessonForCourse(course.category),
        }))
        .filter((course) => (course.progress || 0) > 0)
        .slice(0, 2);

      setRecentCourses(coursesWithProgress);
    }
  }, [courses]);

  const getNextLessonForCourse = (category: string): string => {
    const nextLessons: Record<string, string> = {
      Blockchain: 'Smart Contract Security',
      'Smart Contracts': 'DeFi Protocol Development',
      'Internet Computer': 'Motoko Programming Basics',
      Frontend: 'Wallet Integration',
      DeFi: 'Liquidity Pool Optimization',
      NFTs: 'IPFS Integration',
      Programming: 'Memory Management',
      Governance: 'Final Project: Create Your DAO',
      Trading: 'Reading Candlestick Charts',
    };
    return nextLessons[category] || 'Getting Started';
  };

  const handleCourseClick = (course: ExtendedCourseInfo) => {
    setSelectedCourse(course);
    setShowIntroModal(true);
  };

  const handleStartLearning = async () => {
    if (!selectedCourse) {
      toast.error('Course not selected');
      return;
    }

    try {
      startLoading();
      toast.success(`Starting ${selectedCourse.title}`);
      navigate(`/learn/${selectedCourse.id.toString()}`);
    } catch (error) {
      console.error('Error starting course:', error);
      toast.error('Failed to start course');
    } finally {
      stopLoading();
      setShowIntroModal(false);
      setSelectedCourse(null);
    }
  };

  const handleCloseModal = () => {
    setShowIntroModal(false);
    setSelectedCourse(null);
  };

  const isLoading = !user || !actor || courses.length === 0;

  if (isLoading) {
    return (
      <section className="h-full">
        <motion.div
          className="card bg-base-300/70 shadow-primary h-full space-y-6 p-6 shadow"
          transition={{ ...MOTION_TRANSITION, delay: 0.8 }}
          initial={{
            opacity: 0,
            transform: 'translateY(10px)',
            filter: 'blur(10px)',
          }}
          whileInView={{
            opacity: 1,
            transform: 'translateY(0)',
            filter: 'blur(0px)',
          }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="text-info h-6 w-6" />
              <h2 className="card-title text-2xl">Continue Learning</h2>
            </div>
            <button
              className="btn btn-ghost btn-primary btn-sm gap-2 rounded-lg"
              onClick={onViewAll}
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Loading skeleton */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[1, 2].map((index) => (
              <div
                key={index}
                className="card border-base-300 bg-base-200 h-90 animate-pulse border shadow"
              >
                <div className="bg-base-300 h-48 w-full"></div>
                <div className="card-body space-y-3">
                  <div className="bg-base-300 h-4 rounded"></div>
                  <div className="bg-base-300 h-3 w-3/4 rounded"></div>
                  <div className="bg-base-300 h-2 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    );
  }

  return (
    <>
      <section className="h-full">
        <motion.div
          className="card bg-base-300/70 shadow-primary h-full space-y-6 p-6 shadow"
          transition={{ ...MOTION_TRANSITION, delay: 0.8 }}
          initial={{
            opacity: 0,
            transform: 'translateY(10px)',
            filter: 'blur(10px)',
          }}
          whileInView={{
            opacity: 1,
            transform: 'translateY(0)',
            filter: 'blur(0px)',
          }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="text-info h-6 w-6" />
              <h2 className="card-title text-2xl">Continue Learning</h2>
            </div>
            <button
              className="btn btn-ghost btn-primary btn-sm gap-2 rounded-lg"
              onClick={onViewAll}
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {recentCourses.map((course, index) => (
              <motion.div
                key={course.id}
                className="card border-base-300 bg-base-200 h-90 cursor-pointer border shadow transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl"
                onClick={() => handleCourseClick(course)}
                whileHover={{
                  boxShadow:
                    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <figure className="relative overflow-hidden">
                  <img
                    width={200}
                    height={200}
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 left-4 flex justify-between">
                    <div
                      className={`badge ${getDifficultyBadgeClass(course.difficulty)} shadow-lg`}
                    >
                      {getDifficultyText(course.difficulty)}
                    </div>
                    <div className="badge badge-neutral shadow-lg">
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      {course.rating}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100"></div>
                </figure>

                <div className="card-body">
                  <h3 className="card-title text-lg">{course.title}</h3>
                  <p className="text-base-content/70 text-sm">by {course.instructor}</p>

                  <div className="my-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-semibold">{course.progress}%</span>
                    </div>
                    <div className="bg-base-300 h-2 w-full overflow-hidden rounded-full">
                      <motion.div
                        className="bg-primary h-full rounded-full"
                        transition={{ ...MOTION_TRANSITION, delay: 1 }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${course.progress}%` }}
                        viewport={{ once: true, amount: 0.2 }}
                      />
                    </div>
                    <div className="text-base-content/60 mt-1 flex justify-between text-xs">
                      <span>
                        {course.completedLessons}/{Number(course.totalLessons)} lessons
                      </span>
                      <span>{course.duration}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
      {selectedCourse && (
        <CourseIntroModal
          course={selectedCourse}
          onClose={handleCloseModal}
          onStartLearning={handleStartLearning}
          isOpen={showIntroModal}
        />
      )}
    </>
  );
}
