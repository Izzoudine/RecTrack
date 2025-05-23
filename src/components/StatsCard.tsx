interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
}

const StatsCard = ({ title, value, icon, color }: StatsCardProps) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    secondary: 'bg-secondary-50 text-secondary-700 border-secondary-200',
    accent: 'bg-accent-50 text-accent-700 border-accent-200',
    success: 'bg-success-50 text-success-700 border-success-200',
    warning: 'bg-warning-50 text-warning-700 border-warning-200',
    error: 'bg-error-50 text-error-700 border-error-200',
  };
  
  const iconClasses = {
    primary: 'bg-primary-100 text-primary-700',
    secondary: 'bg-secondary-100 text-secondary-700',
    accent: 'bg-accent-100 text-accent-700',
    success: 'bg-success-100 text-success-700',
    warning: 'bg-warning-100 text-warning-700',
    error: 'bg-error-100 text-error-700',
  };
  
  return (
    <div className={`card border ${colorClasses[color]} transition-all duration-300 hover:shadow-md hover:scale-102`}>
      <div className="p-4">
        <div className="flex items-center">
          <div className={`rounded-full p-2 mr-3 ${iconClasses[color]}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;