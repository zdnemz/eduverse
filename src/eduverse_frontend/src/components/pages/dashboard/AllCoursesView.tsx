import { BookOpen, Star, Clock, Users, Search, Filter, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
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

// Mapping untuk difficulty dari backend Motoko
const getDifficultyText = (difficulty: any): string => {
  if ('Beginner' in difficulty) return 'Beginner';
  if ('Intermediate' in difficulty) return 'Intermediate';
  if ('Advanced' in difficulty) return 'Advanced';
  return 'Beginner';
};

// Mapping untuk difficulty badge class
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

interface AllCoursesViewProps {
  onBack: () => void;
}

// Extended course type dengan progress data
interface ExtendedCourseInfo extends CourseInfo {
  progress?: number;
  completedLessons?: number;
  nextLesson?: string;
}

export default function AllCoursesView({ onBack }: AllCoursesViewProps) {
  const user = useAuthUser();
  const { startLoading, stopLoading } = useLoading('courses');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [extendedCourses, setExtendedCourses] = useState<ExtendedCourseInfo[]>([]);
  const [actor, setActor] = useState<ActorSubclass<_SERVICE> | null>(null);

  useEffect(() => {
    if (!user) return;

    const initActor = async () => {
      try {
        const client = await getAuthClient();
        if (await client.isAuthenticated()) {
          const identity = client.getIdentity();
          const newActor = await createActor(identity);
          setActor(newActor);
        }
      } catch (error) {
        console.error('Failed to initialize actor:', error);
        toast.error('Failed to initialize connection');
      }
    };

    initActor();
  }, [user]);

  const courses = useCourse(actor!);

  useEffect(() => {
    if (courses.length > 0) {
      const extended: ExtendedCourseInfo[] = courses.map((course, index) => ({
        ...course,
        progress: Math.floor(Math.random() * 100), // Demo progress
        completedLessons: Math.floor(Number(course.totalLessons) * Math.random()),
        nextLesson: getNextLessonForCourse(course.category),
      }));

      setExtendedCourses(extended);

      if (extended.length > 0) {
        toast.success(`Loaded ${extended.length} courses successfully`);
      }
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

  // Get unique categories dari courses
  const categories = ['All', ...new Set(extendedCourses.map((course) => course.category))];

  const filteredCourses = extendedCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isLoading = !user || !actor || courses.length === 0;

  if (isLoading) {
    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={MOTION_TRANSITION}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="btn btn-ghost btn-sm gap-2 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
            <BookOpen className="text-info h-8 w-8" />
            <h1 className="text-base-content text-3xl font-bold md:text-4xl lg:text-5xl">
              All Courses
            </h1>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="card border-base-300 bg-base-200 animate-pulse border shadow"
            >
              <div className="bg-base-300 h-48 w-full"></div>
              <div className="card-body space-y-3 p-5">
                <div className="bg-base-300 h-4 rounded"></div>
                <div className="bg-base-300 h-3 w-3/4 rounded"></div>
                <div className="bg-base-300 h-2 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={MOTION_TRANSITION}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn btn-ghost btn-sm gap-2 rounded-lg">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <BookOpen className="text-info h-8 w-8" />
          <h1 className="text-base-content text-3xl font-bold md:text-4xl lg:text-5xl">
            All Courses
          </h1>
        </div>
        <div className="text-base-content/70 text-sm">
          {filteredCourses.length} courses available
        </div>
      </div>

      {/* Search and Filter */}
      <motion.div
        className="bg-base-200/50 border-base-300/30 rounded-xl border p-4 backdrop-blur-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Bar */}
          <div className="relative max-w-md flex-1">
            <Search className="text-base-content/50 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses, instructors, or topics..."
              className="input input-bordered bg-base-100 border-base-300/50 focus:border-primary w-full pr-4 pl-10 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter and Results */}
          <div className="flex flex-shrink-0 items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="text-base-content/70 h-4 w-4" />
              <span className="text-base-content/70 text-sm font-medium">Filter:</span>
              <select
                className="select select-bordered select-sm bg-base-100 border-base-300/50 focus:border-primary min-w-24"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="badge badge-primary">{filteredCourses.length} courses</div>
          </div>
        </div>
      </motion.div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <motion.div
          className="from-base-300/30 via-base-200/20 to-base-300/30 border-base-300/30 rounded-2xl border bg-gradient-to-br py-16 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-base-content/50 mb-3 text-xl">No courses found</div>
          <div className="text-base-content/30 text-sm">
            Try adjusting your search or filter criteria
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              className="card border-base-300 bg-base-200 cursor-pointer border shadow transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
              whileHover={{
                boxShadow:
                  '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              }}
            >
              <figure className="relative overflow-hidden">
                <img
                  width={300}
                  height={200}
                  src={course.thumbnail}
                  alt={course.title}
                  className="h-48 w-full object-cover transition-transform duration-300 hover:scale-110"
                />
                <div className="absolute top-4 right-4 left-4 flex justify-between">
                  <div className={`badge ${getDifficultyBadgeClass(course.difficulty)} shadow-lg`}>
                    {getDifficultyText(course.difficulty)}
                  </div>
                  <div className="badge badge-neutral shadow-lg">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    {course.rating}
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100"></div>
              </figure>

              <div className="card-body p-5">
                <h3 className="card-title line-clamp-2 text-base font-bold">{course.title}</h3>
                <p className="text-base-content/70 text-sm">by {course.instructor}</p>

                <div className="text-base-content/60 my-3 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {Number(course.students).toLocaleString()}
                  </div>
                </div>

                <div className="badge badge-outline badge-xs border-primary/30 text-primary mb-3">
                  {course.category}
                </div>

                {/* Progress Bar */}
                <div className="mt-auto">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="font-medium">Progress</span>
                    <span className="text-primary font-bold">{course.progress || 0}%</span>
                  </div>
                  <div className="bg-base-300 h-2 w-full overflow-hidden rounded-full">
                    <motion.div
                      className="from-primary to-primary/80 h-full rounded-full bg-gradient-to-r"
                      transition={{ duration: 0.8, delay: index * 0.05 + 0.3 }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${course.progress || 0}%` }}
                      viewport={{ once: true }}
                    />
                  </div>
                  <div className="text-base-content/60 mt-2 text-xs">
                    <span className="font-medium">{course.completedLessons || 0}</span>/
                    {Number(course.totalLessons)} lessons completed
                  </div>
                </div>

                {(course.progress || 0) > 0 && (
                  <div className="text-base-content/70 bg-base-300/50 mt-3 rounded-lg p-2 text-xs">
                    <span className="text-base-content/50">Next:</span>{' '}
                    <span className="text-primary font-medium">{course.nextLesson}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
