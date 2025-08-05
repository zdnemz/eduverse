import { ChevronRightCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { MOTION_TRANSITION } from '@/constants/motion';
import { formatPrincipal } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useActor, useAuthActions, useAuthUser, usePrincipal } from '@/stores/auth-store';
import { useEffect } from 'react';
import { getUser as getCurrentUser } from '@/services/auth-service';
import { useLoading } from '@/hooks/useLoading';
import { toast } from 'sonner';

export default function Welcome() {
  const user = useAuthUser();
  const principal = usePrincipal();
  const actor = useActor();

  const { startLoading, stopLoading } = useLoading('welcome-dashboard');

  const { setUser } = useAuthActions();

  const navigate = useNavigate();

  useEffect(() => {
    if (user) return;

    async function getUser() {
      try {
        startLoading();

        if (!actor) throw new Error('No actor available');

        const currentUser = await getCurrentUser(actor);
        if (!currentUser) throw new Error('Failed to get user data');

        setUser(currentUser);
      } catch (err) {
        const message = (err as Error).message;
        console.error('Get user data :', message);

        toast.error(message || 'Something went wrong');
      } finally {
        stopLoading();
      }
    }

    getUser();
  }, []);

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
                <span className="text-accent font-semibold capitalize">
                  {user?.name?.trim() || 'User'}
                </span>
              </h3>
              <p className="text-muted text-xs"># {formatPrincipal(principal || '')}</p>
              {user?.email && <p className="text-xs">📧 {user.email}</p>}
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
