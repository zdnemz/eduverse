// components/course/CourseDetailHeader.tsx
import { ArrowLeft, Star, Clock, Users, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CourseInfo, Difficulty } from 'declarations/eduverse_backend/eduverse_backend.did';

// Define missing types locally until they're added to DID
interface Lesson {
  id: bigint;
  title: string;
  content: {
    summary: string;
    keyPoints: string[];
    detailedContent: string;
    codeExamples?: string;
  };
  videoUrl?: string[];
  duration: string;
  lessonType:
    | { Video: null }
    | { Reading: null }
    | { CodeLab: null }
    | { Interactive: null }
    | { Assignment: null };
  resources?: string[];
  isCompleted: boolean;
}

interface Module {
  id: bigint;
  title: string;
  description: string;
  estimatedTime: string;
  prerequisites: string[];
  isLocked: boolean;
  lessons: Lesson[];
  quiz: any[];
}

interface CourseContent {
  courseId: bigint;
  modules: Module[];
}

interface CourseDetailHeaderProps {
  courseInfo: CourseInfo;
  courseContent: CourseContent;
  onBack: () => void;
}

const getDifficultyText = (difficulty: Difficulty): string => {
  if ('Beginner' in difficulty) return 'Beginner';
  if ('Intermediate' in difficulty) return 'Intermediate';
  if ('Advanced' in difficulty) return 'Advanced';
  return 'Beginner';
};

const getDifficultyBadgeClass = (difficulty: Difficulty): string => {
  const text = getDifficultyText(difficulty);
  switch (text) {
    case 'Beginner':
      return 'bg-green-500 text-white';
    case 'Intermediate':
      return 'bg-yellow-500 text-white';
    case 'Advanced':
      return 'bg-red-500 text-white';
    default:
      return 'bg-green-500 text-white';
  }
};

export default function CourseDetailHeader({
  courseInfo,
  courseContent,
  onBack,
}: CourseDetailHeaderProps) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Simple background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>

      <div className="relative text-white">
        <button
          onClick={onBack}
          className="mb-8 inline-flex items-center text-white/80 transition-colors hover:text-white"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Courses
        </button>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Course Image */}
          <motion.div
            className="relative flex-shrink-0 overflow-hidden rounded-xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={courseInfo.thumbnail}
              alt={courseInfo.title}
              className="h-64 w-full object-cover lg:h-72 lg:w-80"
            />
            <div className="absolute top-4 right-4">
              <div
                className={`rounded-full px-3 py-1 text-sm font-semibold ${getDifficultyBadgeClass(courseInfo.difficulty)}`}
              >
                {getDifficultyText(courseInfo.difficulty)}
              </div>
            </div>
          </motion.div>

          <div className="flex-1 space-y-6">
            {/* Course Title & Instructor */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white lg:text-5xl">{courseInfo.title}</h1>
              <p className="text-lg text-blue-200">Taught by {courseInfo.instructor}</p>
            </div>

            {/* Stats Cards - Compact design */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <motion.div
                className="rounded-xl border border-blue-700/20 bg-blue-800/40 p-4 text-center backdrop-blur-sm"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-2 flex justify-center">
                  <div className="rounded-lg bg-blue-600/40 p-2">
                    <Clock className="h-5 w-5 text-blue-300" />
                  </div>
                </div>
                <div className="mb-1 text-xs font-bold tracking-wide text-blue-300 uppercase">
                  DURATION
                </div>
                <div className="mb-1 text-xl font-bold text-white">
                  {courseInfo.duration.split(' ')[0]}
                </div>
                <div className="text-xs text-blue-200/80">
                  {courseInfo.duration.split(' ')[1] || 'weeks'}
                </div>
                <div className="text-xs text-blue-200/60">Course length</div>
              </motion.div>

              <motion.div
                className="rounded-xl border border-blue-700/20 bg-blue-800/40 p-4 text-center backdrop-blur-sm"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                <div className="mb-2 flex justify-center">
                  <div className="rounded-lg bg-green-600/40 p-2">
                    <Users className="h-5 w-5 text-green-300" />
                  </div>
                </div>
                <div className="mb-1 text-xs font-bold tracking-wide text-green-300 uppercase">
                  STUDENTS
                </div>
                <div className="mb-1 text-xl font-bold text-white">
                  {Number(courseInfo.students).toLocaleString()}
                </div>
                <div className="text-xs text-blue-200/60">Enrolled</div>
              </motion.div>

              <motion.div
                className="rounded-xl border border-blue-700/20 bg-blue-800/40 p-4 text-center backdrop-blur-sm"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <div className="mb-2 flex justify-center">
                  <div className="rounded-lg bg-yellow-600/40 p-2">
                    <Star className="h-5 w-5 fill-current text-yellow-300" />
                  </div>
                </div>
                <div className="mb-1 text-xs font-bold tracking-wide text-yellow-300 uppercase">
                  RATING
                </div>
                <div className="mb-1 flex items-center justify-center gap-1">
                  <div className="text-xl font-bold text-white">{courseInfo.rating}</div>
                  <div className="text-xs text-yellow-300/80">/5.0</div>
                </div>
                <div className="text-xs text-blue-200/60">Average score</div>
              </motion.div>

              <motion.div
                className="rounded-xl border border-blue-700/20 bg-blue-800/40 p-4 text-center backdrop-blur-sm"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, delay: 0.15 }}
              >
                <div className="mb-2 flex justify-center">
                  <div className="rounded-lg bg-purple-600/40 p-2">
                    <BookOpen className="h-5 w-5 text-purple-300" />
                  </div>
                </div>
                <div className="mb-1 text-xs font-bold tracking-wide text-purple-300 uppercase">
                  LESSONS
                </div>
                <div className="mb-1 text-xl font-bold text-white">
                  {Number(courseInfo.totalLessons)}
                </div>
                <div className="text-xs text-blue-200/60">Total content</div>
              </motion.div>
            </div>

            {/* Category & Module Tags */}
            <div className="flex flex-wrap gap-3">
              <div className="rounded-full border border-blue-500/50 bg-blue-600/30 px-4 py-2 text-sm font-medium text-blue-200">
                {courseInfo.category}
              </div>
              {courseContent.modules.slice(0, 3).map((module: Module) => (
                <div
                  key={module.id.toString()}
                  className="rounded-full border border-blue-600/30 bg-blue-700/30 px-3 py-1.5 text-sm text-blue-200"
                >
                  {module.title}
                </div>
              ))}
              {courseContent.modules.length > 3 && (
                <div className="rounded-full border border-blue-600/30 bg-blue-700/30 px-3 py-1.5 text-sm text-blue-200">
                  +{courseContent.modules.length - 3} more
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
