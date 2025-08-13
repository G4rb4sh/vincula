async function testLogin() {
  try {
    console.log('🔄 Probando login...');
    const response = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify({
        email: 'patient@vincula.com',
        password: '123456'
      })
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ Error:', errorData);
      return;
    }

    const data = await response.json();
    console.log('✅ Login exitoso!');
    console.log('👤 Usuario:', data.user.first_name, data.user.last_name);
    console.log('🔑 Token recibido:', data.token.substring(0, 50) + '...');
  } catch (error) {
    console.log('💥 Error de red:', error.message);
  }
}

testLogin();