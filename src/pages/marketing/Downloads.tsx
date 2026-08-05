/**
 * /downloads — the full platform matrix, stremio-grade, with Premium-gated
 * native builds.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, Crown, Download, FileLock2, Globe, 
  Loader2, Lock, Monitor, Package, ShieldCheck, 
  Smartphone, TabletSmartphone, Tv 
} from 'lucide-react';
import { API_URL, useAuth } from '../../lib/auth';
import { ButtonGhost, ButtonPrimary, Eyebrow, GlassPanel, toast } from '../../components/ui-elite';
import { cn } from '../../lib/utils';
import { useT } from '../../i18n';


const Downloads = () => {
  const { t } = useT();
  const { user, isPremium } = useAuth();


  return (
    <div className="container mx-auto py-20 px-4">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <Eyebrow>{'Platforms' || 'Platforms'}</Eyebrow>
        <h1 className="text-4xl md:text-6xl font-bold mt-4 mb-6">
          {'Download EliteBox' || 'Download EliteBox'}
        </h1>
        <p className="text-xl text-muted-foreground">
          {'Available on all your favorite devices.' || 'Available on all your favorite devices.'}
        </p>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <GlassPanel className="p-8 flex flex-col items-center text-center">
          <Globe className="w-12 h-12 mb-6 text-primary" />
