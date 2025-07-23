import { Trophy, Users, Star, Medal } from 'lucide-react';
import { motion } from 'framer-motion';
import { MOTION_TRANSITION } from '@/constants/motion';

/**
 * Dummy achievement datas
 */
const achievements = [
  {
    icon: Trophy,
    title: 'Course Master',
    description: 'Completed 12 courses',
    badge: 'badge-warning',
  },
  {
    icon: Users,
    title: 'Helper',
    description: 'Helped 20+ peers',
    badge: 'badge-success',
  },
  {
    icon: Star,
    title: 'Top Performer',
    description: 'Achieved 95% quiz scores',
    badge: 'badge-info',
  },
  {
    icon: Medal,
    title: 'Early Adopter',
    description: 'Joined EduVerse in beta phase',
    badge: 'badge-primary',
  },
];

export default function Achievements() {
  return (
    <section className="h-full">
      <motion.div
        className="card bg-base-300/70 shadow-primary h-full space-y-6 p-6 shadow"
        transition={{ ...MOTION_TRANSITION, delay: 0.6 }}
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
          <Trophy className="text-warning h-6 w-6" />
          <h3 className="text-xl font-semibold">Recent Achievement</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {achievements.map((achievement, index) => (
            <div key={index} className="card border-base-300 bg-base-200 border shadow">
              <div className="card-body p-4 text-center">
                <achievement.icon className="text-primary mx-auto mb-2 h-8 w-8" />
                <h3 className="font-semibold">{achievement.title}</h3>
                <p className="text-base-content/70 text-sm">{achievement.description}</p>
                <div className="card-actions mt-2 justify-center">
                  <div className={`badge ${achievement.badge}`}>New</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
