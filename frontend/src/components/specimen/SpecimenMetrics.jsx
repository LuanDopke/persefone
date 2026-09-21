import { Card } from '../ui/Card';

export default function SpecimenMetrics() {
  return <Card title="Métricas atuais" headerTone="offwhite" density="compact" className="w-full max-w-sm justify-self-end rotate-1 shadow-hard-lg">
    <div className="border-2 border-dashed border-charcoal bg-gray-100 p-5 text-center">
      <p className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal/60">Placeholder de taxonomia</p>
      <p className="mt-3 text-2xl font-extrabold uppercase leading-tight">Métricas em breve</p>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/70">Este quadro será preenchido com as informações definidas na taxonomia.</p>
    </div>
  </Card>;
}
