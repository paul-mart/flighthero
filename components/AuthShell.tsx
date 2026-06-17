import React from 'react';
import { TopNavbar } from './TopNavbar';
import { SiteFooter } from './SiteFooter';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="app-page">
      <TopNavbar />
      <section className="hero-section auth-section" aria-labelledby="auth-title">
        <div className="hero-backdrop" aria-hidden />
        <div className="auth-inner">
          <div className="auth-card">
            <h1 id="auth-title" className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
            {children}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
