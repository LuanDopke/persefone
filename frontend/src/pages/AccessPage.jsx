import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { Button } from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function AccessPage() {
  const [email, setEmail] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setMessage('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Informe um endereço de e-mail válido.'); return; }
    setLoading(true);
    try { const { data } = await apiClient.post('/api/auth/access-requests/', { email: email.trim() }); setMessage(data.detail); }
    catch { setError('Não foi possível solicitar o acesso. Tente novamente.'); } finally { setLoading(false); }
  }
  return <main className="mx-auto flex min-h-screen max-w-lg items-center p-6"><section className="w-full border-4 border-charcoal bg-offwhite p-6 shadow-hard-lg"><h1 className="text-3xl font-extrabold text-charcoal">ACESSAR PERSEFONE</h1><p className="mt-2 text-charcoal/70">Receba um link de acesso no seu e-mail.</p><form className="mt-6 space-y-4" onSubmit={submit}><label className="block font-bold text-charcoal" htmlFor="email">E-mail</label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby="access-message" /><Button type="submit" variant="lime" disabled={loading}>{loading ? 'Enviando' : 'Solicitar acesso'}</Button></form><p id="access-message" role={error ? 'alert' : 'status'} className="mt-4 font-semibold">{error || message}</p></section></main>;
}
