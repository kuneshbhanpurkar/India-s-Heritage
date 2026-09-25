import React, { useEffect } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  icon?: string;
  iconColorClass?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerCustom?: React.ReactNode;
  showDefaultHeader?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  iconColorClass = 'text-primary',
  maxWidth = 'xl',
  children,
  footer,
  headerCustom,
  showDefaultHeader = true,
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`bg-surface-container-lowest rounded-xl w-full overflow-hidden border border-outline-variant shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col ${
          maxWidthClasses[maxWidth] || 'max-w-xl'
        } ${className}`}
      >
        {headerCustom ? (
          headerCustom
        ) : showDefaultHeader && (title || icon) ? (
          <div className="p-4 border-b border-surface-container flex items-center justify-between bg-surface-bright">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              {icon && (
                <span className={`material-symbols-outlined text-lg ${iconColorClass}`}>
                  {icon}
                </span>
              )}
              <div className="min-w-0">
                {typeof title === 'string' ? (
                  <h3 className="font-display font-bold text-sm text-on-surface truncate">
                    {title}
                  </h3>
                ) : (
                  title
                )}
                {subtitle && (
                  <span className="text-[0.68rem] text-secondary block truncate">
                    {subtitle}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-secondary hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
              title="Close dialog"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        ) : null}

        {children}

        {footer && (
          <div className="p-3.5 bg-surface-container border-t border-surface-container flex items-center justify-between">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
