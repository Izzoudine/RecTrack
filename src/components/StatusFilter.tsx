import { Recommendation } from '../contexts/RecommendationsContext';

interface StatusFilterProps {
  currentStatus: Recommendation['status'] | 'all';
  onStatusChange: (status: Recommendation['status'] | 'all') => void;
}

const StatusFilter = ({ currentStatus, onStatusChange }: StatusFilterProps) => {
  const statuses: { value: Recommendation['status'] | 'all'; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' },
  ];
  
  return (
    <div className="flex flex-wrap items-center gap-2">
      {statuses.map((status) => (
        <button
          key={status.value}
          onClick={() => onStatusChange(status.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentStatus === status.value
              ? 'bg-primary-100 text-primary-800 ring-1 ring-primary-300'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
};

export default StatusFilter;