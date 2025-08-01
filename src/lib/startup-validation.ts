// Startup validation for environment variables and system requirements
import { validateEnvironment } from './validation';

// Flag to track if validation has been performed
let validationPerformed = false;
let validationResults: { success: boolean; errors?: string[] } | null = null;

/**
 * Validate environment variables and system requirements on startup
 * This should be called once during application initialization
 */
export function performStartupValidation(): void {
  if (validationPerformed) {
    return;
  }

  console.log('🔍 Performing startup validation...');
  
  // Validate environment variables
  const envValidation = validateEnvironment();
  
  if (!envValidation.success) {
    console.error('❌ Environment validation failed:');
    envValidation.errors?.forEach(error => {
      console.error(`   • ${error}`);
    });
    
    // In production, we might want to exit the process
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Critical environment validation errors in production. Exiting...');
      process.exit(1);
    } else {
      console.warn('⚠️  Environment validation errors in development. Continuing with warnings...');
    }
    
    validationResults = envValidation;
  } else {
    console.log('✅ Environment validation passed');
    
    // Show warnings if any
    if (envValidation.warnings && envValidation.warnings.length > 0) {
      console.warn('⚠️  Environment validation warnings:');
      envValidation.warnings.forEach(warning => {
        console.warn(`   • ${warning}`);
      });
    }
    
    validationResults = { success: true };
  }
  
  // Additional system checks can be added here
  console.log('🔧 Checking system requirements...');
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
  
  if (majorVersion < 18) {
    const error = `Node.js version ${nodeVersion} is not supported. Minimum required: 18.x`;
    console.error(`❌ ${error}`);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Critical Node.js version error in production. Exiting...');
      process.exit(1);
    }
  } else {
    console.log(`✅ Node.js version ${nodeVersion} is supported`);
  }
  
  // Check required directories exist (if needed)
  // This can be expanded based on application requirements
  
  console.log('✅ Startup validation completed');
  validationPerformed = true;
}

/**
 * Get the results of the startup validation
 */
export function getValidationResults(): { success: boolean; errors?: string[] } | null {
  return validationResults;
}

/**
 * Check if startup validation has been performed
 */
export function isValidationPerformed(): boolean {
  return validationPerformed;
}

/**
 * Reset validation state (useful for testing)
 */
export function resetValidation(): void {
  validationPerformed = false;
  validationResults = null;
}

/**
 * Middleware function to ensure validation has been performed
 * This can be used in API routes or other parts of the application
 */
export function ensureValidation(): void {
  if (!validationPerformed) {
    performStartupValidation();
  }
  
  if (validationResults && !validationResults.success) {
    throw new Error('System validation failed. Check logs for details.');
  }
}