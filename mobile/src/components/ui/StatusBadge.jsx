import React from 'react';
import Badge from './Badge';

const STATUS_MAP = {
  En_attente:           { label: 'En attente',         variant: 'warning' },
  Acceptée:             { label: 'Acceptée',            variant: 'success' },
  Refusée:              { label: 'Refusée',             variant: 'danger'  },
  Retirée:              { label: 'Retirée',             variant: 'muted'   },
  En_cours:             { label: 'En cours',            variant: 'info'    },
  Convention_en_cours:  { label: 'Convention en cours', variant: 'info'    },
  Stage_actif:          { label: 'Stage actif',         variant: 'success' },
  Terminé:              { label: 'Terminé',             variant: 'muted'   },
  Terminée:             { label: 'Terminée',            variant: 'muted'   },
  Signaler:             { label: 'Signalée',            variant: 'warning' },
  Justifiée:            { label: 'Justifiée',           variant: 'success' },
  Non_justifiée:        { label: 'Non justifiée',       variant: 'danger'  },
};

export default function StatusBadge({ status, style }) {
  const mapped = STATUS_MAP[status] || { label: status, variant: 'muted' };
  return <Badge label={mapped.label} variant={mapped.variant} style={style} />;
}
