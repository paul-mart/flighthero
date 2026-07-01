import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface HeroChatMarkdownProps {
  content: string;
}

export function HeroChatMarkdown({ content }: HeroChatMarkdownProps) {
  return (
    <div className="hero-chat-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
