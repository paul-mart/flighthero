import { useEffect, useRef } from 'react';
import type { HeroChatMessage } from '../lib/heroChats';
import { splitMessageParts } from '../lib/askHero';
import { HeroChatMarkdown } from './HeroChatMarkdown';
import { HeroResultCard } from './HeroResultCard';

interface HeroChatThreadProps {
  messages: HeroChatMessage[];
  isTyping: boolean;
}

export function HeroChatThread({ messages, isTyping }: HeroChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const visible = messages.filter((m) => m.role !== 'system');

  return (
    <div className="hero-chat-thread" role="log" aria-live="polite" aria-relevant="additions">
      {visible.map((message, index) => {
        const isUser = message.role === 'user';
        const parts = isUser
          ? [{ type: 'text' as const, text: message.content }]
          : splitMessageParts(message.content);

        return (
          <div
            key={`${message.timestamp}-${index}`}
            className={`hero-chat-bubble-row hero-chat-bubble-row--${isUser ? 'user' : 'assistant'}`}
          >
            <div className={`hero-chat-bubble hero-chat-bubble--${isUser ? 'user' : 'assistant'}`}>
              {parts.map((part, partIndex) => {
                if (part.type === 'text') {
                  if (isUser) {
                    return (
                      <p key={partIndex} className="hero-chat-text">
                        {part.text}
                      </p>
                    );
                  }
                  return <HeroChatMarkdown key={partIndex} content={part.text} />;
                }
                return (
                  <div key={partIndex} className="hero-chat-results">
                    {part.results.map((result, resultIndex) => (
                      <HeroResultCard key={resultIndex} result={result} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {isTyping && (
        <div className="hero-chat-bubble-row hero-chat-bubble-row--assistant">
          <div className="hero-chat-bubble hero-chat-bubble--assistant hero-chat-typing" aria-label="Hero is typing">
            <span /><span /><span />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
