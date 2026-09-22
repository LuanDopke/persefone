import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';

export const INITIAL_PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export default function InitialPhotoField({ file, onChange, error, id = 'initial-photo', label = 'Foto inicial (opcional)' }) {
  const [localError, setLocalError] = useState('');
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (!file || typeof URL.createObjectURL !== 'function') {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = (event) => {
    const selected = event.target.files?.[0] || null;
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setLocalError('Selecione um arquivo de imagem.');
      event.target.value = '';
      return;
    }
    if (selected.size > INITIAL_PHOTO_MAX_BYTES) {
      setLocalError('A foto deve ter no máximo 10 MB.');
      event.target.value = '';
      return;
    }
    setLocalError('');
    onChange(selected);
  };

  const message = localError || error;
  return (
    <div className="space-y-3">
      <label className="block font-bold" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={selectFile}
        aria-invalid={Boolean(message)}
        aria-describedby={message ? `${id}-error` : `${id}-help`}
        className="min-h-12 w-full border-4 border-charcoal bg-offwhite p-3 font-semibold file:mr-3 file:border-2 file:border-charcoal file:bg-lime file:px-3 file:py-2 file:font-bold focus:ring-4 focus:ring-lime"
      />
      <p id={`${id}-help`} className="text-sm text-charcoal/70">JPEG, PNG, WebP ou AVIF, até 10 MB. A imagem será otimizada para AVIF.</p>
      {message && <p id={`${id}-error`} className="font-bold text-red-700">{message}</p>}
      {file && (
        <div className="flex items-center gap-3 border-2 border-charcoal p-3">
          {preview && <img src={preview} alt="Prévia da foto inicial" className="h-24 w-24 object-cover" />}
          <span className="min-w-0 flex-1 truncate font-semibold">{file.name}</span>
          <Button type="button" size="sm" onClick={() => { setLocalError(''); onChange(null); }}>Remover foto</Button>
        </div>
      )}
    </div>
  );
}
