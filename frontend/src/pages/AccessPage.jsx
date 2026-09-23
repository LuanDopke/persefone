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
  return <main className="paper-grid relative grid min-h-screen overflow-hidden p-5 md:grid-cols-[minmax(16rem,0.8fr)_minmax(24rem,1.2fr)] md:p-8"><section className="ink-speckle relative flex min-h-64 flex-col justify-between border-4 border-charcoal bg-primary p-6 text-offwhite shadow-hard-lg md:min-h-0 md:p-10"><div><span className="inline-block -rotate-2 border-4 border-charcoal bg-lime px-3 py-2 text-2xl font-extrabold uppercase tracking-[-0.08em] text-charcoal shadow-hard">Persefone.</span><p className="mt-8 max-w-sm text-3xl font-extrabold uppercase leading-[0.95] md:text-5xl">Seu arquivo<br /><span className="text-coral">botânico</span><br />em movimento.</p></div><p className="mt-10 border-l-4 border-lime pl-3 font-mono text-xs font-bold uppercase tracking-widest text-offwhite/75">Observe · cuide · registre</p><span aria-hidden="true" className="absolute -bottom-7 -right-5 rotate-6 border-4 border-charcoal bg-surface-variant px-5 py-3 font-mono text-sm font-bold text-charcoal shadow-hard">ARQUIVO 001</span></section><section className="relative m-auto w-full max-w-xl border-4 border-charcoal bg-surface p-6 shadow-[10px_10px_0_#171713] md:-ml-3 md:p-10"><span className="mb-4 inline-block bg-coral px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">Acesso reservado</span><h1 className="text-4xl font-extrabold leading-none tracking-[-0.055em] text-charcoal [text-shadow:3px_3px_0_#BDFF00] md:text-5xl">ACESSAR PERSEFONE</h1><p className="mt-4 max-w-md border-l-4 border-primary pl-3 font-medium text-charcoal/70">Receba um link de acesso no seu e-mail.</p><form className="mt-8 space-y-4" onSubmit={submit}><label className="block font-mono text-xs font-bold uppercase tracking-widest text-charcoal" htmlFor="email">E-mail</label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby="access-message" placeholder="voce@exemplo.com" /><Button type="submit" variant="lime" disabled={loading} className="w-full sm:w-auto">{loading ? 'Enviando' : 'Solicitar acesso'} <span aria-hidden="true" className="ml-3">→</span></Button></form><p id="access-message" role={error ? 'alert' : 'status'} className={`mt-5 border-l-4 pl-3 font-semibold ${error ? 'border-critical text-critical' : 'border-botanical'}`}>{error || message}</p></section></main>;
}
