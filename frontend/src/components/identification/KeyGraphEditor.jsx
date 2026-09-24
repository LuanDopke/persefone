import { useState } from 'react';
import { Button } from '../ui/Button';
import TaxonPicker from './TaxonPicker';

const inputClass = 'mt-2 w-full border-2 border-charcoal bg-offwhite px-3 py-2';
const uid = (prefix) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

function BranchingEditor({ graph, onChange, scopeRank, scopeKey }) {
  const steps = graph.steps || [];
  const targetRank = scopeRank === 'family' ? 'genus' : 'species';
  const updateStep = (id, update) => onChange({ ...graph, type: 'branching', steps: steps.map((step) => step.id === id ? update(step) : step) });
  const updateChoice = (id, index, update) => updateStep(id, (step) => ({ ...step, choices: step.choices.map((choice, position) => position === index ? update(choice) : choice) }));
  const addStep = () => {
    const id = uid('s');
    onChange({ ...graph, type: 'branching', start: graph.start || id, steps: [...steps, { id, prompt: '', choices: [{ text: '', next: '' }, { text: '', next: '' }] }] });
  };
  const removeStep = (id) => {
    const remaining = steps.filter((step) => step.id !== id).map((step) => ({ ...step,
      choices: step.choices.map((choice) => choice.next === id ? { text: choice.text, next: '' } : choice) }));
    onChange({ ...graph, type: 'branching', start: graph.start === id ? remaining[0]?.id || '' : graph.start, steps: remaining });
  };
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm">Cada passo pode ter de 2 a 20 alternativas. Cada alternativa leva a outro passo ou a um resultado.</p><Button size="sm" variant="lime" onClick={addStep}>Adicionar passo</Button></div>
    {steps.map((step, position) => <article key={step.id} className="space-y-4 border-2 border-charcoal bg-surface p-4 shadow-hard-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold uppercase">Passo {position + 1}{graph.start === step.id && ' · início'}</h3><div className="flex gap-2">{graph.start !== step.id && <Button size="sm" variant="secondary" onClick={() => onChange({ ...graph, start: step.id })}>Definir início</Button>}<Button size="sm" variant="secondary" onClick={() => removeStep(step.id)}>Remover</Button></div></div>
      <label className="block font-bold">Característica observada<input value={step.prompt} onChange={(event) => updateStep(step.id, (current) => ({ ...current, prompt: event.target.value }))} className={inputClass} /></label>
      <div className="grid gap-4 md:grid-cols-2">{step.choices.map((choice, index) => <div key={index} className="space-y-3 border-l-4 border-primary pl-3">
        <div className="flex justify-between gap-2"><h4 className="font-bold">Alternativa {index + 1}</h4>{step.choices.length > 2 && <Button size="sm" variant="secondary" onClick={() => updateStep(step.id, (current) => ({ ...current, choices: current.choices.filter((_, candidate) => candidate !== index) }))}>Remover</Button>}</div>
        <label className="block font-bold">Descrição<input value={choice.text} onChange={(event) => updateChoice(step.id, index, (current) => ({ ...current, text: event.target.value }))} className={inputClass} /></label>
        <div role="group" aria-label={`Destino da alternativa ${index + 1}`} className="flex flex-wrap gap-2"><Button size="sm" variant={!choice.taxon ? 'lime' : 'secondary'} aria-pressed={!choice.taxon} onClick={() => updateChoice(step.id, index, (current) => ({ text: current.text, next: '' }))}>Outro passo</Button><Button size="sm" variant={choice.taxon ? 'lime' : 'secondary'} aria-pressed={Boolean(choice.taxon)} onClick={() => updateChoice(step.id, index, (current) => ({ text: current.text, taxon: current.taxon || null }))}>Resultado</Button></div>
        {choice.taxon !== undefined ? <TaxonPicker rank={targetRank} parentKey={scopeKey} value={choice.taxon} label={`Táxon da alternativa ${index + 1}`} onChange={(taxon) => updateChoice(step.id, index, (current) => ({ text: current.text, taxon }))} /> : <label className="block font-bold">Próximo passo<select value={choice.next || ''} onChange={(event) => updateChoice(step.id, index, (current) => ({ text: current.text, next: event.target.value }))} className={inputClass}><option value="">Selecione</option>{steps.filter((candidate) => candidate.id !== step.id).map((candidate) => <option key={candidate.id} value={candidate.id}>Passo {steps.indexOf(candidate) + 1}: {candidate.prompt || 'Sem título'}</option>)}</select></label>}
      </div>)}</div>
      {step.choices.length < 20 && <Button size="sm" variant="secondary" onClick={() => updateStep(step.id, (current) => ({ ...current, choices: [...current.choices, { text: '', next: '' }] }))}>Adicionar alternativa</Button>}
    </article>)}
    {!steps.length && <p className="border-2 border-dashed border-charcoal p-4">Adicione o primeiro passo para começar.</p>}
  </div>;
}

