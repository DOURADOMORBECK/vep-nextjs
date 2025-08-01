'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AccessDeniedPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <i className="fas fa-lock text-6xl text-red-500 mb-4"></i>
          <h1 className="text-3xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-gray-400">
            Você não tem permissão para acessar esta página.
          </p>
        </div>

        {user && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <p className="text-gray-300 mb-2">
              Usuário: <span className="text-white font-medium">{user.name}</span>
            </p>
            <p className="text-gray-300">
              Perfil: <span className="text-white font-medium capitalize">{user.role}</span>
            </p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => router.back()}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Voltar
          </button>

          <Link
            href="/dashboard"
            className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <i className="fas fa-home mr-2"></i>
            Ir para o Dashboard
          </Link>
        </div>

        <p className="text-gray-500 text-sm mt-8">
          Se você acredita que deveria ter acesso a esta página, entre em contato com o administrador.
        </p>
      </div>
    </div>
  );
}