// LearningRoute.tsx - Fixed version
import { BackgroundWithDots } from '@/components/Background';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import RootLayout from '@/components/layouts/RootLayout';
import { withAuth } from '@/hoc/withAuth';
import LearningPage from './LearningPage';

export default withAuth(function LearningRoute() {
  return (
    <RootLayout
      // navbar={<Navbar />}
      footer={<Footer />}
      background={<BackgroundWithDots />}
    >
      <LearningPage />
    </RootLayout>
  );
});