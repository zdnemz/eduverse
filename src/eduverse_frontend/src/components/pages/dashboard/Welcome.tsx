import { ChevronRightCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { MOTION_TRANSITION } from '@/constants/motion';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrincipal } from '@/libs/utils';

export default function Welcome() {
  const { principal } = useAuth();

  return (
    <section>
      <motion.div
        className="card bg-base-300/70 shadow-primary p-6 shadow"
        transition={MOTION_TRANSITION}
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
        <div className="flex flex-col justify-between gap-y-6 md:flex-row">
          <div className="flex gap-6">
            <div className="avatar">
              <div className="shadow-primary w-16 rounded-2xl shadow">
                <img
                  src="https://img.daisyui.com/images/profile/demo/yellingwoman@192.webp"
                  alt=""
                  width={200}
                  height={200}
                />
              </div>
            </div>
            <div>
              <h3 className="text-xl">
                Welcome Back, <span className="text-accent font-semibold">User</span> !
              </h3>
              <p className="text-muted text-xs">
                {'# '}
                {formatPrincipal(principal || '')}
              </p>
            </div>
          </div>
          <div>
            <button className="btn btn-outline btn-primary w-full rounded-lg sm:w-fit">
              View Certificate
              <ChevronRightCircle />
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
