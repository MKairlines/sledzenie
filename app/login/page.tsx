'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const normalized = orderNumber.replace(/\D/g, '');
    if (/^\d{8}$/.test(normalized)) {
      const existingOrderNumber = localStorage.getItem('orderNumber');
      if (existingOrderNumber && existingOrderNumber === normalized) {
        setError('przesyłka już jest śledzona. Wpisz inny numer');
        return;
      }

      localStorage.setItem('auth', 'true');
      localStorage.setItem('orderNumber', normalized);
      router.push('/main');
    } else {
      setError('Wprowadź poprawnie 8-cyfrowy numer przewozu');
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0b0b0b' }}>
      <form
        onSubmit={handleLogin}
        className="shadow-lg"
        style={{
          backgroundColor: '#111111',
          padding: 24,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: '#8a6b3d',
          width: '88%',
          maxWidth: 420,
        }}
      >
        <h2
          className="text-center"
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 18,
            color: '#d1b07c',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          Podaj numer przewozu
        </h2>

        {error && (
          <p className="text-center" style={{ color: '#ef4444', marginBottom: 12 }}>
            {error}
          </p>
        )}

        <input
          type="text"
          placeholder="Numer przewozu"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
          maxLength={8}
          className="w-full rounded-xl"
          style={{
            borderWidth: 2,
            borderColor: '#8a6b3d',
            padding: 14,
            marginBottom: 18,
            color: '#f5f5f5',
            backgroundColor: '#0b0b0b',
          }}
        />

        <button
          type="submit"
          className="w-full rounded-full"
          style={{
            backgroundColor: '#d1b07c',
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 18,
            paddingRight: 18,
            borderRadius: 28,
            borderWidth: 2,
            borderColor: '#d1b07c',
          }}
        >
          <span
            style={{
              color: '#0b0b0b',
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              textAlign: 'center',
              display: 'block',
            }}
          >
            Dalej
          </span>
        </button>

        <style jsx>{`
          input::placeholder { color: #8b8b8b; }
        `}</style>
      </form>
    </main>
  );
}
