import { useCallback } from 'react';

export interface LogAction {
  action: string;
  module: string;
  details?: Record<string, unknown>;
}

export function useUserLogger() {
  const logAction = useCallback(async ({ action, module, details = {} }: LogAction) => {
    try {
      // Log para desenvolvimento
      console.log(`[UserLog] ${module} - ${action}`, details);
      
      // Enviar log para API local
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          module,
          ...details,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      // Não bloquear a aplicação se o log falhar
      console.error('Erro ao registrar log:', error);
    }
  }, []);

  return { logAction };
}

// Ações padrão para consistência
export const USER_ACTIONS = {
  // Autenticação
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  
  // CRUD genérico
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VIEW: 'VIEW',
  SEARCH: 'SEARCH',
  EXPORT: 'EXPORT',
  
  // Produtos
  CREATE_PRODUCT: 'CREATE_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  
  // Clientes
  CREATE_CLIENT: 'CREATE_CLIENT',
  UPDATE_CLIENT: 'UPDATE_CLIENT',
  DELETE_CLIENT: 'DELETE_CLIENT',
  
  // Pedidos
  CREATE_ORDER: 'CREATE_ORDER',
  UPDATE_ORDER: 'UPDATE_ORDER',
  CANCEL_ORDER: 'CANCEL_ORDER',
  CONFIRM_ORDER: 'CONFIRM_ORDER',
  
  // Entregas
  START_DELIVERY: 'START_DELIVERY',
  UPDATE_DELIVERY_STATUS: 'UPDATE_DELIVERY_STATUS',
  COMPLETE_DELIVERY: 'COMPLETE_DELIVERY',
  
  // Jornadas
  START_JOURNEY: 'START_JOURNEY',
  COMPLETE_STEP: 'COMPLETE_STEP',
  SCAN_BARCODE: 'SCAN_BARCODE',
  
  // Sistema
  API_TEST: 'API_TEST',
  CHANGE_SETTINGS: 'CHANGE_SETTINGS',
  VIEW_REPORT: 'VIEW_REPORT',
};

// Módulos padrão
export const MODULES = {
  AUTH: 'AUTH',
  PRODUCTS: 'PRODUCTS',
  CLIENTS: 'CLIENTS',
  ORDERS: 'ORDERS',
  SUPPLIERS: 'SUPPLIERS',
  OPERATORS: 'OPERATORS',
  USERS: 'USERS',
  DELIVERY: 'DELIVERY',
  JOURNEY_PRODUCT: 'JOURNEY_PRODUCT',
  JOURNEY_ORDER: 'JOURNEY_ORDER',
  JOURNEY_DELIVERY: 'JOURNEY_DELIVERY',
  SYSTEM: 'SYSTEM',
};