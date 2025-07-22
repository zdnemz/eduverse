import RootLayout from '@/components/layouts/RootLayout';
import Navbar from '@/components/Navbar';
import { RefProvider } from '@/contexts/RefContext';
import { Helmet } from 'react-helmet-async';

import Hero from './Hero';
import ValueProposition from './ValueProposition';
import HowItWorks from './HowItWorks';
import Testimonials from './Testimonials';

export default function Home() {
  return (
    <>
      <Helmet>
        <title>EduVerse | Learn & Earn NFT Certificates on ICP</title>
        <meta
          name="description"
          content="EduVerse is a decentralized education platform where you can learn, pass quizzes, and earn blockchain-verified NFT certificates powered by the Internet Computer (ICP)."
        />
        <meta
          name="keywords"
          content="EduVerse, decentralized education, blockchain learning, NFT certificates, ICP education platform, learn to earn"
        />
      </Helmet>
      <RootLayout header={<Navbar />}>
        <RefProvider>
          <Hero />
          <ValueProposition />
          <HowItWorks />
          <Testimonials />
        </RefProvider>
      </RootLayout>
    </>
  );
}
