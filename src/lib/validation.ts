// Server-side validation utilities
import { z } from 'zod';

// Base validation schemas
export const emailSchema = z.string().email('Email inválido').min(1, 'Email é obrigatório');
export const passwordSchema = z.string().min(6, 'Senha deve ter no mínimo 6 caracteres');
export const nameSchema = z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres');

// Authentication validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória')
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['user', 'admin', 'operator', 'owner', 'supervisor', 'manager']).optional()
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Senha atual é obrigatória'),
  new_password: passwordSchema
});

// User validation schemas
export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['user', 'admin', 'operator', 'owner', 'supervisor', 'manager']).default('user'),
  is_active: z.boolean().default(true)
});

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  role: z.enum(['user', 'admin', 'operator', 'owner', 'supervisor', 'manager']).optional(),
  is_active: z.boolean().optional()
});

// Customer validation schemas
export const brazilianCPFSchema = z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF inválido');
export const brazilianCNPJSchema = z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, 'CNPJ inválido');
export const brazilianCEPSchema = z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido');
export const brazilianUFSchema = z.string().length(2, 'UF deve ter 2 caracteres').regex(/^[A-Z]{2}$/, 'UF inválido');

export const createCustomerSchema = z.object({
  nome_fantasia: z.string().min(2, 'Nome fantasia é obrigatório').max(200, 'Nome fantasia muito longo'),
  razao_social: z.string().max(200, 'Razão social muito longa').optional(),
  tipo_pessoa: z.enum(['PF', 'PJ']).default('PF'),
  cpf: brazilianCPFSchema.optional(),
  cnpj: brazilianCNPJSchema.optional(),
  ie: z.string().max(20, 'Inscrição estadual muito longa').optional(),
  email: emailSchema,
  telefone: z.string().max(20, 'Telefone muito longo').optional(),
  telefone_2: z.string().max(20, 'Telefone 2 muito longo').optional(),
  celular: z.string().max(20, 'Celular muito longo').optional(),
  cep: brazilianCEPSchema,
  endereco: z.string().min(5, 'Endereço é obrigatório').max(200, 'Endereço muito longo'),
  numero: z.string().min(1, 'Número é obrigatório').max(10, 'Número muito longo'),
  complemento: z.string().max(100, 'Complemento muito longo').optional(),
  bairro: z.string().min(2, 'Bairro é obrigatório').max(100, 'Bairro muito longo'),
  cidade: z.string().min(2, 'Cidade é obrigatória').max(100, 'Cidade muito longa'),
  uf: brazilianUFSchema,
  latitude: z.string().max(20, 'Latitude inválida').optional(),
  longitude: z.string().max(20, 'Longitude inválida').optional(),
  limite_credito: z.number().min(0, 'Limite de crédito deve ser positivo').default(0),
  observacoes: z.string().max(500, 'Observações muito longas').optional()
}).refine((data) => {
  // If PF, CPF is required and CNPJ should not be present
  if (data.tipo_pessoa === 'PF') {
    return data.cpf && !data.cnpj;
  }
  // If PJ, CNPJ is required and CPF should not be present
  if (data.tipo_pessoa === 'PJ') {
    return data.cnpj && !data.cpf;
  }
  return true;
}, {
  message: 'Para PF é obrigatório CPF, para PJ é obrigatório CNPJ',
  path: ['tipo_pessoa']
});

export const updateCustomerSchema = createCustomerSchema.partial();

// General query parameters validation
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0)
});

export const searchSchema = z.object({
  search: z.string().max(100, 'Termo de busca muito longo').optional(),
  ...paginationSchema.shape
});

// API response validation
export const apiErrorSchema = z.object({
  error: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  code: z.string().optional()
});

export const apiSuccessSchema = z.object({
  message: z.string().optional(),
  data: z.any().optional()
});

// Validation utility functions
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Erro de validação desconhecido' } };
  }
}

// Sanitization functions
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>\"'&]/g, (match) => {
    const chars: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    };
    return chars[match] || match;
  });
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// Rate limiting validation
export const rateLimitSchema = z.object({
  attempts: z.number().min(0),
  lastAttempt: z.date(),
  lockoutUntil: z.date().optional()
});

// Environment validation
export const envSchema = z.object({
  // Core Next.js environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  
  // Railway environment
  RAILWAY_ENV: z.string().optional(),
  
  // Authentication & Security (optional for frontend-only apps)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres').optional(),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET deve ter no mínimo 32 caracteres').optional(),
  
  // Database (optional for frontend-only apps)
  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL válida').optional(),
  
  // External API URLs for development (NEXT_PUBLIC_*)
  NEXT_PUBLIC_API_USERS_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_CUSTOMERS_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_PRODUCTS_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_DASHBOARD_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_USERLOG_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_DELIVERY_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_AUDIT_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_VEHICLES_URL: z.string().url().optional(),
  
  // Internal Railway service URLs for production (BUN_*)
  BUN_USERS_SERVICE_URL: z.string().url().optional(),
  BUN_CUSTOMERS_SERVICE_URL: z.string().url().optional(),
  BUN_JORNADA_PRODUTO_SERVICE_URL: z.string().url().optional(),
  BUN_DASHBOARD_SERVICE_URL: z.string().url().optional(),
  BUN_USERLOG_SERVICE_URL: z.string().url().optional(),
  BUN_DELIVERY_SERVICE_URL: z.string().url().optional(),
  BUN_AUDIT_SERVICE_URL: z.string().url().optional(),
  BUN_VEHICLES_SERVICE_URL: z.string().url().optional()
});

