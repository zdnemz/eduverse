// components/course/CourseIntroductionModal.tsx
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  Clock,
  Users,
  Star,
  BookOpen,
  Award,
  CheckCircle,
  Target,
  Zap,
} from 'lucide-react';
import type { CourseInfo, Difficulty } from 'declarations/eduverse_backend/eduverse_backend.did';

interface CourseIntroductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseInfo | null;
  onStartLearning: () => void;
  progress?: number;
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

export default function CourseIntroductionModal({
  isOpen,
  onClose,
  course,
  onStartLearning,
  progress = 0,
}: CourseIntroductionModalProps) {
  if (!course) return null;

  const isResuming = progress > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="card bg-base-100 shadow-2xl">
              {/* Header with Close Button */}
              <div className="absolute top-4 right-4 z-10">
                <button onClick={onClose} className="btn btn-circle btn-ghost btn-sm">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Course Hero Section */}
              <figure className="relative h-64 overflow-hidden">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute right-6 bottom-4 left-6 text-white">
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className={`badge ${getDifficultyBadgeClass(course.difficulty)} shadow-lg`}
                    >
                      {getDifficultyText(course.difficulty)}
                    </div>
                    <div className="badge badge-neutral shadow-lg">
                      <Star className="mr-1 h-3 w-3 fill-current text-yellow-400" />
                      {course.rating}
                    </div>
                  </div>
                  <h2 className="mb-1 text-2xl font-bold md:text-3xl">{course.title}</h2>
                  <p className="text-white/90">by {course.instructor}</p>
                </div>
              </figure>

              <div className="card-body p-6">
                {/* Progress Section (if resuming) */}
                {isResuming && (
                  <motion.div
                    className="bg-primary/10 border-primary/20 mb-6 rounded-lg border p-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <CheckCircle className="text-primary h-5 w-5" />
                      <span className="text-primary font-semibold">
                        Continue Your Learning Journey
                      </span>
                    </div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="text-primary font-bold">{progress}%</span>
                    </div>
                    <div className="bg-primary/20 h-2 overflow-hidden rounded-full">
                      <motion.div
                        className="bg-primary h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Course Stats */}
                <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="bg-base-200 rounded-lg p-4 text-center">
                    <Clock className="text-primary mx-auto mb-2 h-6 w-6" />
                    <div className="text-base-content/70 text-sm">Duration</div>
                    <div className="font-semibold">{course.duration}</div>
                  </div>
                  <div className="bg-base-200 rounded-lg p-4 text-center">
                    <Users className="text-secondary mx-auto mb-2 h-6 w-6" />
                    <div className="text-base-content/70 text-sm">Students</div>
                    <div className="font-semibold">{Number(course.students).toLocaleString()}</div>
                  </div>
                  <div className="bg-base-200 rounded-lg p-4 text-center">
                    <BookOpen className="text-accent mx-auto mb-2 h-6 w-6" />
                    <div className="text-base-content/70 text-sm">Lessons</div>
                    <div className="font-semibold">{Number(course.totalLessons)}</div>
                  </div>
                  <div className="bg-base-200 rounded-lg p-4 text-center">
                    <Award className="text-warning mx-auto mb-2 h-6 w-6" />
                    <div className="text-base-content/70 text-sm">Certificate</div>
                    <div className="font-semibold">Yes</div>
                  </div>
                </div>

                {/* Course Description */}
                <div className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                    <Target className="text-primary h-5 w-5" />
                    What You'll Learn
                  </h3>
                  <div className="bg-base-200/50 rounded-lg p-4">
                    <p className="text-base-content/80 leading-relaxed">
                      Master the fundamentals and advanced concepts in{' '}
                      {course.category.toLowerCase()}. This comprehensive course is designed for{' '}
                      {getDifficultyText(course.difficulty).toLowerCase()} level learners and will
                      take you through practical, hands-on exercises to build real-world skills.
                    </p>
                  </div>
                </div>

                {/* Learning Outcomes */}
                <div className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                    <Zap className="text-secondary h-5 w-5" />
                    Key Learning Outcomes
                  </h3>
                  <div className="grid gap-2">
                    {[
                      `Understand core concepts in ${course.category}`,
                      'Apply practical skills through hands-on projects',
                      'Build confidence in real-world scenarios',
                      'Earn a certificate upon successful completion',
                    ].map((outcome, index) => (
                      <motion.div
                        key={index}
                        className="flex items-start gap-3 p-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <CheckCircle className="text-success mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span className="text-base-content/80 text-sm">{outcome}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <motion.button
                    className="btn btn-primary flex-1 gap-2"
                    onClick={onStartLearning}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Play className="h-4 w-4" />
                    {isResuming ? 'Continue Learning' : 'Start Learning'}
                  </motion.button>

                  <button className="btn btn-outline btn-neutral flex-1" onClick={onClose}>
                    Maybe Later
                  </button>
                </div>

                {/* Additional Info */}
                <div className="mt-4 text-center">
                  <p className="text-base-content/60 text-xs">
                    {isResuming
                      ? 'Pick up right where you left off'
                      : 'Start your learning journey today • No prerequisites required'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
