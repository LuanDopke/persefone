/**
 * CareLogTimeline — Displays chronological care events for a specimen.
 * Constitution Principle III: Modular, reusable timeline component.
 * Constitution Principle V: Immutable historical care timestamps.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import apiClient from '../../services/apiClient';
import Alert from '../ui/Alert';

const CARE_ICONS = {
  watering: '💧',
  fertilizing: '🌿',
  repotting: '🪴',
  observation: '👁',
};

const CARE_COLORS = {
  watering: 'border-info',
  fertilizing: 'border-botanical',
  repotting: 'border-amber',
  observation: 'border-gray-400',
};

export default function CareLogTimeline({ specimenId }) {
  const queryClient = useQueryClient();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['care-logs', specimenId],
    queryFn: () =>
      apiClient.get('/api/care-logs/', { params: { specimen_id: specimenId } }).then((r) => r.data),
    enabled: !!specimenId,
  });

  const addLogMutation = useMutation({
    mutationFn: (newLog) => apiClient.post('/api/care-logs/', newLog),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-logs', specimenId] });
      setShowQuickAdd(false);
    },
  });

  const logs = data?.results || [];

  const handleQuickAction = (type) => {
    addLogMutation.mutate({
      specimen: specimenId,
      type,
      notes: '',
    });
  };

  return (
    <div className="space-y-3">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CARE_ICONS).map(([type, icon]) => (
          <Button
            key={type}
            size="sm"
            variant="default"
            onClick={() => handleQuickAction(type)}
            className="text-xs"
          >
            {icon} {type}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <p role="status" className="animate-pulse text-xs font-bold uppercase tracking-wider text-charcoal/60 motion-reduce:animate-none">
          Loading care history...
        </p>
      ) : isError ? (
        <Alert tone="critical">Care history unavailable</Alert>
      ) : logs.length === 0 ? (
        <p className="text-xs font-bold uppercase tracking-wider text-charcoal/40">
          No care logs yet
        </p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-3 border-l-4 ${CARE_COLORS[log.type] || 'border-charcoal'} py-1 pl-3`}
            >
              <span className="text-lg">{CARE_ICONS[log.type] || '📋'}</span>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-charcoal">
                  {log.type_display || log.type}
                </p>
                {log.notes && (
                  <p className="mt-0.5 text-xs text-charcoal/70">{log.notes}</p>
                )}
                <p className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-charcoal/50">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
