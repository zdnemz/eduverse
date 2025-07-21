import RootLayout from '@/components/layouts/RootLayout';
import Navbar from '@/components/Navbar';
import Hero from './Hero';
import { RefProvider } from '@/contexts/RefContext';
import ValueProposition from './ValueProposition';

export default function Home() {
  return (
    <RootLayout header={<Navbar />}>
      <RefProvider>
        <Hero />
        <ValueProposition />
      </RefProvider>
    </RootLayout>
  );
}
