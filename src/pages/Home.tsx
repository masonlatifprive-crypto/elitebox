/**
 * Landing page `/` (home.md): hero S1, top content rail S2, pinned feature
 * story S3 (GSAP ScrollTrigger), addon engine S4, player S5, platforms +
 * downloads S6, final CTA S7. Footer is rendered by MarketingShell.
 *
 * Library isolation: Framer Motion drives UI entrances; GSAP/ScrollTrigger is
 * contained in <FeatureStory/> only.
 */
import { Fragment, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Activity, 
  ArrowRight, 
  Boxes, 
  ChevronRight, 
  Cpu, 
  Download, 
  Globe, 
  Layout, 
  Lock, 
  Play, 
  Shield, 
  Zap,
  Github,
  Twitter,
  MessageSquare
} from 'lucide-react';

import LivingTree from '../components/LivingTree';
import Logo from '../components/Logo';
import { ButtonNeon, ButtonPrimary, ButtonGhost, GlassPanel, Eyebrow } from '../components/ui-elite';
import { usePublicCatalog } from '../lib/usePublicCatalog';

gsap.registerPlugin(ScrollTrigger);

const PLATFORMS = [
  { name: 'Android', icon: '📱' },
  { name: 'Windows', icon: '💻' },
  { name: 'macOS', icon: '🍎' },
  { name: 'Linux', icon: '🐧' },
  { name: 'Android TV', icon: '📺' },
  { name: 'iOS', icon: '🍏' }
];

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <LivingTree />
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-black" />
      </div>
      
      <div className="container relative z-10 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Logo className="w-32 h-32 mx-auto mb-8 animate-engrave" />
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter">
            The Future of <span className="text-neon-cyan">Entertainment</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Experience a secure, private, and lightning-fast media hub. 
            EliteBoxMovies brings your favorite content and addons together in one cinematic interface.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/app/search">
              <ButtonNeon size="lg" className="px-8">
                Launch Web App <ArrowRight className="ml-2 w-5 h-5" />
              </ButtonNeon>
            </Link>
            <Link to="/downloads">
              <ButtonGhost size="lg" className="px-8 border-white/10">
                Get the App
              </ButtonGhost>
            </Link>
          </div>
        </motion.div>
      </div>
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
        <div className="w-6 h-10 rounded-full border-2 border-white flex justify-center pt-2">
          <div className="w-1 h-2 bg-white rounded-full" />
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="bg-black text-white selection:bg-neon-cyan/30">
      <Hero />
    </div>
  );
}
