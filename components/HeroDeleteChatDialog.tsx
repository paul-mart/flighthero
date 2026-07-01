import { useEffect, useRef } from 'react';

interface HeroDeleteChatDialogProps {
  chatTitle: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function HeroDeleteChatDialog({
  chatTitle,
  isDeleting,
  onCancel,
  onConfirm,
}: HeroDeleteChatDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, isDeleting]);

  return (
    <div
      className="hero-delete-dialog-overlay"
      onClick={isDeleting ? undefined : onCancel}
    >
      <div
        className="hero-delete-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="hero-delete-dialog-title"
        aria-describedby="hero-delete-dialog-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="hero-delete-dialog-title" className="hero-delete-dialog-title">
          Delete chat?
        </h2>
        <p id="hero-delete-dialog-desc" className="hero-delete-dialog-desc">
          <span className="hero-delete-dialog-chat-title">{chatTitle}</span>
          {' '}will be permanently deleted along with all its messages. This cannot be undone.
        </p>
        <div className="hero-delete-dialog-actions">
          <button
            ref={cancelRef}
            type="button"
            className="hero-delete-dialog-btn hero-delete-dialog-btn--cancel"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="hero-delete-dialog-btn hero-delete-dialog-btn--confirm"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