// Validate environment variables on startup
export function validateEnvironment(): {
  success: boolean;
  errors?: string[];
  warnings?: string[];
} {
  const envVars = {
    // Core Next.js environment
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    
    // Railway environment
    RAILWAY_ENV: process.env.RAILWAY_ENV,
    
    // Authentication & Security
    JWT_SECRET: process.env.JWT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    
    // Database
    DATABASE_URL: process.env.DATABASE_URL,
    
    // External API URLs for development (NEXT_PUBLIC_*)
    NEXT_PUBLIC_API_USERS_URL: process.env.NEXT_PUBLIC_API_USERS_URL,
    NEXT_PUBLIC_API_CUSTOMERS_URL: process.env.NEXT_PUBLIC_API_CUSTOMERS_URL,
    NEXT_PUBLIC_API_PRODUCTS_URL: process.env.NEXT_PUBLIC_API_PRODUCTS_URL,
    NEXT_PUBLIC_API_DASHBOARD_URL: process.env.NEXT_PUBLIC_API_DASHBOARD_URL,
    NEXT_PUBLIC_API_USERLOG_URL: process.env.NEXT_PUBLIC_API_USERLOG_URL,
    NEXT_PUBLIC_API_DELIVERY_URL: process.env.NEXT_PUBLIC_API_DELIVERY_URL,
    NEXT_PUBLIC_API_AUDIT_URL: process.env.NEXT_PUBLIC_API_AUDIT_URL,
    NEXT_PUBLIC_API_VEHICLES_URL: process.env.NEXT_PUBLIC_API_VEHICLES_URL,
    
    // Internal Railway service URLs for production (BUN_*)
    BUN_USERS_SERVICE_URL: process.env.BUN_USERS_SERVICE_URL,
    BUN_CUSTOMERS_SERVICE_URL: process.env.BUN_CUSTOMERS_SERVICE_URL,
    BUN_JORNADA_PRODUTO_SERVICE_URL: process.env.BUN_JORNADA_PRODUTO_SERVICE_URL,
    BUN_DASHBOARD_SERVICE_URL: process.env.BUN_DASHBOARD_SERVICE_URL,
    BUN_USERLOG_SERVICE_URL: process.env.BUN_USERLOG_SERVICE_URL,
    BUN_DELIVERY_SERVICE_URL: process.env.BUN_DELIVERY_SERVICE_URL,
    BUN_AUDIT_SERVICE_URL: process.env.BUN_AUDIT_SERVICE_URL,
    BUN_VEHICLES_SERVICE_URL: process.env.BUN_VEHICLES_SERVICE_URL
  };

  const result = validateRequest(envSchema, envVars);
  
  if (!result.success && result.errors) {
    const errorMessages = Object.entries(result.errors).map(([key, message]) => `${key}: ${message}`);
    return { success: false, errors: errorMessages };
  }

  // Generate warnings for missing optional but recommended environment variables
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';
  const isRailwayProduction = process.env.RAILWAY_ENV === 'production';
  
  // In production, warn about missing service URLs
  if (isRailwayProduction) {
    const bunServices = [
      'BUN_USERS_SERVICE_URL',
      'BUN_CUSTOMERS_SERVICE_URL', 
      'BUN_JORNADA_PRODUTO_SERVICE_URL',
      'BUN_DASHBOARD_SERVICE_URL'
    ];
    
    bunServices.forEach(service => {
      if (!process.env[service]) {
        warnings.push(`${service} não configurado - usando URL padrão`);
      }
    });
  }
  
  // In development, warn about missing NEXT_PUBLIC URLs  
  if (!isProduction) {
    const nextPublicServices = [
      'NEXT_PUBLIC_API_USERS_URL',
      'NEXT_PUBLIC_API_CUSTOMERS_URL'
    ];
    
    nextPublicServices.forEach(service => {
      if (!process.env[service]) {
        warnings.push(`${service} não configurado - usando URL padrão`);
      }
    });
  }

  return { 
    success: true, 
    warnings: warnings.length > 0 ? warnings : undefined 
  };
}

// Export types
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type CreateCustomerRequest = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerRequest = z.infer<typeof updateCustomerSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type SearchParams = z.infer<typeof searchSchema>;