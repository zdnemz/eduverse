import { Award, CheckCircle2, Clock, Flame, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { MOTION_TRANSITION } from '@/constants/motion';

/**
 * Dummy stat datas
 */
const stats = [
  {
    label: 'Courses Completed',
    value: '12',
    icon: CheckCircle2,
    change: '+2',
    bgColor: 'bg-success/20',
    iconColor: 'text-success',
  },
  {
    label: 'Learning Hours',
    value: '147',
    icon: Clock,
    change: '+15',
    bgColor: 'bg-info/20',
    iconColor: 'text-info',
  },
  {
    label: 'Current Streak',
    value: '7',
    icon: Flame,
    change: '🔥',
    bgColor: 'bg-warning/20',
    iconColor: 'text-warning',
  },
  {
    label: 'Certificates',
    value: '8',
    icon: Award,
    change: '+1',
    bgColor: 'bg-error/20',
    iconColor: 'text-error',
  },
];

export default function Stats() {
  return (
    <section>
      <motion.div
        className="card bg-base-300/70 shadow-primary space-y-6 p-6 shadow"
        transition={{ ...MOTION_TRANSITION, delay: 0.4 }}
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
        <div className="flex items-center gap-3">
          <TrendingUp className="text-warning h-6 w-6" />
          <h3 className="text-xl font-semibold">Stats</h3>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="stats border-base-300 bg-base-200 border shadow">
              <div className="stat">
                <div className={`stat-figure ${stat.iconColor}`}>
                  <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="stat-title text-xs">{stat.label}</div>
                <div className="stat-value text-2xl">{stat.value}</div>
                <div className="stat-desc">
                  <span className="text-success font-medium">{stat.change}</span> this period
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
