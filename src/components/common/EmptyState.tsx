import React from 'react';

interface EmptyStateProps {
  icon?: string;
  iconComponent?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon,
  iconComponent,
  title,
  description,
  action,
  secondaryAction,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {/* Icon */}
      {(icon || iconComponent) && (
        <div className="mb-4">
          {iconComponent || (
            <span className="text-6xl opacity-50">{icon}</span>
          )}
        </div>
      )}
      
      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-300 mb-2">
        {title}
      </h3>
      
      {/* Description */}
      {description && (
        <p className="text-gray-400 text-center max-w-md mb-6">
          {description}
        </p>
      )}
      
      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex gap-3">
          {action && (
            <button
              onClick={action.onClick}
              disabled={action.loading}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {action.loading && (
                <i className="fas fa-spinner fa-spin"></i>
              )}
              {action.label}
            </button>
          )}
          
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}