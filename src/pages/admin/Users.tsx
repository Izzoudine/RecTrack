import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const AdminUsers = () => {
  const { departments, users, getRecommendationsByUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  console.log("Users",users);
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return 'Aucun département';
    const department = departments.find(dept => dept.id === departmentId);
    return department ? department.name : 'Département inconnu';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Utilisateurs        </h1>
        <p className="text-gray-600">
        Gérez les utilisateurs et leurs affectations de recommandations
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="form-group">
          <label htmlFor="search" className="label">
          Rechercher des utilisateurs
          </label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            placeholder="Rechercher par nom..."
          />
        </div>
      </div>

      {/* Users List */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => {
          const userRecommendations = getRecommendationsByUser(user.id);
          const confirmedCount = userRecommendations.filter(rec => rec.status === 'confirmed').length;
          const inProgressCount = userRecommendations.filter(rec => rec.status === 'in_progress').length;
          const overdueCount = userRecommendations.filter(rec => rec.status === 'overdue').length;

          return (
            <div 
              key={user.id} 
              className="card hover:shadow-md transition-shadow duration-300"
            >
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-bold text-gray-900">{user.name}</h3>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Département:</span> {getDepartmentName(user.departmentId)}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-sm font-medium mb-2">Statut de la recommandation                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 p-2 rounded flex flex-col items-center">
                      <Clock className="h-4 w-4 text-primary-600 mb-1" />
                      <p className="text-xs text-gray-500">En cours</p>
                      <p className="text-sm font-semibold">{inProgressCount}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded flex flex-col items-center">
                      <CheckCircle className="h-4 w-4 text-success-600 mb-1" />
                      <p className="text-xs text-gray-500">Terminé                      </p>
                      <p className="text-sm font-semibold">{confirmedCount}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded flex flex-col items-center">
                      <AlertTriangle className="h-4 w-4 text-error-600 mb-1" />
                      <p className="text-xs text-gray-500">En retard                      </p>
                      <p className="text-sm font-semibold">{overdueCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun utilisateur correspondant trouvé "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;