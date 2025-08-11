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
      return 'badge-success';
    case 'Intermediate':
      return 'badge-warning';
    case 'Advanced':
      return 'badge-error';
    default:
      return 'badge-success';
  }
};

export default function CourseDetailHeader({
  courseInfo,
  courseContent,
  onBack,
}: CourseDetailHeaderProps) {
  return (
    <motion.div
      className="from-primary to-secondary text-primary-content overflow-hidden rounded-2xl bg-gradient-to-r shadow-xl"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="p-6 md:p-8">
        <button
          onClick={onBack}
          className="btn btn-ghost btn-sm text-primary-content/80 hover:text-primary-content mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </button>

        <div className="flex flex-col gap-6 lg:flex-row">
          <motion.div
            className="relative overflow-hidden rounded-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={courseInfo.thumbnail}
              alt={courseInfo.title}
              className="h-48 w-full object-cover lg:w-64"
            />
            <div className="absolute top-4 right-4">
              <div className={`badge ${getDifficultyBadgeClass(courseInfo.difficulty)} shadow-lg`}>
                {getDifficultyText(courseInfo.difficulty)}
              </div>
            </div>
          </motion.div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="mb-2 text-2xl font-bold md:text-3xl lg:text-4xl">
                {courseInfo.title}
              </h1>
              <p className="text-primary-content/90 text-lg">Taught by {courseInfo.instructor}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="bg-primary-content/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="mb-1 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-primary-content/80 text-sm">Duration</span>
                </div>
                <div className="font-semibold">{courseInfo.duration}</div>
              </div>

              <div className="bg-primary-content/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="mb-1 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-primary-content/80 text-sm">Students</span>
                </div>
                <div className="font-semibold">{Number(courseInfo.students).toLocaleString()}</div>
              </div>

              <div className="bg-primary-content/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="mb-1 flex items-center gap-2">
                  <Star className="h-4 w-4 fill-current text-yellow-400" />
                  <span className="text-primary-content/80 text-sm">Rating</span>
                </div>
                <div className="font-semibold">{courseInfo.rating}</div>
              </div>

              <div className="bg-primary-content/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="mb-1 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-primary-content/80 text-sm">Lessons</span>
                </div>
                <div className="font-semibold">{Number(courseInfo.totalLessons)}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="badge badge-outline badge-lg text-primary-content/90 border-primary-content/30">
                {courseInfo.category}
              </div>
              {courseContent.modules.map((module: Module) => (
                <div
                  key={module.id.toString()}
                  className="badge badge-ghost text-primary-content/70"
                >
                  {module.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
