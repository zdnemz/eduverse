import { BackgroundWithDots } from '@/components/Background';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import RootLayout from '@/components/layouts/RootLayout';
import { withAuth } from '@/hoc/withAuth';
import { useNavigate } from 'react-router-dom';
import AllCoursesView from './AllCoursesView';

export default withAuth(function AllCoursesPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <RootLayout
      className="min-h-screen w-full *:py-6 [&>*:first-child]:pt-24 [&>*:last-child]:pb-24"
      header={<Navbar />}
      footer={<Footer />}
      background={<BackgroundWithDots />}
    >
      <AllCoursesView onBack={handleBack} />
    </RootLayout>
  );
});