function MultiAccessEditor({ graph, onChange, scopeRank, scopeKey }) {
  const [newTaxon, setNewTaxon] = useState(null);
  const descriptors = graph.descriptors || [];
  const taxa = graph.taxa || [];
  const targetRank = scopeRank === 'family' ? 'genus' : 'species';
  const updateDescriptor = (id, update) => onChange({ ...graph, descriptors: descriptors.map((row) => row.id === id ? update(row) : row) });
  const removeDescriptor = (id) => onChange({ ...graph,
    descriptors: descriptors.filter((row) => row.id !== id),
    taxa: taxa.map((taxon) => ({ ...taxon, states: Object.fromEntries(Object.entries(taxon.states || {}).filter(([key]) => key !== id)) })),
  });
  const toggleState = (taxonKey, descriptorId, stateId) => onChange({ ...graph, taxa: taxa.map((taxon) => {
    if (taxon.key !== taxonKey) return taxon;
    const selected = taxon.states?.[descriptorId] || [];
    const next = selected.includes(stateId) ? selected.filter((id) => id !== stateId) : [...selected, stateId];
    const states = { ...(taxon.states || {}) };
    if (next.length) states[descriptorId] = next; else delete states[descriptorId];
    return { ...taxon, states };
  }) });
  return <div className="space-y-5">
    <p className="text-sm">O usuário escolhe características em qualquer ordem; a lista de táxons é reduzida a cada resposta.</p>
    <div className="grid gap-4 lg:grid-cols-2"><section className="space-y-3 border-2 border-charcoal bg-surface p-4"><div className="flex justify-between gap-2"><h3 className="font-bold uppercase">Descritores</h3><Button size="sm" variant="lime" onClick={() => onChange({ ...graph, descriptors: [...descriptors, { id: uid('d'), label: '', states: [{ id: uid('v'), label: '' }, { id: uid('v'), label: '' }] }] })}>Adicionar</Button></div>
      {descriptors.map((descriptor) => <article key={descriptor.id} className="space-y-2 border-l-4 border-primary pl-3"><div className="flex gap-2"><input aria-label="Nome do descritor" value={descriptor.label} onChange={(event) => updateDescriptor(descriptor.id, (row) => ({ ...row, label: event.target.value }))} className="w-full border-2 border-charcoal bg-offwhite px-2 py-1" /><Button size="sm" variant="secondary" onClick={() => removeDescriptor(descriptor.id)}>Remover</Button></div>{descriptor.states.map((state, index) => <div key={state.id} className="flex gap-2"><input aria-label={`Estado ${index + 1} de ${descriptor.label || 'descritor'}`} value={state.label} onChange={(event) => updateDescriptor(descriptor.id, (row) => ({ ...row, states: row.states.map((item) => item.id === state.id ? { ...item, label: event.target.value } : item) }))} className="w-full border-2 border-charcoal bg-offwhite px-2 py-1" />{descriptor.states.length > 2 && <Button size="sm" variant="secondary" onClick={() => updateDescriptor(descriptor.id, (row) => ({ ...row, states: row.states.filter((item) => item.id !== state.id) }))}>×</Button>}</div>)}<Button size="sm" variant="secondary" onClick={() => updateDescriptor(descriptor.id, (row) => ({ ...row, states: [...row.states, { id: uid('v'), label: '' }] }))}>Adicionar estado</Button></article>)}
    </section><section className="space-y-3 border-2 border-charcoal bg-surface p-4"><h3 className="font-bold uppercase">Táxons identificáveis</h3><TaxonPicker rank={targetRank} parentKey={scopeKey} value={newTaxon} label="Adicionar táxon" onChange={setNewTaxon} />{newTaxon && <Button size="sm" variant="lime" disabled={taxa.some((row) => row.key === newTaxon.key)} onClick={() => { onChange({ ...graph, taxa: [...taxa, { ...newTaxon, states: {} }] }); setNewTaxon(null); }}>Adicionar à matriz</Button>}
      {taxa.map((taxon) => <details key={taxon.key} className="border-l-4 border-primary pl-3"><summary className="cursor-pointer font-bold"><i>{taxon.name}</i></summary><Button size="sm" variant="secondary" className="my-2" onClick={() => onChange({ ...graph, taxa: taxa.filter((row) => row.key !== taxon.key) })}>Remover táxon</Button><div className="space-y-3">{descriptors.map((descriptor) => <div key={descriptor.id}><p className="text-sm font-bold">{descriptor.label || 'Descritor sem título'}</p><div className="flex flex-wrap gap-1">{descriptor.states.map((state) => <Button key={state.id} size="sm" variant={(taxon.states?.[descriptor.id] || []).includes(state.id) ? 'lime' : 'secondary'} aria-pressed={(taxon.states?.[descriptor.id] || []).includes(state.id)} onClick={() => toggleState(taxon.key, descriptor.id, state.id)}>{state.label || 'Estado sem título'}</Button>)}</div></div>)}</div></details>)}
    </section></div>
  </div>;
}

export default function KeyGraphEditor({ graph, onChange, scopeRank, scopeKey }) {
  const type = graph.type || 'branching';
  const hasData = type === 'multi_access' ? (graph.descriptors?.length || graph.taxa?.length) : graph.steps?.length;
  const setType = (value) => onChange(value === 'multi_access'
    ? { type: 'multi_access', descriptors: [], taxa: [] }
    : { type: 'branching', start: '', steps: [] });
  return <section className="space-y-5" aria-label="Estrutura da chave">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="inline-block border-4 border-charcoal bg-mint px-4 py-2 text-lg font-bold uppercase">Estrutura da chave</h2><div role="group" aria-label="Tipo de chave" className="flex gap-2">{[['branching', 'Sequencial'], ['multi_access', 'Múltiplo acesso']].map(([value, label]) => <Button key={value} size="sm" variant={type === value ? 'lime' : 'secondary'} aria-pressed={type === value} disabled={Boolean(hasData) && type !== value} onClick={() => setType(value)}>{label}</Button>)}</div></div>
    {type === 'multi_access' ? <MultiAccessEditor graph={graph} onChange={onChange} scopeRank={scopeRank} scopeKey={scopeKey} /> : <BranchingEditor graph={graph} onChange={onChange} scopeRank={scopeRank} scopeKey={scopeKey} />}
  </section>;
}
