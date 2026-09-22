export const CARE_ACTIVITIES = {
  watering: {
    type: 'watering',
    label: 'Rega',
    icon: 'water',
    iconTone: 'text-info',
    solid: 'bg-info text-offwhite',
    panel: 'bg-blue-50',
    activeButton: 'bg-blue-50',
    accentBorder: 'border-info',
  },
  fertilizing: {
    type: 'fertilizing',
    label: 'Adubação',
    icon: 'leaf',
    iconTone: 'text-botanical',
    solid: 'bg-mint text-charcoal',
    panel: 'bg-green-50',
    activeButton: 'bg-green-50',
    accentBorder: 'border-botanical',
  },
  repotting: {
    type: 'repotting',
    label: 'Replante',
    icon: 'repot',
    iconTone: 'text-amber',
    solid: 'bg-surface-variant text-charcoal',
    panel: 'bg-amber-50',
    activeButton: 'bg-amber-50',
    accentBorder: 'border-amber',
  },
  pruning: {
    type: 'pruning',
    label: 'Poda',
    icon: 'pruning',
    iconTone: 'text-critical',
    solid: 'bg-coral text-charcoal',
    panel: 'bg-red-50',
    activeButton: 'bg-red-50',
    accentBorder: 'border-critical',
  },
  observation: {
    type: 'observation',
    label: 'Observação',
    icon: 'info',
    iconTone: 'text-primary',
    solid: 'bg-lilac text-charcoal',
    panel: 'bg-purple-50',
    activeButton: 'bg-purple-50',
    accentBorder: 'border-primary',
  },
};

export const QUICK_CARE_TYPES = ['watering', 'fertilizing', 'repotting', 'pruning'];

export function getCareActivity(type) {
  return CARE_ACTIVITIES[type] || CARE_ACTIVITIES.observation;
}
