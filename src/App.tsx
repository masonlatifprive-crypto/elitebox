/**
 * Elitebox router. Lazy route-level code splitting; two nested-route shells:
 * MarketingShell (/ /sports /store /support /login /register /subscribe) and
 * AppShell (/app/*). All routes wired to real pages.
 *
 * Route transitions (design.md §7): AnimatePresence keyed on the pathname —
 * a 200ms out-expo crossfade between pages. Opacity-only so fixed-position
 * pages (Player) are never reflowed mid-transition.
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ToastHost } from '@/components/ui-elite';
import { TreeLoader } from '@/components/LivingTree';

// Shells are heavy (AmbienceCanvas, nav, rail, tvnav) — split like pages.
const MarketingShell = lazy(() =>
  import('@/components/Layout').then((m) => ({ default: m.MarketingShell })),
);
const AppShell = lazy(() =>
  import('@/components/Layout').then((m) => ({ default: m.AppShell })),
);

const Home = lazy(() => import('@/pages/Home'));
const Sports = lazy(() => import('@/pages/marketing/Sports'));
const Store = lazy(() => import('@/pages/marketing/Store'));
const Support = lazy(() => import('@/pages/marketing/Support'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const Subscribe = lazy(() => import('@/pages/auth/Subscribe'));
const Privacy = lazy(() => import('@/pages/marketing/Privacy'));
const Terms = lazy(() => import('@/pages/marketing/Terms'));
const Security = lazy(() => import('@/pages/marketing/Security'));
const Developers = lazy(() => import('@/pages/marketing/Developers'));
const Downloads = lazy(() => import('@/pages/marketing/Downloads'));
const Features = lazy(() => import('@/pages/marketing/Features'));
const Technology = lazy(() => import('@/pages/marketing/Technology'));
const Cookies = lazy(() => import('@/pages/marketing/Cookies'));
const Updates = lazy(() => import('@/pages/marketing/Updates'));
const Community = lazy(() => import('@/pages/marketing/Community'));
const Providers = lazy(() => import('@/pages/marketing/Providers'));

const AppHome = lazy(() => import('@/pages/app/AppHome'));
const Calendar = lazy(() => import('@/pages/app/Calendar'));
const Discover = lazy(() => import('@/pages/app/Discover'));
const Catalog = lazy(() => import('@/pages/app/Catalog'));
const Live = lazy(() => import('@/pages/app/Live'));
const Detail = lazy(() => import('@/pages/app/Detail'));
const Player = lazy(() => import('@/pages/app/Player'));
const LibraryPage = lazy(() => import('@/pages/app/LibraryPage'));
const Search = lazy(() => import('@/pages/app/Search'));
const Addons = lazy(() => import('@/pages/app/Addons'));
const Profiles = lazy(() => import('@/pages/app/Profiles'));
const Stats = lazy(() => import('@/pages/app/Stats'));
const Settings = lazy(() => import('@/pages/app/Settings'));
const Account = lazy(() => import('@/pages/app/Account'));
const Onboarding = lazy(() => import('@/pages/app/Onboarding'));
const TvMode = lazy(() => import('@/pages/app/TvMode'));

/** /app/title/:type/:id → /app/detail/:type/:id (spec alias, params preserved). */
function TitleAlias() {
  const { type, id } = useParams();
  return <Navigate to={`/app/detail/${type}/${id}`} replace />;
}

function RouteFallback() {
  return <TreeLoader label="Loading EliteBox" className="min-h-[100dvh]" />;
}

function RoutedPages() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          {/* ── marketing shell ── */}
          <Route element={<MarketingShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/sports" element={<Sports />} />
            <Route path="/store" element={<Store />} />
            <Route path="/support" element={<Support />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/security" element={<Security />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/features" element={<Features />} />
            <Route path="/technology" element={<Technology />} />
            <Route path="/community" element={<Community />} />
            <Route path="/providers" element={<Providers />} />
            <Route path="/addons" element={<Providers />} />
            <Route path="/addon-sdk" element={<Developers />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/tos" element={<Navigate to="/terms" replace />} />
            {/* spec-route aliases */}
            <Route path="/download" element={<Navigate to="/downloads" replace />} />
            <Route path="/apps" element={<Navigate to="/downloads" replace />} />
            <Route path="/anime" element={<Navigate to="/app/discover?genre=Anime" replace />} />
            <Route path="/global-catalog" element={<Navigate to="/app/discover" replace />} />
                        <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* ── app shell ── */}
          <Route path="/app" element={<AppShell />}>
            <Route index element={<AppHome />} />
            <Route path="home" element={<Navigate to="/app" replace />} />
            <Route path="discover" element={<Discover />} />
            <Route path="movies" element={<Catalog kind="movie" />} />
            <Route path="series" element={<Catalog kind="series" />} />
            <Route path="anime" element={<Navigate to="/app/discover?genre=Anime" replace />} />
            <Route path="global" element={<Navigate to="/app/discover" replace />} />
            <Route path="live" element={<Live />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="detail/:type/:id" element={<Detail />} />
            <Route path="player/:type/:id" element={<Player />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="search" element={<Search />} />
            <Route path="addons" element={<Addons />} />
            <Route path="profiles" element={<Profiles />} />
            <Route path="stats" element={<Stats />} />
            <Route path="settings" element={<Settings />} />
            <Route path="account" element={<Account />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="tv" element={<TvMode />} />
            {/* spec-route aliases */}
            <Route path="board" element={<Navigate to="/app" replace />} />
            <Route path="sources" element={<Navigate to="/app/addons" replace />} />
            <Route path="title/:type/:id" element={<TitleAlias />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <RoutedPages />
      </Suspense>
      <ToastHost />
    </BrowserRouter>
  );
}
