import React, { useState } from 'react';
import { TopNavbar } from '../components/TopNavbar';
import { SiteFooter } from '../components/SiteFooter';
import { submitContactForm } from '../lib/contact';

export default function ContactUsPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await submitContactForm(email, message);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-page faq-shell">
      <TopNavbar />
      <main className="faq-main">
        <header className="faq-header">
          <h1 className="faq-title">Contact Us</h1>
        </header>

        <article className="faq-article contact-article">
          {submitted ? (
            <div className="contact-success" role="status">
              <h2 className="faq-article-title">Message sent</h2>
              <p>
                Thanks for reaching out. We received your message and will get back to you at{' '}
                <strong>{email.trim()}</strong>.
              </p>
            </div>
          ) : (
            <>
              <p className="contact-intro">
                Question not answered by the{' '}
                <Link to="/faq">FAQ</Link>, looking to report a bug, or want to contact the team?
                Send us a message below.
              </p>

              <form className="contact-form" onSubmit={handleSubmit}>
                <label className="contact-field">
                  <span className="contact-label">Your email</span>
                  <input
                    type="email"
                    className="contact-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    disabled={submitting}
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">Message</span>
                  <textarea
                    className="contact-textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us how we can help…"
                    required
                    minLength={10}
                    maxLength={4000}
                    rows={6}
                    disabled={submitting}
                  />
                </label>

                {error && (
                  <p className="contact-error" role="alert">
                    {error}
                  </p>
                )}

                <button type="submit" className="contact-submit" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send message'}
                </button>
              </form>
            </>
          )}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
