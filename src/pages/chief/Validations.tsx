import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import RecommendationCardConfirm from "../../components/RecommendationCardConfirm";
import {
  Search,
  Clock,
} from "lucide-react";

const ChiefRecommendationsConfirm = () => {
  const {
    departments,
    chiefUsers,
    updateRecommendation,
    deleteRecommendation,
    updateRecommendationStatus,
    confirmRecommendation,
    getPendingRecommendations,
    getChiefPendingRecommendations,
    loading,
    profile,
  } = useAuth();


  const [searchTerm, setSearchTerm] = useState("");

 

  // Get pending recommendations based on user role
  const getPendingRecommendationsForRole = () => {
    if (profile?.role === 'admin') {
      return getPendingRecommendations();
    } else if (profile?.role === 'chief') {
      return getChiefPendingRecommendations();
    }
    return [];
  };

  const pendingRecommendations = getPendingRecommendationsForRole();

  // Debug logs
  console.log("ChiefRecommendationsConfirm - Departments:", departments);
  console.log("ChiefRecommendationsConfirm - Users:", chiefUsers);
  console.log("ChiefRecommendationsConfirm - Pending Recommendations:", pendingRecommendations);

  // Handle non-admin/chief access
  if (profile?.role !== "chief") {
    return (
      <div className="max-w-7xl mx-auto px-4 text-center py-8">
        <p className="text-error-700">
          Accès refusé : Cette page est réservée aux chefs de département.
        </p>
      </div>
    );
  }

  // Handle loading states
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 text-center py-8">
        <p className="text-gray-600">Chargement des données... </p>
      </div>
    );
  }



  // Filter recommendations based on search term and department
  const filteredRecommendations = pendingRecommendations.filter((rec) => {
    const matchesSearch = searchTerm === "" ||
      rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || 
      rec.departmentId === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });
  // Helper function to get department by id
  const getDepartmentById = (id: string | null | undefined) => {
    if (!id) return null;
    return departments.find((dept) => dept.id === id) || null;
  };

  // Helper function to get user name by id
  const getUserNameById = (id: string) => {
    const user = chiefUsers.find((u: { id: string }) => u.id === id);
    return user ? user.name : "Utilisateur inconnu";
  };


  // Handle recommendation confirmation
  const handleConfirmRecommendation = async (id: string) => {
    try {
      await confirmRecommendation(id);
    } catch (error) {
      console.error("Error confirming recommendation:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <Clock className="h-6 w-6 mr-2 text-orange-500" />
            Recommandations en attente de confirmation
          </h1>
          <p className="text-gray-600">
            {
              "Confirmez les recommandations de votre département"
            } ({filteredRecommendations.length} en attente)
          </p>
        </div>

      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative max-w-xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Recherche des recommandations en attente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>


      </div>

      {/* Pending Recommendations Alert */}
      {filteredRecommendations.length > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-6xl mx-auto">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-orange-500 mr-2" />
            <p className="text-orange-800 font-medium">
              {filteredRecommendations.length} recommandation{filteredRecommendations.length > 1 ? 's' : ''} en attente de votre confirmation
            </p>
          </div>
          <p className="text-orange-700 text-sm mt-1">
            Cliquez sur "Confirmer" sur chaque carte pour valider les recommandations terminées.
          </p>
        </div>
      )}

      {/* Recommendations Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto">
        {filteredRecommendations.map((recommendation) => (
          <RecommendationCardConfirm
            key={recommendation.id}
            recommendation={recommendation}
            department={getDepartmentById(recommendation.departmentId)}
            userName={getUserNameById(recommendation.userId)}
            onStatusChange={updateRecommendationStatus}
            onUpdate={profile?.role === 'admin' ? updateRecommendation : undefined}
            onDelete={profile?.role === 'admin' ? deleteRecommendation : undefined}
            onConfirm={handleConfirmRecommendation}
            
          />
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="p-8 text-center bg-green-50 rounded-lg border border-green-200 max-w-3xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-green-800 font-medium mb-2">Aucune recommandation en attente de confirmation</p>
          <p className="text-sm text-green-600">
            {searchTerm ? 
              "Aucune recommandation ne correspond à votre recherche." :
              "Toutes les recommandations ont été traitées ou il n'y en a pas de nouvelles à confirmer."
            }
          </p>
        </div>
      )}


    </div>
  );
};

export default ChiefRecommendationsConfirm;