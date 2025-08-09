import { BackgroundWithDots } from '@/components/Background';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import RootLayout from '@/components/layouts/RootLayout';
import { withAuth } from '@/hoc/withAuth';
import { useState } from 'react';

import Welcome from './Welcome';
import Stats from './Stats';
import Achievements from './Achievements';
import Learning from './Learning';
import AllCoursesView from './AllCoursesView'; // Component baru yang akan kita buat

export default withAuth(function Dashboard() {
  // State untuk toggle view
  const [showAllCourses, setShowAllCourses] = useState(false);

  return (
    <RootLayout
      className="min-h-screen w-full *:py-6 [&>*:first-child]:pt-24 [&>*:last-child]:pb-24"
      header={<Navbar />}
      footer={<Footer />}
      background={<BackgroundWithDots />}
    >
      {showAllCourses ? (
        // View All Courses - Tampil full screen
        <AllCoursesView onBack={() => setShowAllCourses(false)} />
      ) : (
        // Dashboard Normal
        <>
          <h1 className="text-base-content text-3xl font-bold md:text-4xl lg:text-5xl">
            Dashboard
          </h1>
          <Welcome />
          <Stats />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Achievements />
            <Learning onViewAll={() => setShowAllCourses(true)} />
          </div>
        </>
      )}
    </RootLayout>
  );
});
