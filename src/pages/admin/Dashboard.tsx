import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import StatsCard from '../../components/StatsCard';
import { ClipboardList, Clock, CheckCircle, AlertTriangle, Building2, Users } from 'lucide-react';
import RecommendationCard from '../../components/RecommendationCard';

const AdminDashboard = () => {
  const { 
    recommendations, 
    departments, 
    users,
    updateRecommendation,
    deleteRecommendation,
    updateRecommendationStatus,
    getRecommendationsByStatus 
  } = useAuth();
  
  const [recentRecommendations, setRecentRecommendations] = useState(
    recommendations.filter(rec => rec.status !== 'confirmed').slice(0, 5)
  );
  
  // Get counts for dashboard stats
  const totalRecommendations = recommendations.length;
  const confirmedCount = getRecommendationsByStatus('confirmed').length;
  const inProgressCount = getRecommendationsByStatus('in_progress').length;
  const overdueCount = getRecommendationsByStatus('overdue').length;
  const departmentCount = departments.length;
  
  // Calculate completion rate
  const completionRate = totalRecommendations > 0 
    ? Math.round((confirmedCount / totalRecommendations) * 100) 
    : 0;
  
  // Sort recommendations by deadline (most recent first)
  useEffect(() => {
    const sorted = [...recommendations]
      .filter(rec => rec.status !== 'confirmed')
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);
    
    setRecentRecommendations(sorted);
  }, [recommendations]);
  
  // Helper function to get department by id
  const getDepartmentById = (id: string | null) => {
    return departments.find(dept => dept.id === id);
  };
  
  // Helper function to get user name by id
  const getUserNameById = (id: string) => {
    const user = users.find(u => u.id === id);
    return user ? user.name : 'Unknown User';
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tableau de bord administrateur</h1>
        <p className="text-gray-600">
        Suivez et gérez toutes les recommandations des départements
        </p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-w-6xl mx-auto">
        <StatsCard 
          title="Recommandations totales"
          value={totalRecommendations}
          icon={<ClipboardList className="h-5 w-5" />}
          color="primary"
        />
        <StatsCard 
          title="En cours"
          value={inProgressCount}
          icon={<Clock className="h-5 w-5" />}
          color="secondary"
        />
        <StatsCard 
          title="Terminé"
          value={confirmedCount}
          icon={<CheckCircle className="h-5 w-5" />}
          color="success"
        />
        <StatsCard 
          title="En retard"
          value={overdueCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="error"
        />
        <StatsCard 
          title="Départements"
          value={departmentCount}
          icon={<Building2 className="h-5 w-5" />}
          color="accent"
        />
        <StatsCard 
          title="Taux d’achèvement"
          value={`${completionRate}%`}
          icon={<Users className="h-5 w-5" />}
          color="primary"
        />
      </div>
      
      {/* Recent Recommendations */}
      <div className="mb-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Échéances à venir</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recentRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              department={getDepartmentById(recommendation.departmentId)}
              userName={getUserNameById(recommendation.userId)}
              onUpdate={updateRecommendation}          // ← indispensable
              onDelete={deleteRecommendation}          // ← indispensable
              onStatusChange={updateRecommendationStatus}
            />
          ))}
          
          {recentRecommendations.length === 0 && (
            <div className="col-span-2 p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">Aucune recommandation trouvée</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;