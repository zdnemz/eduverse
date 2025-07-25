import { motion } from 'framer-motion';
import { MOTION_TRANSITION } from '@/constants/motion';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import InfoModal from '@/components/ui/infoModal';
import Loading from '@/components/Loading';
import { useNavigate } from 'react-router-dom';
import { createActorWithRetry, callWithRetry, isIdentityValid, handleAuthError } from '@/libs/auth';

export default function ProfileSetupPage() {
  const { identity, principal } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalMessage, setModalMessage] = useState(
    'Please fill in both your name and email address to continue'
  );
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      if (isIdentityValid(identity, principal) && principal) {
        setIsAuthReady(true);
      } else if (principal === '2vxsx-fae' || !principal) {
        console.warn('User is anonymous or no principal, need to login first');
        navigate('/');
      }
    };

    checkAuth();
  }, [identity, principal, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim() === '' || email.trim() === '') {
      setModalMessage('Please fill in both your name and email address to continue');
      setShowInfoModal(true);
      return;
    }

    if (!isIdentityValid(identity, principal)) {
      setModalMessage('Authentication error. Please refresh the page and try logging in again.');
      setShowInfoModal(true);
      return;
    }

    try {
      setTransitionLoading(true);

      const actor = await createActorWithRetry(identity!);

      await callWithRetry(() => actor.updateUser(name.trim(), [email.trim()]), 3, 1500);

      console.log('Profile setup successful');

      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save user:', error);

      const errorMessage = handleAuthError(error);
      setModalMessage(errorMessage);
      setShowInfoModal(true);
    } finally {
      setTransitionLoading(false);
    }
  };

  if (!isAuthReady) {
    return <Loading />;
  }

  if (transitionLoading) return <Loading />;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        className="card bg-base-300/70 shadow-primary w-full max-w-md p-8 shadow"
        transition={MOTION_TRANSITION}
        initial={{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(10px)' }}
        animate={{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }}
      >
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-bold">Welcome!</h1>
          <h2 className="text-base-content/70 text-lg">Complete Your Profile</h2>
          <p className="text-base-content/60 mt-2 text-sm">
            We need some basic information to get you started
          </p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="label">
              <span className="label-text">Full Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={transitionLoading}
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text">Email Address</span>
            </label>
            <input
              type="email"
              placeholder="Enter your email address"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={transitionLoading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary mt-4 w-full"
            disabled={transitionLoading}
          >
            {transitionLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Setting up...
              </>
            ) : (
              'Complete Setup'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-base-content/60 text-xs">
            Having trouble? Try refreshing the page and logging in again.
          </p>
        </div>
      </motion.div>

      <InfoModal
        state={[showInfoModal, setShowInfoModal]}
        title="Profile Setup"
        message={modalMessage}
      />
    </div>
  );
}
