import React from 'react';

interface SuccessMessageProps {
  title: string;
  message: string;
  icon?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    primary?: boolean;
  }>;
}

/**
 * Componente para mostrar SEMPRE mensagens de sucesso
 * Nunca mostra erros - apenas caminhos alternativos de sucesso
 */
export function SuccessMessage({ title, message, icon = 'fa-check-circle', actions }: SuccessMessageProps) {
  return (
    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <i className={`fas ${icon} text-2xl text-green-400`}></i>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-green-300">{title}</h3>
          <p className="mt-1 text-green-200">{message}</p>
          
          {actions && actions.length > 0 && (
            <div className="mt-4 flex gap-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    action.primary
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Estado de carregamento positivo
 */
export function PositiveLoading({ message = 'Preparando tudo para você...' }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <i className="fas fa-circle-notch fa-spin text-4xl text-primary-400 mb-4"></i>
        <p className="text-gray-300">{message}</p>
      </div>
    </div>
  );
}

/**
 * Card de Status sempre positivo
 */
export function StatusCard({ 
  title, 
  value, 
  subtitle,
  trend = 'up' 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  trend?: 'up' | 'stable';
}) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        {trend === 'up' && (
          <i className="fas fa-arrow-up text-green-400"></i>
        )}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}