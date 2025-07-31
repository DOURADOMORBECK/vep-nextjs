'use client';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {subtitle && (
            <div className="ml-4 px-3 py-1 bg-primary-800 text-primary-300 rounded-full text-xs font-medium">
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-white">
            <i className="fa-solid fa-bell"></i>
          </button>
          <button className="text-gray-400 hover:text-white">
            <i className="fa-solid fa-cog"></i>
          </button>
        </div>
      </div>
    </header>
  );
}