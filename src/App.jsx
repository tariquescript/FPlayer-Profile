import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { SpinnerIcon } from './components/ui/Icons.jsx';
import Home from './pages/Home.jsx';

// Home is the entry point and ships in the main chunk; the rest is split out so
// the first paint carries only what it needs.
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Club = lazy(() => import('./pages/Club.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function RouteFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-pitch-400">
      <SpinnerIcon size={30} />
    </div>
  );
}

export default function App() {
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
