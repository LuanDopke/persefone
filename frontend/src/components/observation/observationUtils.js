export const formatObservationDate = (value) => new Date(value).toLocaleString('pt-BR');

export const toLocalDateInput = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const observationError = (error) => {
  const data = error?.response?.data;
  const value = data && typeof data === 'object' ? Object.values(data)[0] : data;
  return Array.isArray(value) ? value.join(' ') : typeof value === 'string' ? value : 'Não foi possível salvar. Tente novamente.';
};
