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
  onDeleteChat: () => void;
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

export function HeroChatSidebar({
  chats,
  activeChatId,
  homeAirportLabel,
  homeAirport,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  mobileOpen,
  onCloseMobile,
}: HeroChatSidebarProps) {
  const grouped = groupChats(chats);
  const airportDisplay = homeAirport || homeAirportLabel || '—';

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
        <button type="button" className="hero-new-chat-btn" onClick={onNewChat}>
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
                    <li key={chat.id}>
                      <button
                        type="button"
                        className={`hero-chat-nav-item${activeChatId === chat.id ? ' hero-chat-nav-item--active' : ''}`}
                        onClick={() => {
                          onSelectChat(chat.id);
                          onCloseMobile();
                        }}
                      >
                        {chat.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {activeChatId && (
          <button
            type="button"
            className="hero-delete-chat-btn"
            onClick={onDeleteChat}
          >
            Delete chat
          </button>
        )}

        <div className="hero-chat-sidebar-footer">
          <span className="hero-home-airport" title="Your home airport">
            ✈ Flying from {airportDisplay}
          </span>
        </div>
      </aside>
    </>
  );
}
