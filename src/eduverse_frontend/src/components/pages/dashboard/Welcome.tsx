import { ChevronRightCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { MOTION_TRANSITION } from '@/constants/motion';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrincipal } from '@/libs/utils';
import { useEffect, useState } from 'react';
import Loading from '@/components/Loading';
import { useNavigate } from 'react-router-dom';
import { createActorWithRetry, callWithRetry } from '@/libs/auth';

type User = {
  name: string;
  email?: string | string[];
  completedCourses: string[];
};

export default function Welcome() {
  const { principal, identity } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserProfile = async () => {
      if (!principal || !identity) {
        setLoadingUser(false);
        return;
      }

      if (principal === '2vxsx-fae') {
        console.warn('User is anonymous');
        setLoadingUser(false);
        return;
      }

      try {
        const actor = await createActorWithRetry(identity);

        const result = await callWithRetry(() => actor.getMyProfile());
        const userData = Array.isArray(result) ? result[0] : result;

        if (
          !userData ||
          !userData.name ||
          userData.name.trim() === '' ||
          !userData.email ||
          (Array.isArray(userData.email) && userData.email.length === 0) ||
          (Array.isArray(userData.email) && userData.email[0].trim() === '') ||
          (typeof userData.email === 'string' && userData.email.trim() === '')
        ) {
          navigate('/profile/setup');
          return;
        }

        setUser(userData);
      } catch (error) {
        console.error('Failed to retrieve user:', error);
        navigate('/profile/setup');
      }

      setLoadingUser(false);
    };

    checkUserProfile();
  }, [principal, identity, navigate]);

  if (loadingUser) return <Loading />;

  if (!user) return <Loading />;

  return (
    <section>
      <motion.div
        className="card bg-base-300/70 shadow-primary p-6 shadow"
        transition={MOTION_TRANSITION}
        initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="flex flex-col justify-between gap-y-6 md:flex-row">
          <div className="flex gap-6">
            <div className="avatar">
              <div className="shadow-primary w-16 rounded-2xl shadow">
                <img
                  src="https://i.pinimg.com/736x/9a/7b/40/9a7b4099d1a9d5ff523aa0ff4ea3536c.jpg"
                  alt="User Avatar"
                  width={200}
                  height={200}
                />
              </div>
            </div>
            <div>
              <h3 className="text-xl">
                Welcome Back,{' '}
                <span className="text-accent font-semibold capitalize">{user.name.trim()}</span>
              </h3>
              <p className="text-muted text-xs">
                {'# '}
                {formatPrincipal(principal || '')}
              </p>
              {user.email && (
                <p className="text-xs">
                  📧 {Array.isArray(user.email) ? user.email[0] : user.email}
                </p>
              )}
            </div>
          </div>
          <div>
            <button
              className="btn btn-outline btn-primary w-full rounded-lg sm:w-fit"
              onClick={() => navigate('/certificate')}
            >
              View Certificate
              <ChevronRightCircle />
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
