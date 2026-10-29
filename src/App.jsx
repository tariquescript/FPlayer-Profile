import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { SpinnerIcon } from './components/ui/Icons.jsx';
import Home from './pages/Home.jsx';

/**
 * A lazy route that can also be loaded ahead of time. Once preloaded it
 * renders synchronously, so a View Transition snapshots the real page rather
 * than a Suspense spinner.
 */
function preloadable(factory) {
  let Loaded = null;
  const load = () =>
    factory().then((module) => {
      Loaded = module.default;
      return module;
    });
  const Lazy = lazy(load);
  function Route(props) {
    return Loaded ? <Loaded {...props} /> : <Lazy {...props} />;
  }
  Route.preload = load;
  return Route;
}

// Home is the entry point and ships in the main chunk; the rest is split out so
// the first paint carries only what it needs.
const Profile = preloadable(() => import('./pages/Profile.jsx'));
const Club = preloadable(() => import('./pages/Club.jsx'));
const NotFound = preloadable(() => import('./pages/NotFound.jsx'));

function RouteFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-ink">
      <SpinnerIcon size={28} />
    </div>
  );
}

export default function App() {
  // Fetch the other pages' code once the browser has nothing better to do.
  useEffect(() => {
    const load = () => {
      Profile.preload().catch(() => {});
      Club.preload().catch(() => {});
    };
    if (typeof requestIdleCallback === 'function') {
      const handle = requestIdleCallback(load, { timeout: 3_000 });
      return () => cancelIdleCallback(handle);
    }
    const timer = setTimeout(load, 1_500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <ScrollToTop />

      <main className="flex-1">
        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/player/:id" element={<Profile />} />
              <Route path="/club/:id" element={<Club />} />
              {/* Keeps links shared from the previous version working. */}
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  );
}
