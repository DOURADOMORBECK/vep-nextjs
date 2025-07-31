#!/usr/bin/env node

/**
 * Update API endpoints based on Railway API documentation
 * This script updates the api-interceptor.ts file with the correct endpoints
 */

const fs = require('fs');
const path = require('path');

// File to update
const filePath = path.join(__dirname, '..', 'src', 'lib', 'api-interceptor.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Endpoint mappings based on Railway API documentation
const endpointMappings = {
  // Users API - correct endpoints
  '/login': '/login',  // Keep as is
  '/register': '/register',  // Keep as is
  '/users': '/users',  // Keep as is
  '/me': '/me',  // Keep as is
  
  // Jornada Produto API - uses /jornada-produto prefix
  '/produto': '/jornada-produto/orders',
  '/produto/': '/jornada-produto/orders/',
  
  // Delivery API - already correct
  '/delivery': '/delivery',  // Keep as is
  
  // Fix any remaining incorrect patterns
  'buildUrl(API_CONFIG.PRODUCTS_API, \'/produto\')': 'buildUrl(API_CONFIG.PRODUCTS_API, \'/jornada-produto/orders\')',
  'buildUrl(API_CONFIG.PRODUCTS_API, `/produto/${id}`)': 'buildUrl(API_CONFIG.PRODUCTS_API, `/jornada-produto/orders/${id}`)',
};

// Apply replacements
Object.entries(endpointMappings).forEach(([from, to]) => {
  const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const before = (content.match(regex) || []).length;
  if (before > 0) {
    content = content.replace(regex, to);
    console.log(`Replaced ${before} occurrences of '${from}' with '${to}'`);
  }
});

// Write back
fs.writeFileSync(filePath, content);
console.log('\n✅ API endpoints updated based on Railway documentation!');