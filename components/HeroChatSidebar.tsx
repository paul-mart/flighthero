import { useEffect, useRef, useState } from 'react';
import {
  CHAT_GROUP_LABELS,
  getChatDateGroup,
  type ChatDateGroup,
  type HeroChat,
} from '../lib/heroChats';

interface HeroChatSidebarProps {
  chats: HeroChat[];
  activeChatId: string | null;
  homeAirportLabel: string;
  homeAirport: string;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onRenameChat: (chatId: string, title: string) => void;
  onDeleteChat: (chatId: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const GROUP_ORDER: ChatDateGroup[] = ['today', 'yesterday', 'last7'];

function groupChats(chats: HeroChat[]): Map<ChatDateGroup, HeroChat[]> {
  const map = new Map<ChatDateGroup, HeroChat[]>();
  for (const chat of chats) {
    const group = getChatDateGroup(chat.updatedAt);
    if (group === 'older') continue;
    const list = map.get(group) ?? [];
    list.push(chat);
    map.set(group, list);
  }
  return map;
}

interface ChatNavRowProps {
  chat: HeroChat;
  isActive: boolean;
  isRenaming: boolean;
  onSelect: () => void;
  onStartRename: () => void;
  onEndRename: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

function ChatNavRow({
  chat,
  isActive,
  isRenaming,
  onSelect,
  onStartRename,
  onEndRename,
  onRename,
  onDelete,
}: ChatNavRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(chat.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isRenaming) {
      setRenameValue(chat.title);
    }
  }, [chat.title, isRenaming]);

  useEffect(() => {
    if (!isActive) {
      setMenuOpen(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [menuOpen]);

  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [isRenaming]);

  const startRename = () => {
    setMenuOpen(false);
    setRenameValue(chat.title);
    onStartRename();
  };

  const submitRename = () => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      onEndRename();
      setRenameValue(chat.title);
      return;
    }
    onRename(trimmed);
    onEndRename();
  };

  const cancelRename = () => {
    onEndRename();
    setRenameValue(chat.title);
  };

  if (isRenaming) {
    return (
      <li className="hero-chat-nav-row hero-chat-nav-row--renaming">
        <form
          className="hero-chat-rename-form"
          onSubmit={(event) => {
            event.preventDefault();
            submitRename();
          }}
        >
          <input
            ref={renameInputRef}
            type="text"
            className="hero-chat-rename-input"
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                cancelRename();
              }
            }}
            aria-label="Rename conversation"
            maxLength={60}
          />
        </form>
      </li>
    );
  }

  return (
    <li
      className={`hero-chat-nav-row${isActive ? ' hero-chat-nav-row--active' : ''}${menuOpen ? ' hero-chat-nav-row--menu-open' : ''}`}
    >
      <button
        type="button"
        className="hero-chat-nav-item"
        onClick={onSelect}
      >
        {chat.title}
      </button>

      <div className="hero-chat-nav-actions" ref={menuRef}>
        <button
          type="button"
          className="hero-chat-nav-menu-btn"
          aria-label={`Options for ${chat.title}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => !open);
          }}
        >
          <span aria-hidden="true">⋯</span>
        </button>

        {menuOpen && (
          <div className="hero-chat-nav-menu" role="menu">
            <button
              type="button"
              className="hero-chat-nav-menu-item"
              role="menuitem"
              onClick={startRename}
            >
              Rename
            </button>
            <button
              type="button"
              className="hero-chat-nav-menu-item hero-chat-nav-menu-item--danger"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export function HeroChatSidebar({
  chats,
  activeChatId,
  homeAirportLabel,
  homeAirport,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  mobileOpen,
  onCloseMobile,
}: HeroChatSidebarProps) {
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const grouped = groupChats(chats);
  const airportDisplay = homeAirport || homeAirportLabel || '—';

  const clearRename = () => setRenamingChatId(null);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="hero-sidebar-backdrop"
          aria-label="Close conversation list"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`hero-chat-sidebar${mobileOpen ? ' hero-chat-sidebar--open' : ''}`}
        aria-label="Conversation history"
      >
        <button
          type="button"
          className="hero-new-chat-btn"
          onClick={() => {
            clearRename();
            onNewChat();
          }}
        >
          New Chat
        </button>

        <nav className="hero-chat-nav">
          {GROUP_ORDER.map((group) => {
            const items = grouped.get(group);
            if (!items?.length) return null;
            return (
              <div key={group} className="hero-chat-nav-group">
                <h2 className="hero-chat-nav-heading">{CHAT_GROUP_LABELS[group]}</h2>
                <ul className="hero-chat-nav-list">
                  {items.map((chat) => (
                    <ChatNavRow
                      key={chat.id}
                      chat={chat}
                      isActive={activeChatId === chat.id}
                      isRenaming={renamingChatId === chat.id}
                      onSelect={() => {
                        clearRename();
                        onSelectChat(chat.id);
                        onCloseMobile();
                      }}
                      onStartRename={() => setRenamingChatId(chat.id)}
                      onEndRename={clearRename}
                      onRename={(title) => onRenameChat(chat.id, title)}
                      onDelete={() => onDeleteChat(chat.id)}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="hero-chat-sidebar-footer">
          <span className="hero-home-airport" title="Your home airport">
            ✈ Flying from {airportDisplay}
          </span>
        </div>
      </aside>
    </>
  );
}
