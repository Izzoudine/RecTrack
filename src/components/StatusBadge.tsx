import { Recommendation } from '../contexts/RecommendationsContext';

interface StatusBadgeProps {
  status: Recommendation['status'];
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  let badgeClass = '';
  let label = '';
  
  switch (status) {
    case 'in_progress':
      badgeClass = 'badge-primary';
      label = 'In Progress';
      break;
    case 'completed':
      badgeClass = 'badge-success';
      label = 'Completed';
      break;
    case 'overdue':
      badgeClass = 'badge-error';
      label = 'Overdue';
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