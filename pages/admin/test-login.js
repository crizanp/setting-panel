// pages/admin/test-login.js
import { useState } from 'react';

export default function TestLogin() {
  const [result, setResult] = useState('');

  const testLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@foxbeep.com',
          password: 'foxbeep123'
        })
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
      
      if (data.token) {
        document.cookie = `token=${data.token}; path=/; max-age=${7*24*60*60}`;
        setTimeout(() => window.location.href = '/admin', 1000);
      }
    } catch (error) {
      setResult('Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={testLogin}>Test Login</button>
      <pre>{result}</pre>
    </div>
  );
}