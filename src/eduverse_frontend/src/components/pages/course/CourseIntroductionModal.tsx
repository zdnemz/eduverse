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
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { CourseInfo, Difficulty } from 'declarations/eduverse_backend/eduverse_backend.did';

interface CourseIntroductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseInfo | null;
  onStartLearning: (courseId?: string | number) => void;
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
      return 'badge-success text-white';
    case 'Intermediate':
      return 'badge-warning text-white';
    case 'Advanced':
      return 'badge-error text-white';
    default:
      return 'badge-success text-white';
  }
};

export default function CourseIntroductionModal({
  isOpen,
  onClose,
  course,
  onStartLearning,
}: CourseIntroductionModalProps) {
  if (!course) return null;

  const handleStartLearning = () => {
    onStartLearning(course.id.toString());
  };

  const getLearningOutcomes = (category: string) => {
    const outcomes: Record<string, string[]> = {
      Blockchain: [
        'Understand blockchain fundamentals and consensus mechanisms',
        'Learn how transactions are validated and recorded',
        'Explore different blockchain networks and their use cases',
        'Master key security principles and best practices',
      ],
      'Smart Contracts': [
        'Write and deploy smart contracts effectively',
        'Understand gas optimization and security patterns',
        'Learn about contract interactions and composability',
        'Master testing and debugging techniques',
      ],
      'Internet Computer': [
        'Build and deploy canisters on the Internet Computer',
        'Master Motoko programming language fundamentals',
        'Understand IC architecture and consensus',
        'Learn about inter-canister calls and upgrades',
      ],
      Frontend: [
        'Integrate blockchain with modern web frameworks',
        'Implement wallet connections and user authentication',
        'Handle transactions and state management',
        'Build responsive and intuitive user interfaces',
      ],
      DeFi: [
        'Understand DeFi protocols and mechanisms',
        'Learn about liquidity pools and yield farming',
        'Explore automated market makers and trading',
        'Master risk management and security practices',
      ],
      NFTs: [
        'Create and deploy NFT smart contracts',
        'Understand metadata standards and IPFS storage',
        'Learn about NFT marketplaces and trading',
        'Explore advanced NFT use cases and utilities',
      ],
    };

    return (
      outcomes[category] || [
        `Master core concepts in ${category.toLowerCase()}`,
        'Apply theoretical knowledge through practical exercises',
        'Build real-world projects and gain hands-on experience',
        'Develop industry-relevant skills and best practices',
      ]
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Enhanced Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            className="relative max-h-[95vh] w-full max-w-5xl overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="card bg-base-100 overflow-hidden shadow-2xl">
              <div className="absolute top-4 right-4 z-20">
                <motion.button
                  onClick={onClose}
                  className="btn btn-circle btn-ghost btn-sm border-white/20 bg-black/20 text-white backdrop-blur-sm hover:bg-black/40"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Enhanced Hero Section */}
              <figure className="relative h-80 overflow-hidden">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                {/* Floating Elements */}
                <div className="absolute top-6 right-20 left-6 z-10">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <motion.div
                      className={`badge ${getDifficultyBadgeClass(course.difficulty)} px-3 py-1 shadow-lg`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {getDifficultyText(course.difficulty)}
                    </motion.div>
                    <motion.div
                      className="badge badge-neutral border-white/20 bg-black/30 px-3 py-1 text-white shadow-lg backdrop-blur-sm"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {course.rating}
                    </motion.div>
                  </div>
                </div>

                {/* Course Title Section */}
                <div className="absolute right-6 bottom-6 left-6 z-10 text-white">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="badge badge-outline border-white/30 text-white backdrop-blur-sm">
                        {course.category}
                      </div>
                    </div>
                    <h2 className="mb-2 text-3xl leading-tight font-bold md:text-4xl">
                      {course.title}
                    </h2>
                    <p className="text-lg text-white/90">by {course.instructor}</p>
                  </motion.div>
                </div>

                {/* Decorative Elements */}
                <div className="from-primary/20 absolute top-0 right-0 h-32 w-32 rounded-bl-full bg-gradient-to-bl to-transparent" />
                <div className="from-secondary/20 absolute bottom-0 left-0 h-24 w-24 rounded-tr-full bg-gradient-to-tr to-transparent" />
              </figure>

              <div className="card-body p-8">
                {/* Enhanced Course Stats */}
                <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    {
                      icon: Clock,
                      label: 'Duration',
                      value: course.duration,
                      color: 'text-primary',
                    },
                    {
                      icon: Users,
                      label: 'Students',
                      value: Number(course.students).toLocaleString(),
                      color: 'text-secondary',
                    },
                    {
                      icon: BookOpen,
                      label: 'Lessons',
                      value: Number(course.totalLessons).toString(),
                      color: 'text-accent',
                    },
                    { icon: Award, label: 'Certificate', value: 'Included', color: 'text-warning' },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      className="from-base-200 to-base-300/50 group relative overflow-hidden rounded-xl bg-gradient-to-br p-4 text-center transition-all duration-300 hover:shadow-lg"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="to-base-100/20 absolute inset-0 bg-gradient-to-br from-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <stat.icon className={`${stat.color} relative z-10 mx-auto mb-3 h-8 w-8`} />
                      <div className="text-base-content/70 relative z-10 mb-1 text-sm">
                        {stat.label}
                      </div>
                      <div className="relative z-10 text-lg font-bold">{stat.value}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Enhanced Course Description */}
                <div className="mb-8">
                  <motion.h3
                    className="mb-4 flex items-center gap-3 text-xl font-bold"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="bg-primary/10 rounded-lg p-2">
                      <Target className="text-primary h-6 w-6" />
                    </div>
                    What You'll Master
                  </motion.h3>
                  <motion.div
                    className="from-base-200/50 to-base-300/30 relative overflow-hidden rounded-xl bg-gradient-to-r p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="from-primary/10 absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-gradient-to-bl to-transparent" />
                    <p className="text-base-content/80 relative z-10 leading-relaxed">
                      Dive deep into{' '}
                      <span className="text-primary font-semibold">
                        {course.category.toLowerCase()}
                      </span>{' '}
                      with this comprehensive course designed for{' '}
                      <span className="font-semibold">
                        {getDifficultyText(course.difficulty).toLowerCase()}
                      </span>{' '}
                      level learners. Through hands-on exercises, real-world projects, and expert
                      guidance, you'll gain the practical skills needed to excel in today's
                      blockchain ecosystem.
                    </p>
                  </motion.div>
                </div>

                {/* Enhanced Learning Outcomes */}
                <div className="mb-8">
                  <motion.h3
                    className="mb-4 flex items-center gap-3 text-xl font-bold"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="bg-secondary/10 rounded-lg p-2">
                      <Zap className="text-secondary h-6 w-6" />
                    </div>
                    Key Learning Outcomes
                  </motion.h3>
                  <div className="grid gap-3">
                    {getLearningOutcomes(course.category).map((outcome, index) => (
                      <motion.div
                        key={index}
                        className="group from-base-200/30 hover:from-success/10 hover:to-success/5 flex items-start gap-4 rounded-xl bg-gradient-to-r to-transparent p-4 transition-all duration-300"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        whileHover={{ x: 4 }}
                      >
                        <div className="bg-success/20 group-hover:bg-success/30 mt-1 rounded-lg p-1.5 transition-colors duration-300">
                          <CheckCircle className="text-success h-4 w-4" />
                        </div>
                        <span className="text-base-content/80 group-hover:text-base-content text-sm leading-relaxed transition-colors duration-300">
                          {outcome}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="mt-10">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <motion.button
                      className="btn btn-primary group relative h-auto flex-1 gap-3 overflow-hidden py-4 text-lg text-white"
                      onClick={handleStartLearning}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      <Sparkles className="h-5 w-5" />
                      Start Learning
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </motion.button>

                    <motion.button
                      className="btn btn-outline btn-neutral h-auto flex-1 gap-2 py-4 text-lg transition-transform duration-300 hover:scale-102"
                      onClick={onClose}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                    >
                      Maybe Later
                    </motion.button>
                  </div>

                  {/* Additional Info */}
                  <motion.div
                    className="mt-6 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    <p className="text-base-content/60 text-sm leading-relaxed">
                      🚀 Start your learning journey today • Join{' '}
                      {Number(course.students).toLocaleString()} other students • No prerequisites
                      required
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
