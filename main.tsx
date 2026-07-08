import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { TrackedDealsProvider } from './context/TrackedDealsContext';
import { ScrollToTop } from './components/ScrollToTop';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';
import FaqPage from './pages/FaqPage';
import LegalPage from './pages/LegalPage';
import ContactUsPage from './pages/ContactUsPage';
import AboutUsPage from './pages/AboutUsPage';
import PointsNewsPage from './pages/PointsNewsPage';
import PointsGuidePage from './pages/PointsGuidePage';
import PointsGuideDestinationPage from './pages/PointsGuideDestinationPage';
import AskHeroPage from './pages/AskHeroPage';
import DealsPage from './pages/DealsPage';

function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL;
  if (!base || base === '/') return undefined;
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename()}>
      <ScrollToTop />
      <AuthProvider>
        <TrackedDealsProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/auth" element={<Navigate to="/auth/sign-in" replace />} />
          <Route path="/auth/sign-in" element={<SignInPage />} />
          <Route path="/auth/sign-up" element={<SignUpPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/points-news" element={<PointsNewsPage />} />
          <Route path="/points-guide" element={<PointsGuidePage />} />
          <Route path="/points-guide/:guideId" element={<PointsGuideDestinationPage />} />
          <Route path="/ask-hero" element={<AskHeroPage />} />
          <Route path="/deals" element={<DealsPage />} />
        </Routes>
        </TrackedDealsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
