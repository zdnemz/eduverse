import { ChevronRightCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { MOTION_TRANSITION } from '@/constants/motion';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrincipal } from '@/libs/utils';
import { useEffect, useState } from 'react';
import { createBackendActor } from '@/libs/actor';
import InfoModal from '@/components/ui/infoModal';
import Loading from '@/components/Loading';
import { useNavigate } from 'react-router-dom';

type User = {
  name: string;
  email?: string;
  completedCourses: string[];
};

export default function Welcome() {
  const { principal, identity } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(null);
    setShowForm(false);
    setLoadingUser(true);

    const checkUser = async () => {
      if (!principal) return;

      try {
        const actor = await createBackendActor(identity);
        const result = await actor.getMyProfile();
        const userData = Array.isArray(result) ? result[0] : result;

        if (
          !userData ||
          !userData.name ||
          userData.name.trim() === '' ||
          !userData.email ||
          userData.email.length === 0 ||
          userData.email[0].trim() === ''
        ) {
          setShowForm(true);
        } else {
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to retrieve user:', error);
      }

      setLoadingUser(false);
    };

    checkUser();
  }, [principal]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // show modal
    if (email.trim() === '') {
      setShowInfoModal(true);
      return;
    }

    try {
      const actor = await createBackendActor(identity);
      setTransitionLoading(true);
      await actor.updateUser(name, [email]);

      const newUser = await actor.getMyProfile();
      const userData = Array.isArray(newUser) ? newUser[0] : newUser;

      setUser(userData);
      setShowForm(false);
      setTransitionLoading(false);
    } catch (error) {
      console.error('Failed to save user:', error);
      setTransitionLoading(false);
    }
  };

  if (transitionLoading) return <Loading />;
  if (loadingUser) return <Loading />;
  if (showForm) {
    console.log('showForm', showForm);
    return (
      <section className="p-4">
        <motion.div
          className="card bg-base-300/70 shadow-primary p-6 shadow"
          transition={MOTION_TRANSITION}
          initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
          animate={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
        >
          <h2 className="mb-3 text-lg font-bold">Complete Your Profile</h2>
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Your Name"
              className="input input-bordered"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Your Email"
              className="input input-bordered"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn btn-primary w-fit">
              Save and Continue
            </button>
          </form>
        </motion.div>
        <InfoModal
          state={[showInfoModal, setShowInfoModal]}
          title="Complete Your Profile"
          message="name and email are required"
        />
      </section>
    );
  }

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
                  alt=""
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
              <p className="text-muted text-xs">
                {'# '}
                {formatPrincipal(principal || '')}
              </p>
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
