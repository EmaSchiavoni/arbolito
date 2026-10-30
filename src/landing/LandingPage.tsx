import { getPlayground, PLAYGROUNDS } from '@/app/registry';
import { GLOBAL_KEYS } from '@/common/storage/keys';
import { load } from '@/common/storage/storage';
import { InteractiveGrid } from '@/landing/InteractiveGrid';
import { AboutSection } from './sections/AboutSection';
import { ClosingSection } from './sections/ClosingSection';
import { HeroSection } from './sections/HeroSection';
import { LandingFooter } from './sections/LandingFooter';
import { LandingHeader } from './sections/LandingHeader';
import { OpenSourceSection } from './sections/OpenSourceSection';
import { PlaygroundsSection } from './sections/PlaygroundsSection';
import { StructuresSection } from './sections/StructuresSection';
import './landing.css';

export default function LandingPage() {
  const lastId = load<string>(GLOBAL_KEYS.lastPlayground, PLAYGROUNDS[0].id);
  const last = getPlayground(lastId) ?? PLAYGROUNDS[0];

  return (
    <div id="top" className="landing-root relative isolate min-h-dvh overflow-x-clip bg-background text-foreground">
      <InteractiveGrid />
      <LandingHeader last={last} />
      <main className="relative z-10">
        <HeroSection />
        <AboutSection />
        <StructuresSection />
        <PlaygroundsSection />
        <OpenSourceSection />
        <ClosingSection last={last} />
      </main>
      <LandingFooter />
    </div>
  );
}
