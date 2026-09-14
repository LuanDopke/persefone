/**
 * CareLogTimeline — Displays chronological care events for a specimen.
 * Constitution Principle III: Modular, reusable timeline component.
 * Constitution Principle V: Immutable historical care timestamps.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import apiClient from '../../services/apiClient';

const CARE_ICONS = {
  watering: '💧',
  fertilizing: '🌿',
  repotting: '🪴',
  observation: '👁',
};

const CARE_COLORS = {
  watering: 'border-blue-400',
  fertilizing: 'border-green-500',
  repotting: 'border-amber-500',
  observation: 'border-gray-400',
};

export default function CareLogTimeline({ specimenId }) {
  const queryClient = useQueryClient();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const { data, isLoading } = useQuery({
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
        <p className="text-xs font-bold uppercase tracking-wider text-charcoal/40 animate-pulse">
          Loading care history...
        </p>
      ) : logs.length === 0 ? (
        <p className="text-xs font-bold uppercase tracking-wider text-charcoal/40">
          No care logs yet
        </p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-3 border-l-4 ${CARE_COLORS[log.type] || 'border-charcoal'} pl-3 py-1`}
            >
              <span className="text-lg">{CARE_ICONS[log.type] || '📋'}</span>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-charcoal">
                  {log.type_display || log.type}
                </p>
                {log.notes && (
                  <p className="text-xs text-charcoal/70 mt-0.5">{log.notes}</p>
                )}
                <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 mt-0.5">
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
