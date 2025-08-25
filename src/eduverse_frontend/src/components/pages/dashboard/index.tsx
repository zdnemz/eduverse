import { BackgroundWithDots } from '@/components/Background';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import RootLayout from '@/components/layouts/RootLayout';
import { withAuth } from '@/hoc/withAuth';
import { useNavigate } from 'react-router-dom';

import Welcome from './Welcome';
import Stats from './Stats';
import Achievements from './Achievements';
import Learning from './Learning';

export default withAuth(function Dashboard() {
  const navigate = useNavigate();

  const handleViewAllCourses = () => {
    navigate('/courses');
  };

  return (
    <RootLayout
      className="min-h-screen w-full *:py-6 [&>*:first-child]:pt-24 [&>*:last-child]:pb-24"
      header={<Navbar />}
      footer={<Footer />}
      background={<BackgroundWithDots />}
    >
      <h1 className="text-base-content text-3xl font-bold md:text-4xl lg:text-5xl">Dashboard</h1>
      <Welcome />
      <Stats />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Achievements />
        <Learning onViewAll={handleViewAllCourses} />
      </div>
    </RootLayout>
  );
});
