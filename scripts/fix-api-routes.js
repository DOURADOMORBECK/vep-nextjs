#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// File to update
const filePath = path.join(__dirname, '..', 'src', 'lib', 'api-interceptor.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define all replacements
const replacements = [
  // Products - already done '/produto'
  [/\/api\/products/g, '/produto'],
  
  // Customers
  [/\/api\/customers/g, '/customer'],
  
  // Orders
  [/\/api\/orders/g, '/order'],
  
  // Users (keep as is)
  [/\/api\/users/g, '/users'],
  
  // Suppliers
  [/\/api\/suppliers/g, '/supplier'],
  
  // Deliveries
  [/\/api\/deliveries/g, '/delivery'],
  
  // Vehicles
  [/\/api\/vehicles/g, '/vehicle'],
  
  // Logs
  [/\/api\/logs/g, '/logs'],
];

// Apply all replacements
replacements.forEach(([regex, replacement]) => {
  const before = content.match(regex)?.length || 0;
  content = content.replace(regex, replacement);
  const after = content.match(regex)?.length || 0;
  console.log(`Replaced ${before} occurrences of ${regex} with '${replacement}'`);
});

// Write the file back
fs.writeFileSync(filePath, content);
console.log('\n✅ API routes updated successfully!');