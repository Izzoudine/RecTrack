import { Recommendation } from '../contexts/AuthContext';

interface StatusBadgeProps {
  status: Recommendation['status'];
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  let badgeClass = '';
  let label = '';
  
  switch (status) {
    case 'in_progress':
      badgeClass = 'badge-primary';
      label = 'En cours';
      break;
    case 'confirmed':
      badgeClass = 'badge-success';
      label = 'Terminé';
      break;
      case 'pending':
        badgeClass = 'badge-warning';
        label = 'En cours de validation';
        break;
          
    case 'overdue':
      badgeClass = 'badge-error';
      label = 'En retard';
      break;
    default:
      badgeClass = 'badge-secondary';
      label = status;
  }
  
  return (
    <span className={`badge ${badgeClass}`}>
      {label}
    </span>
  );
};

export default StatusBadge;