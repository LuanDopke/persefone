import { formatObservationDate } from './observationUtils';

const FIELD_LABELS = { notes: 'Nota', observed_at: 'Data', subject: 'Indivíduo', latitude: 'Latitude', longitude: 'Longitude', discarded_at: 'Estado' };
const displayValue = (value) => {
  if (value == null || value === '') return 'Não informado';
  if (value === 'original') return 'Planta principal';
  if (value === 'comparison') return 'Outro indivíduo';
  return value;
};

export default function RevisionHistory({ revisions = [] }) {
  if (!revisions.length) return null;
  return <details className="mt-3 text-sm"><summary className="cursor-pointer font-bold">Correções ({revisions.length})</summary><ol className="mt-2 space-y-3 border-l-2 border-charcoal/30 pl-3">{revisions.map((revision) => <li key={revision.id}><p className="font-mono text-xs">{formatObservationDate(revision.created_at)}</p>{Object.keys(revision.after).filter((key) => revision.before[key] !== revision.after[key]).map((key) => <p key={key} className="break-words"><strong>{FIELD_LABELS[key] || key}:</strong> {displayValue(revision.before[key])} → {displayValue(revision.after[key])}</p>)}</li>)}</ol></details>;
}
