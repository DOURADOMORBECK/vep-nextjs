'use client';

import React from 'react';

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
  fullScreen?: boolean;
  blur?: boolean;
}

export default function LoadingOverlay({ 
  show, 
  message = 'Carregando...', 
  fullScreen = false,
  blur = true 
}: LoadingOverlayProps) {
  if (!show) return null;

  const overlayClasses = fullScreen
    ? 'fixed inset-0 z-50'
    : 'absolute inset-0 z-40';

  return (
    <div className={`${overlayClasses} flex items-center justify-center`}>
      {/* Background */}
      <div 
        className={`absolute inset-0 bg-gray-900 ${
          blur ? 'bg-opacity-75 backdrop-blur-sm' : 'bg-opacity-50'
        }`}
      />
      
      {/* Content */}
      <div className="relative bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col items-center">
        {/* Spinner */}
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 border-4 border-gray-600 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        
        {/* Message */}
        <p className="text-gray-300 font-medium">{message}</p>
      </div>
    </div>
  );
}