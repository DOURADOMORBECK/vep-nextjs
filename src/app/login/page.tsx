'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUserLogger, USER_ACTIONS, MODULES } from '@/hooks/useUserLogger';
import { DataInitializationService } from '@/services/dataInitializationService';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { logAction } = useUserLogger();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Email e senha são obrigatórios');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting login for:', email);
      
      // Call the local API route which will proxy to Railway API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      console.log('Login response status:', response.status);
      console.log('Login response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        
        // Note: Token is now stored in httpOnly cookie by the server
        // We only store non-sensitive user data in localStorage for UI purposes
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userId', data.user?.id?.toString() || email);
        
        // Log successful login
        logAction({
          action: USER_ACTIONS.LOGIN,
          module: MODULES.AUTH,
          details: { email, role: data.user?.role, userId: data.user?.id }
        });
        
        // Inicializar dados após login bem-sucedido
        const initToast = toast.loading('Preparando o sistema...');
        
        try {
          const initResult = await DataInitializationService.initializeAllData();
          
          if (initResult.success) {
            toast.success('Sistema pronto para uso!', { 
              id: initToast,
              duration: 2000 
            });
          } else {
            toast.success('Sistema iniciado', { 
              id: initToast,
              duration: 2000 
            });
          }
        } catch (error) {
          toast.dismiss(initToast);
          console.error('Erro na inicialização:', error);
          // Não bloqueia o login se a inicialização falhar
        }
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Credenciais inválidas' }));
        console.error('Login failed:', errorData);
        
        setError(errorData.error || 'Credenciais inválidas. Por favor, tente novamente.');
        
        // Log failed login attempt
        logAction({
          action: USER_ACTIONS.LOGIN_FAILED,
          module: MODULES.AUTH,
          details: { email, reason: errorData.error || 'invalid_credentials' }
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Erro de conexão. Tente novamente.');
      
      // Log connection error
      logAction({
        action: USER_ACTIONS.LOGIN_FAILED,
        module: MODULES.AUTH,
        details: { email, reason: 'connection_error', error: (err as Error).message }
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="bg-gray-900 text-white flex items-center justify-center min-h-screen font-sans">
      {/* Font Awesome CDN */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      
      <div className="w-full max-w-md p-8 mx-auto">
        <div className="text-center mb-8">
          <div className="mb-4">
            <Image
              src="/logo_veplim.png" 
              alt="VepLim" 
              width={160}
              height={80}
              className="mx-auto"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Gestão de Operações</h1>
          <p className="text-gray-400">Faça login para acessar o sistema</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-envelope text-gray-500"></i>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2.5"
                  placeholder="seu.email@empresa.com"
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-lock text-gray-500"></i>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-white placeholder-gray-400 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 pr-10 p-2.5"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-500`}></i>
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-gray-300">
                  Lembrar-me
                </label>
              </div>
              <span className="text-sm text-primary-400 hover:text-primary-300 cursor-pointer">
                Esqueceu a senha?
              </span>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-800 font-medium rounded-lg text-sm px-5 py-3 text-center transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Entrando...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket mr-2"></i>
                  Entrar
                </>
              )}
            </button>
          </form>
          
          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-800 text-red-200 rounded-lg text-sm">
              <div className="flex items-center">
                <i className="fa-solid fa-circle-exclamation mr-2"></i>
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© 2023 Gestão de Operações. Todos os direitos reservados.</p>
          <div className="mt-2 flex justify-center space-x-4">
            <span className="text-gray-500 hover:text-primary-400 cursor-pointer">Suporte</span>
            <span className="text-gray-500 hover:text-primary-400 cursor-pointer">Política de Privacidade</span>
            <span className="text-gray-500 hover:text-primary-400 cursor-pointer">Termos de Uso</span>
          </div>
        </div>
      </div>
    </div>
  );
}