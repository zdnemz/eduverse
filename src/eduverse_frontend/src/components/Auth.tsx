import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Modal from './ui/modal';
import { cn } from '@/lib/utils';
import { useLoading } from '@/hooks/useLoading';
import { useAuthActions } from '@/stores/auth-store';

export function LoginButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { startLoading, stopLoading } = useLoading('login');
  const navigate = useNavigate();

  const { login } = useAuthActions();

  const handleLogin = async () => {
    startLoading();
    const result = await login();

    if (result.success) {
      toast.success('Login succesfully');
      if (result.newUser) {
        navigate('/profile/setup');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast.error(result.error!);
    }
    stopLoading();
  };

  return (
    <button className={cn('btn rounded-lg', className)} onClick={handleLogin}>
      {children}
    </button>
  );
}

export function LogoutButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { startLoading, stopLoading } = useLoading('logout');
  const { logout } = useAuthActions();

  return (
    <>
      <button onClick={() => setShowLogoutModal(true)} className={cn('btn rounded-lg', className)}>
        {children}
      </button>

      <Modal
        state={[showLogoutModal, setShowLogoutModal]}
        name="Logout"
        onProcessMessage="Loging Out..."
        header="Logout Confirm"
        description="Are you sure want to logout?"
        handle={async () => {
          try {
            startLoading();
            await logout();
          } catch {
            toast.error('Something went wrong while logout');
          } finally {
            stopLoading();
          }
        }}
      />
    </>
  );
}
