import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNavbar } from '../components/TopNavbar';
import { HeroChatSidebar } from '../components/HeroChatSidebar';
import { HeroChatThread } from '../components/HeroChatThread';
import { useAuth } from '../context/AuthContext';
import { sendAskHeroMessage } from '../lib/askHero';
import {
  createHeroChat,
  deleteHeroChat,
  saveHeroChatMessages,
  subscribeHeroChats,
  type HeroChat,
  type HeroChatMessage,
} from '../lib/heroChats';

function buildQuickPrompts(homeAirport: string): string[] {
  const airport = homeAirport || 'my home airport';
  return [
    `Find me a business class deal from ${airport}`,
    'Where can I go for under 50k points?',
    'Is 70k points for Japan a good deal?',
    'Surprise me with a destination',
  ];
}

export default function AskHeroPage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [chats, setChats] = useState<HeroChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const homeAirport = profile?.preferences?.homeAirport ?? '';
  const homeAirportLabel = profile?.preferences?.homeAirportLabel ?? '';
  const quickPrompts = useMemo(() => buildQuickPrompts(homeAirport || homeAirportLabel), [homeAirport, homeAirportLabel]);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) ?? null,
    [chats, activeChatId],
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/sign-in', { replace: true, state: { from: '/ask-hero' } });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return undefined;
    return subscribeHeroChats(user.uid, setChats);
  }, [user]);

  const handleDeleteChat = useCallback(async () => {
    if (!user || !activeChatId || isTyping) return;

    const chatTitle = activeChat?.title ?? 'this chat';
    const confirmed = window.confirm(
      `Delete "${chatTitle}" permanently?\n\nThis will remove the conversation and all its messages. This cannot be undone.`,
    );
    if (!confirmed) return;

    setError('');
    try {
      await deleteHeroChat(user.uid, activeChatId);
      setActiveChatId(null);
      setInput('');
      setSidebarOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this chat.');
    }
  }, [user, activeChatId, activeChat?.title, isTyping]);

  const handleNewChat = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      const chatId = await createHeroChat(user.uid);
      setActiveChatId(chatId);
      setInput('');
      setSidebarOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start a new chat.');
    }
  }, [user]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !user || isTyping) return;

    setError('');
    setInput('');
    setIsTyping(true);

    let chatId = activeChatId;
    let existingMessages: HeroChatMessage[] = activeChat?.messages ?? [];

    try {
      if (!chatId) {
        chatId = await createHeroChat(user.uid);
        setActiveChatId(chatId);
        existingMessages = [];
      }

      const now = Date.now();
      const userMessage: HeroChatMessage = { role: 'user', content: trimmed, timestamp: now };
      const nextMessages = [...existingMessages, userMessage];
      const isFirstMessage = existingMessages.length === 0;

      await saveHeroChatMessages(user.uid, chatId, nextMessages);

      const apiMessages = nextMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const response = await sendAskHeroMessage(apiMessages, {
        homeAirport,
        homeAirportLabel,
        cppValuations: profile?.preferences?.cppValuations,
      });

      const assistantMessage: HeroChatMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
      };

      const title = isFirstMessage && response.title ? response.title : undefined;
      await saveHeroChatMessages(user.uid, chatId, [...nextMessages, assistantMessage], title);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setInput(trimmed);
    } finally {
      setIsTyping(false);
    }
  }, [user, isTyping, activeChatId, activeChat, homeAirport, homeAirportLabel, profile?.preferences?.cppValuations]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  if (authLoading || !user) {
    return (
      <div className="app-page ask-hero-page">
        <TopNavbar />
        <main className="ask-hero-loading">Loading…</main>
      </div>
    );
  }

  const hasMessages = (activeChat?.messages.length ?? 0) > 0;

  return (
    <div className="app-page ask-hero-page">
      <TopNavbar />
      <div className="ask-hero-layout">
        <HeroChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          homeAirport={homeAirport}
          homeAirportLabel={homeAirportLabel}
          onNewChat={() => { void handleNewChat(); }}
          onSelectChat={setActiveChatId}
          onDeleteChat={() => { void handleDeleteChat(); }}
          mobileOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        <main className="ask-hero-main">
          <button
            type="button"
            className="hero-sidebar-toggle"
            aria-label="Open conversation history"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <span /><span /><span />
          </button>

          <div className="ask-hero-chat-shell">
            <div className="ask-hero-chat-area">
              {!hasMessages && !isTyping ? (
                <div className="ask-hero-empty">
                  <h1 className="ask-hero-empty-heading">Where do you want to go?</h1>
                  <div className="ask-hero-prompts">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="ask-hero-prompt-chip"
                        onClick={() => { void sendMessage(prompt); }}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <HeroChatThread
                  messages={activeChat?.messages ?? []}
                  isTyping={isTyping}
                />
              )}
            </div>
            <div className="ask-hero-chat-fade" aria-hidden="true" />
          </div>

          <div className="ask-hero-composer">
            {error && (
              <p className="ask-hero-error" role="alert">{error}</p>
            )}
            <form className="ask-hero-input-bar" onSubmit={handleSubmit}>
            <input
              type="text"
              className="ask-hero-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about any route, destination, or deal…"
              disabled={isTyping}
              aria-label="Message Ask Hero"
            />
            <button
              type="submit"
              className="ask-hero-send-btn"
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
            >
              Send
            </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
