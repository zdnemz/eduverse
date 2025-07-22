import { BackgroundWithDots } from '@/components/Background';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import RootLayout from '@/components/layouts/RootLayout';

import Welcome from './Welcome';
import Stats from './Stats';
import Achievements from './Achievements';
import Learning from './Learning';
import ProtectedLayout from '@/components/layouts/ProtectedLayout';

export default function Dashboard() {
  return (
    <ProtectedLayout>
      <RootLayout
        className="min-h-screen w-full *:py-6 [&>*:first-child]:pt-24 [&>*:last-child]:pb-24"
        header={<Navbar />}
        footer={<Footer />}
      >
        <h1 className="text-base-content text-3xl font-bold md:text-4xl lg:text-5xl">Dashboard</h1>
        <BackgroundWithDots />

        <Welcome />
        <Stats />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Achievements />
          <Learning />
        </div>
      </RootLayout>
    </ProtectedLayout>
  );
}
