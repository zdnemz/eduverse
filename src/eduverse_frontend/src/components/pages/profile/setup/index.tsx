import { motion } from 'framer-motion';
import { MOTION_TRANSITION } from '@/constants/motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { useLoading } from '@/hooks/useLoading';
import { retry } from '@/lib/utils';
import { withAuth } from '@/hoc/withAuth';
import { useActor, useAuthActions } from '@/stores/auth-store';
import { updateUser } from '@/services/auth-service';

const profileSetupSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .regex(
      /^[a-zA-Z\s\-'\.]+$/,
      'Name can only contain letters, spaces, hyphens, apostrophes, and periods'
    )
    .transform((val) => val.trim()),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254)
    .transform((val) => val.trim().toLowerCase()),
});

type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;

export default withAuth(function () {
  const actor = useActor();
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading('profile-setup');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
    clearErrors,
    reset,
  } = useForm<ProfileSetupFormData>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const onSubmit = async (data: ProfileSetupFormData) => {
    if (!actor) return;

    clearErrors();
    startLoading();

    try {
      await retry(async () => {
        return await updateUser(actor, data);
      });

      toast.success('Profile setup complete!', {
        description: `Welcome, ${data.name}!`,
      });

      reset();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.log(error);

      toast.error('Failed to setup profile', {
        description: 'Something went wrong. Please try again later.',
      });
    } finally {
      stopLoading();
    }
  };

  const onError = (formErrors: Record<string, { message?: string }>) => {
    const firstError = Object.values(formErrors)[0];
    if (firstError?.message) {
      toast.error('Form validation error', {
        description: firstError.message,
      });
    }
  };

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

        <form onSubmit={handleSubmit(onSubmit, onError)} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="label">
              <span className="label-text">Full Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              className={`input input-bordered w-full ${errors.name ? 'input-error border-error' : ''}`}
              disabled={isSubmitting}
              {...register('name')}
            />
            {errors.name && <span className="text-error text-sm">{errors.name.message}</span>}
          </div>

          <div>
            <label className="label">
              <span className="label-text">Email Address</span>
            </label>
            <input
              type="email"
              placeholder="Enter your email address"
              className={`input input-bordered w-full ${errors.email ? 'input-error border-error' : ''}`}
              disabled={isSubmitting}
              {...register('email')}
            />
            {errors.email && <span className="text-error text-sm">{errors.email.message}</span>}
          </div>

          <button
            type="submit"
            className={`btn btn-primary mt-4 w-full ${!isValid || !isDirty ? 'btn-disabled' : ''}`}
            disabled={isSubmitting || !isValid || !isDirty}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm" aria-hidden="true"></span>
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
    </div>
  );
});
