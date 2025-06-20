import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RecommendationCard from '../../components/RecommendationCard';
import StatusFilter from '../../components/StatusFilter';
import { Search, Filter, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const UserRecommendations = () => {
  const { 
    departments,
    updateRecommendationStatus,
    statusFilter,
    setStatusFilter,
    getFilteredRecommendations,
    
  } = useAuth();
  
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Get filtered recommendations
  let filteredRecommendations = getFilteredRecommendations();
  
  // Additional search filtering
  if (searchTerm) {
    filteredRecommendations = filteredRecommendations.filter(rec => 
      rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Handle mark as complete
  const handleStatusChange = (id: string, status: 'completed' | 'in_progress' | 'overdue' | 'pending') => {
    const now = format(new Date(), 'yyyy-MM-dd');
    updateRecommendationStatus(id, status, status === 'completed' ? now : undefined);
  };
  
  // Helper function to get department by id
  const getDepartmentById = (id: string) => {
    return departments.find(dept => dept.id === id);
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mes recommandations        </h1>
        <p className="text-gray-600">
        Afficher et gérer toutes vos recommandations attribuées
        </p>
      </div>
      
      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search recommendations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        
        <div className="flex items-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm font-medium text-secondary-600 mr-3"
          >
            <Filter className="h-4 w-4 mr-1" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
        
        {showFilters && (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <StatusFilter 
              currentStatus={statusFilter}
              onStatusChange={setStatusFilter}
            />
          </div>
        )}
      </div>
      
      {/* Recommendations Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {filteredRecommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            department={getDepartmentById(recommendation.departmentId)}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
      
      {filteredRecommendations.length === 0 && (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Aucune recommandation trouvée          </p>
          <p className="text-sm text-gray-400">Essayez de modifier vos filtres ou votre terme de recherche          </p>
        </div>
      )}
    </div>
  );
};

export default UserRecommendations;