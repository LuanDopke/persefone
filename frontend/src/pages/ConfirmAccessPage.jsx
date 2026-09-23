import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

export default function ConfirmAccessPage() {
  const [params] = useSearchParams(); const navigate = useNavigate(); const { completeAccess } = useAuth(); const [error, setError] = useState('');
  useEffect(() => { const token = params.get('token'); if (!token) { setError('Este link não é válido.'); return; } apiClient.post('/api/auth/access-confirmations/', { token }).then(({ data }) => { completeAccess(data); navigate('/'); }).catch(() => setError('Este link expirou, já foi usado ou não é válido.')); }, [params, completeAccess, navigate]);
  return <main className="paper-grid flex min-h-screen items-center justify-center p-6"><section className="relative w-full max-w-lg border-4 border-charcoal bg-surface p-8 shadow-[10px_10px_0_#171713]"><span aria-hidden="true" className="absolute -right-4 -top-5 rotate-3 border-4 border-charcoal bg-lime px-3 py-2 font-mono text-xs font-bold">PERSEFONE.</span><h1 className="text-3xl font-extrabold leading-none [text-shadow:3px_3px_0_#C8B6FF]">CONFIRMANDO ACESSO</h1>{error ? <><p role="alert" className="mt-6 border-l-4 border-critical pl-3 font-semibold text-critical">{error}</p><Link className="mt-6 inline-block border-4 border-charcoal bg-surface-variant px-4 py-2 font-bold uppercase shadow-hard transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none" to="/access">Solicitar novo acesso</Link></> : <p className="mt-6 flex items-center gap-3 font-semibold"><span aria-hidden="true" className="h-5 w-5 animate-spin border-4 border-charcoal border-t-coral motion-reduce:animate-none" />Aguarde enquanto confirmamos seu link.</p>}</section></main>;
}
