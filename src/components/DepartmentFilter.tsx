import { Department } from '../contexts/RecommendationsContext';

interface DepartmentFilterProps {
  departments: Department[];
  currentDepartment: string | 'all';
  onDepartmentChange: (departmentId: string | 'all') => void;
}

const DepartmentFilter = ({ 
  departments, 
  currentDepartment, 
  onDepartmentChange 
}: DepartmentFilterProps) => {
  return (
    <div className="form-group">
      <label htmlFor="department-filter" className="label">
      Filtrer par département
      </label>
      <select
        id="department-filter"
        value={currentDepartment}
        onChange={(e) => onDepartmentChange(e.target.value)}
        className="input"
      >
        <option value="all">Tous les départements</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.acronym} - {department.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DepartmentFilter;