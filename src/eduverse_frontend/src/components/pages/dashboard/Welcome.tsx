import { ChevronRightCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { MOTION_TRANSITION } from '@/constants/motion';
import { formatPrincipal } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useActor, useAuthActions, useAuthUser, usePrincipal } from '@/stores/auth-store';
import { useEffect, useState } from 'react';
import { getUser as getCurrentUser } from '@/services/auth-service';
import { useLoading } from '@/hooks/useLoading';
import { toast } from 'sonner';

export default function Welcome() {
  const user = useAuthUser();
  const principal = usePrincipal();
  const actor = useActor();
  const [showModal, setShowModal] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [emailInput, setEmailInput] = useState(user?.email?.[0] || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const { startLoading, stopLoading } = useLoading('welcome-dashboard');

  const { setUser } = useAuthActions();

  const navigate = useNavigate();

const handleUpdateUser = async () => {
  if (!actor || !user) return toast.error('Actors are not ready');

  const trimmedName = nameInput.trim();
  const trimmedEmail = emailInput.trim();

  const nameChanged = trimmedName !== user.name;
  const emailChanged = trimmedEmail !== user.email?.[0];

  if (!nameChanged && !emailChanged) {
    return toast.info('No data was changed.');
  }

  const updatedName = nameChanged ? trimmedName : user.name;
  const updatedEmail: [string] = [emailChanged ? trimmedEmail : user.email?.[0] || ''];

  try {
    setIsUpdating(true);
    startLoading();
    await actor.updateUser(updatedName, updatedEmail);
    toast.success('User data updated successfully');

    const currentUser = await getCurrentUser(actor);
    if (currentUser) setUser(currentUser);
    setShowModal(false);
  } catch (error) {
    toast.error((error as Error).message || 'Failed to update data');
  } finally {
    setIsUpdating(false);
    stopLoading();
  }
};

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
                  onClick={() => {
                     if (!actor) {
                       toast.error('Actor belum siap. Coba beberapa saat lagi.');
                       return;
                     }
                    setNameInput(user?.name || '');
                    setEmailInput(user?.email?.[0] || '');
                    setShowModal(true);
                  }}
                  src="https://i.pinimg.com/736x/9a/7b/40/9a7b4099d1a9d5ff523aa0ff4ea3536c.jpg"
                  alt="User Avatar"
                  width={200}
                  height={200}
                  className="cursor-pointer rounded-2xl transition duration-300 ease-in-out hover:scale-105 hover:brightness-110"
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
              {user?.email && <p className="text-xs">📧 {user.email[0]}</p>}
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

      <dialog
        className={`modal ${showModal ? 'modal-open' : ''}`}
        onClick={() => setShowModal(false)}
      >
        <div className="modal-box bg-base-300" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-bold">Edit Profile</h3>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label">Name</label>
              <input
                className="input input-bordered w-full"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input input-bordered w-full"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-action">
            <button
              className="btn btn-primary"
              onClick={async () => {
                setShowModal(false);
                await handleUpdateUser();
              }}
            >
              Save
            </button>
            <button className="btn" onClick={() => setShowModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
