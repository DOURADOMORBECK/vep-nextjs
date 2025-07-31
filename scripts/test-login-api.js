// Script para testar login direto na API Users
const testLogin = async () => {
  const apiUrl = 'https://api-users-production-54ed.up.railway.app/login';
  
  // Teste com o usuário real do banco
  const credentials = {
    email: 'paulomoraes@veplim.com.br',
    password: 'senha_aqui' // Você precisa usar a senha correta
  };
  
  console.log('🔐 Testando login na API Users...');
  console.log('URL:', apiUrl);
  console.log('Email:', credentials.email);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    console.log('\n📝 Status da resposta:', response.status);
    console.log('📝 Status text:', response.statusText);
    
    const responseText = await response.text();
    console.log('📝 Resposta:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('\n✅ Login bem-sucedido!');
      console.log('Token:', data.token?.substring(0, 30) + '...');
      console.log('User:', data.user);
    } else {
      console.log('\n❌ Login falhou');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Erro:', errorData);
      } catch {
        console.log('Resposta não é JSON:', responseText);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Erro de conexão:', error);
  }
};

// Executar
testLogin();