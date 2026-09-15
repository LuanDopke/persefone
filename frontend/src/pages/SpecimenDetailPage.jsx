import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import apiClient, { queryKeys } from '../services/apiClient';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import ResponsiveGrid from '../components/ui/ResponsiveGrid';
import ContentState from '../components/ui/ContentState';
import MediaFrame from '../components/ui/MediaFrame';

export default function SpecimenDetailPage() {
  const { specimenId } = useParams();
  const specimen = useQuery({
    queryKey: queryKeys.specimens.detail(specimenId),
    queryFn: () => apiClient.get(`/api/specimens/${specimenId}/`).then((response) => response.data),
  });

  if (specimen.isLoading) return <PageContainer width="standard" className="space-y-6"><PageHeader title="Detalhe do exemplar" /><ContentState status="loading" busyLabel="Carregando exemplar" /></PageContainer>;
  if (specimen.isError) return <PageContainer width="standard" className="space-y-6"><PageHeader title="Detalhe do exemplar" /><ContentState status="error" title="Não foi possível carregar o exemplar." action={<Button onClick={() => specimen.refetch()}>Tentar novamente</Button>} /></PageContainer>;

  const data = specimen.data;
  const visual = data.initial_visual_entry;
  return (
    <PageContainer width="standard" className="space-y-6">
      <PageHeader title={data.nickname} description={<span className="italic">{data.species_detail?.scientific_name}</span>} />
      <Card title="Condições iniciais">
        <ResponsiveGrid variant="analytics" as="dl" className="sm:grid-cols-3 lg:grid-cols-3">
          <div><dt className="font-bold uppercase">Solo</dt><dd className="mt-1">{data.initial_soil}</dd></div>
          <div><dt className="font-bold uppercase">Luminosidade</dt><dd className="mt-1">{data.initial_light}</dd></div>
          <div><dt className="font-bold uppercase">Aquisição</dt><dd className="mt-1">{data.acquired_at}</dd></div>
        </ResponsiveGrid>
      </Card>
      {visual && <Card title="Linha do tempo visual"><MediaFrame src={visual.image} alt={`Foto inicial de ${data.nickname}`} aspect="detail" fit="contain" className="max-h-96" /></Card>}
    </PageContainer>
  );
}
