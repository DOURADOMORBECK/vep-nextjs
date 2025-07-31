'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated, otherwise to dashboard
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="bg-gray-900 text-white flex items-center justify-center min-h-screen">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-600 mb-4">
          <i className="fa-solid fa-leaf text-2xl"></i>
        </div>
        <h1 className="text-2xl font-bold mb-2">Gestão de Operações</h1>
        <p className="text-gray-400">Carregando...</p>
      </div>
    </div>
  );
}
