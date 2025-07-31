// Script para verificar o status de todas as APIs no build
// Cores ANSI para o console
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

const API_ENDPOINTS = {
  'Users API': 'https://api-users-production-54ed.up.railway.app',
  'Products API': 'https://api-jornada-produto-production.up.railway.app',
  'Customers API': 'https://api-customers-production.up.railway.app',
  'Dashboard API': 'https://api-dashboard-production-f3c4.up.railway.app',
  'UserLog API': 'https://api-userlog-production.up.railway.app',
  'Delivery API': 'https://api-delivery-production-0851.up.railway.app',
  'Audit API': 'https://api-audit-production.up.railway.app',
  'Vehicles API': 'https://api-vehicles-production.up.railway.app'
};

async function checkAPIStatus(name, url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return { name, url, status: 'online', code: response.status };
    } else {
      return { name, url, status: 'error', code: response.status };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return { name, url, status: 'timeout', error: 'Request timed out' };
    }
    return { name, url, status: 'offline', error: error.message };
  }
}

async function checkAllAPIs() {
  console.log(`${colors.blue}${colors.bold}\n🔍 Checking API Status...${colors.reset}\n`);
  
  const results = await Promise.all(
    Object.entries(API_ENDPOINTS).map(([name, url]) => checkAPIStatus(name, url))
  );
  
  // Display results
  results.forEach(result => {
    const statusIcon = result.status === 'online' ? '✅' : result.status === 'timeout' ? '⏱️' : '❌';
    const statusColor = result.status === 'online' ? colors.green : result.status === 'timeout' ? colors.yellow : colors.red;
    
    console.log(`${statusIcon} ${colors.bold}${result.name.padEnd(15)}${colors.reset} ${statusColor}${result.status.toUpperCase().padEnd(8)}${colors.reset} ${colors.gray}${result.url}${colors.reset}`);
    
    if (result.error) {
      console.log(`   ${colors.red}Error:${colors.reset} ${result.error}`);
    }
  });
  
  // Summary
  const onlineCount = results.filter(r => r.status === 'online').length;
  const totalCount = results.length;
  
  console.log(`${colors.blue}${colors.bold}\n📊 Summary: ${onlineCount}/${totalCount} APIs are online${colors.reset}\n`);
  
  // Return status for build process
  return onlineCount === totalCount;
}

// Run if called directly
if (require.main === module) {
  checkAllAPIs().then(allOnline => {
    if (!allOnline) {
      console.log(`${colors.yellow}⚠️  Some APIs are not responding. The application may not work correctly.${colors.reset}\n`);
    }
  });
}

module.exports = { checkAllAPIs };