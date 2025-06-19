import { useAuth } from '../../contexts/AuthContext';
import StatsCard from '../../components/StatsCard';
import { CheckCircle, Clock, AlertTriangle, User, Building2 } from 'lucide-react';
import RecommendationCard from '../../components/RecommendationCard';
import { format } from 'date-fns';

const UserDashboard = () => {
  const { 
    recommendations, 
    departments, 
    updateRecommendationStatus,
    getRecommendationsByStatus,
    profile,
    session,
    loading,
    error
  } = useAuth();

  // Handle loading state
  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  // Handle error state
  if (error) {
    return (
      <div className="text-center mt-10 text-error-700">
        Error: {error}
      </div>
    );
  }

  // Ensure profile and session exist
  if (!profile || !session) {
    return (
      <div className="text-center mt-10 text-error-700">
        Veuillez vous connecter pour afficher votre tableau de bord

      </div>
    );
  }

  // Filter recommendations for current user
  const userRecommendations = recommendations.filter(rec => rec.userId === session.uid);

  // Get department info
  const userDepartment = profile.departmentId 
    ? departments.find(dept => dept.id === profile.departmentId) 
    : null;

  // Get counts for dashboard stats
  const completedCount = userRecommendations.filter(rec => rec.status === 'completed').length;
  const inProgressCount = userRecommendations.filter(rec => rec.status === 'in_progress').length;
  const overdueCount = userRecommendations.filter(rec => rec.status === 'overdue').length;

  // Calculate completion rate
  const completionRate = userRecommendations.length > 0 
    ? Math.round((completedCount / userRecommendations.length) * 100) 
    : 0;

  // Sort recommendations by deadline (closest first)
  const sortedRecommendations = [...userRecommendations]
    .filter(rec => rec.status !== 'completed')
    .sort((a, b) => {
      const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return dateA - dateB;
    });

  // Recently completed recommendations
  const recentlyCompleted = [...userRecommendations]
    .filter(rec => rec.status === 'completed' && rec.completedAt)
    .sort((a, b) => {
      const dateA = new Date(a.completedAt || '');
      const dateB = new Date(b.completedAt || '');
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bienvenue, {profile.name}
        </h1>
        <p className="text-gray-600">
          {userDepartment 
            ? `${userDepartment.name} Département` 
            : 'Votre tableau de bord'}
        </p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-6xl mx-auto">
        <StatsCard 
          title="Recommandations totales"
          value={userRecommendations.length}
          icon={<User className="h-5 w-5" />}
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
          value={completedCount}
          icon={<CheckCircle className="h-5 w-5" />}
          color="success"
        />
        <StatsCard 
          title="En retard"
          value={overdueCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="error"
        />
      </div>
      
      {/* Department and completion info */}
      <div className="mb-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userDepartment && (
            <div className="card p-4">
              <div className="flex items-center mb-4">
                <div className="bg-secondary-100 rounded-full p-2 mr-3 text-secondary-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{userDepartment.name}</h3>
                  <p className="text-sm text-gray-600">{userDepartment.acronym}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="card p-4">
            <h3 className="font-bold text-gray-900 mb-2">Progression</h3>
            <div className="relative pt-1">
              <div className="overflow-hidden h-4 mb-1 text-xs flex rounded bg-gray-200">
                <div 
                  style={{ width: `${completionRate}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-success-500 transition-all duration-500"
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Progression</span>
                <span>{completionRate}% Compléter                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upcoming Deadlines */}
      <div className="mb-8 max-w-6xl mx-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
        Échéances à venir
        </h2>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {sortedRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onStatusChange={updateRecommendationStatus}
            />
          ))}
          
          {sortedRecommendations.length === 0 && (
            <div className="col-span-2 p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
              <CheckCircle className="h-12 w-12 text-success-500 mx-auto mb-4" />
              <p className="text-gray-600">Aucune recommandation en attente ! Beau travail !              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Recently Completed */}
      {recentlyCompleted.length > 0 && (
        <div className="max-w-6xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Récemment terminé
          </h2>
          
          <div className="bg-gray-50 rounded-lg border border-gray-200">
            {recentlyCompleted.map((recommendation, index) => (
              <div 
                key={recommendation.id}
                className={`p-4 flex items-center ${
                  index < recentlyCompleted.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <div className="bg-success-100 rounded-full p-2 mr-3 text-success-700">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{recommendation.title}</h3>
                  <p className="text-xs text-gray-500">
                  Terminé le
                  {format(new Date(recommendation.completedAt!), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;