import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

export default function ConfirmAccessPage() {
  const [params] = useSearchParams(); const navigate = useNavigate(); const { completeAccess } = useAuth(); const [error, setError] = useState('');
  useEffect(() => { const token = params.get('token'); if (!token) { setError('Este link não é válido.'); return; } apiClient.post('/api/auth/access-confirmations/', { token }).then(({ data }) => { completeAccess(data); navigate('/'); }).catch(() => setError('Este link expirou, já foi usado ou não é válido.')); }, [params, completeAccess, navigate]);
  return <main className="mx-auto flex min-h-screen max-w-lg items-center p-6"><section className="w-full border-4 border-charcoal bg-offwhite p-6 shadow-hard-lg"><h1 className="text-2xl font-extrabold">CONFIRMANDO ACESSO</h1>{error ? <><p role="alert" className="mt-4">{error}</p><Link className="mt-4 inline-block font-bold underline" to="/access">Solicitar novo acesso</Link></> : <p className="mt-4">Aguarde enquanto confirmamos seu link.</p>}</section></main>;
}
