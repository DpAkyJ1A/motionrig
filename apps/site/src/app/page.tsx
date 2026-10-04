import { Closing } from '@/components/Closing/Closing';
import { Demos } from '@/components/Demos/Demos';
import { Engines } from '@/components/Engines/Engines';
import { Features } from '@/components/Features/Features';
import { Footer } from '@/components/Footer/Footer';
import { Handoff } from '@/components/Handoff/Handoff';
import { Hero } from '@/components/Hero/Hero';
import { HowItWorks } from '@/components/HowItWorks/HowItWorks';
import { Nav } from '@/components/Nav/Nav';
import { Quickstart } from '@/components/Quickstart/Quickstart';

export default function Page() {
  return (
    <>
      <Nav page="home" />
      <main id="main">
        <Hero />
        <Handoff />
        <HowItWorks />
        <Demos />
        <Features />
        <Engines />
        <Quickstart />
        <Closing />
      </main>
      <Footer />
    </>
  );
}
