import { BookOpen, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { MOTION_TRANSITION } from '@/constants/motion';

const recentCourses = [
  {
    id: 1,
    title: 'Blockchain Fundamentals & Ethereum',
    progress: 85,
    totalLessons: 24,
    completedLessons: 20,
    duration: '12 weeks',
    instructor: 'Dr. Vitalik Chen',
    thumbnail: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400',
    difficulty: 'Intermediate',
    rating: 4.9,
    nextLesson: 'Smart Contract Security',
    category: 'Blockchain',
  },
  {
    id: 2,
    title: 'Solidity Smart Contract Development',
    progress: 60,
    totalLessons: 18,
    completedLessons: 11,
    duration: '10 weeks',
    instructor: 'Alex Ethereum',
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400',
    difficulty: 'Advanced',
    rating: 4.8,
    nextLesson: 'DeFi Protocol Development',
    category: 'Smart Contracts',
  },
];

interface LearningProps {
  onViewAll: () => void;
}

export default function Learning({ onViewAll }: LearningProps) {
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
          {/* Klik ini akan trigger onViewAll */}
          <button className="btn btn-ghost btn-primary btn-sm gap-2 rounded-lg" onClick={onViewAll}>
            View All
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {recentCourses.map((course) => (
            <div
              key={course.id}
              className="card border-base-300 bg-base-200 h-90 cursor-pointer border shadow"
            >
              <figure className="relative">
                <img
                  width={200}
                  height={200}
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full object-cover"
                />
                <div className="absolute top-4 right-4 left-4 flex justify-between">
                  <div
                    className={`badge ${
                      course.difficulty === 'Beginner'
                        ? 'badge-success'
                        : course.difficulty === 'Intermediate'
                          ? 'badge-warning'
                          : 'badge-error'
                    }`}
                  >
                    {course.difficulty}
                  </div>
                  <div className="badge badge-neutral">
                    <Star className="mr-1 h-3 w-3" />
                    {course.rating}
                  </div>
                </div>
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
                      {course.completedLessons}/{course.totalLessons} lessons
                    </span>
                    <span>{course.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
