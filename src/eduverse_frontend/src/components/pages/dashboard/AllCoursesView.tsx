import { BookOpen, Star, Clock, Users, Search, Filter, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { MOTION_TRANSITION } from '@/constants/motion';

// Data courses Web3/Blockchain focused
const allCourses = [
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
    students: 1200,
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
    students: 950,
  },
  {
    id: 3,
    title: 'Internet Computer (ICP) Development',
    progress: 0,
    totalLessons: 32,
    completedLessons: 0,
    duration: '14 weeks',
    instructor: 'Dominic Williams',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
    difficulty: 'Advanced',
    rating: 4.7,
    nextLesson: 'Motoko Programming Basics',
    category: 'Internet Computer',
    students: 780,
  },
  {
    id: 4,
    title: 'Web3 Frontend with React & ethers.js',
    progress: 30,
    totalLessons: 20,
    completedLessons: 6,
    duration: '8 weeks',
    instructor: 'Sarah Web3',
    thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400',
    difficulty: 'Intermediate',
    rating: 4.6,
    nextLesson: 'Wallet Integration',
    category: 'Frontend',
    students: 1100,
  },
  {
    id: 5,
    title: 'DeFi Protocols & Yield Farming',
    progress: 75,
    totalLessons: 22,
    completedLessons: 17,
    duration: '10 weeks',
    instructor: 'Andre DeFi',
    thumbnail: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400',
    difficulty: 'Advanced',
    rating: 4.9,
    nextLesson: 'Liquidity Pool Optimization',
    category: 'DeFi',
    students: 890,
  },
  {
    id: 6,
    title: 'NFT Marketplace Development',
    progress: 45,
    totalLessons: 16,
    completedLessons: 7,
    duration: '6 weeks',
    instructor: 'Maya NFT',
    thumbnail: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=400',
    difficulty: 'Intermediate',
    rating: 4.8,
    nextLesson: 'IPFS Integration',
    category: 'NFTs',
    students: 1300,
  },
  {
    id: 7,
    title: 'Rust Programming for Web3',
    progress: 15,
    totalLessons: 28,
    completedLessons: 4,
    duration: '12 weeks',
    instructor: 'Gavin Rust',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400',
    difficulty: 'Advanced',
    rating: 4.7,
    nextLesson: 'Memory Management',
    category: 'Programming',
    students: 650,
  },
  {
    id: 8,
    title: 'DAO Governance & Tokenomics',
    progress: 90,
    totalLessons: 14,
    completedLessons: 13,
    duration: '4 weeks',
    instructor: 'Token Master',
    thumbnail: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400',
    difficulty: 'Beginner',
    rating: 4.6,
    nextLesson: 'Final Project: Create Your DAO',
    category: 'Governance',
    students: 2100,
  },
  {
    id: 9,
    title: 'Cryptocurrency Trading & Analysis',
    progress: 0,
    totalLessons: 20,
    completedLessons: 0,
    duration: '8 weeks',
    instructor: 'Crypto Analyst Pro',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
    difficulty: 'Beginner',
    rating: 4.5,
    nextLesson: 'Reading Candlestick Charts',
    category: 'Trading',
    students: 1800,
  },
];

interface AllCoursesViewProps {
  onBack: () => void;
}

export default function AllCoursesView({ onBack }: AllCoursesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    'Blockchain',
    'Smart Contracts',
    'Internet Computer',
    'Frontend',
    'DeFi',
    'NFTs',
    'Programming',
    'Governance',
    'Trading',
  ];

  const filteredCourses = allCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

      {/* Search and Filter - Fixed Layout */}
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

      {/* Courses Grid - No wrapper card */}
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
                  <div
                    className={`badge ${
                      course.difficulty === 'Beginner'
                        ? 'badge-success'
                        : course.difficulty === 'Intermediate'
                          ? 'badge-warning'
                          : 'badge-error'
                    } shadow-lg`}
                  >
                    {course.difficulty}
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
                    {course.students.toLocaleString()}
                  </div>
                </div>

                <div className="badge badge-outline badge-xs border-primary/30 text-primary mb-3">
                  {course.category}
                </div>

                {/* Progress Bar */}
                <div className="mt-auto">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="font-medium">Progress</span>
                    <span className="text-primary font-bold">{course.progress}%</span>
                  </div>
                  <div className="bg-base-300 h-2 w-full overflow-hidden rounded-full">
                    <motion.div
                      className="from-primary to-primary/80 h-full rounded-full bg-gradient-to-r"
                      transition={{ duration: 0.8, delay: index * 0.05 + 0.3 }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${course.progress}%` }}
                      viewport={{ once: true }}
                    />
                  </div>
                  <div className="text-base-content/60 mt-2 text-xs">
                    <span className="font-medium">{course.completedLessons}</span>/
                    {course.totalLessons} lessons completed
                  </div>
                </div>

                {course.progress > 0 && (
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
