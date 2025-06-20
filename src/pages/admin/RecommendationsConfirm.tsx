import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import RecommendationCardConfirm from "../../components/RecommendationCardConfirm";
import DepartmentFilter from "../../components/DepartmentFilter";
import {
  Plus,
  Filter,
  Search,
  X,
  CalendarDays,
  User,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

const AdminRecommendationsConfirm = () => {
  const {
    departments,
    users,
    addRecommendation,
    updateRecommendation,
    deleteRecommendation,
    updateRecommendationStatus,
    confirmRecommendation,
    getPendingRecommendations,
    loading,
    profile,
  } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string | 'all'>('all');

  // New recommendation form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    userId: "",
    deadline: format(
      new Date().setDate(new Date().getDate() + 7),
      "yyyy-MM-dd"
    ),
  });
  const [formError, setFormError] = useState("");

  // Get pending recommendations based on user role
  const getPendingRecommendationsForRole = () => {
    if (profile?.role === 'admin') {
      return getPendingRecommendations();
    } 
    return [];
  };

  const pendingRecommendations = getPendingRecommendationsForRole();

  // Debug logs
  console.log("AdminRecommendationsConfirm - Departments:", departments);
  console.log("AdminRecommendationsConfirm - Users:", users);
  console.log("AdminRecommendationsConfirm - Pending Recommendations:", pendingRecommendations);

  // Handle non-admin/chief access
  if (profile?.role !== "admin" && profile?.role !== "chief") {
    return (
      <div className="max-w-7xl mx-auto px-4 text-center py-8">
        <p className="text-error-700">
          Accès refusé : Cette page est réservée aux administrateurs et chefs de département.
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

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Filter recommendations based on search term and department
  const filteredRecommendations = pendingRecommendations.filter((rec) => {
    const matchesSearch = searchTerm === "" ||
      rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || 
      rec.departmentId === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.title ||
      !formData.description ||
      !formData.userId ||
      !formData.deadline
    ) {
      setFormError("Veuillez remplir tous les champs.");
      return;
    }

    // Get user's departmentId
    const selectedUser = users.find((user) => user.id === formData.userId);
    if (!selectedUser) {
      setFormError("Utilisateur sélectionné invalide");
      return;
    }

    // Add recommendation
    try {
      await addRecommendation({
        title: formData.title,
        description: formData.description,
        userId: formData.userId,
        departmentId: selectedUser.departmentId,
        deadline: formData.deadline,
      });

      // Reset form and close modal
      setFormData({
        title: "",
        description: "",
        userId: "",
        deadline: format(
          new Date().setDate(new Date().getDate() + 7),
          "yyyy-MM-dd"
        ),
      });
      setFormError("");
      setIsModalOpen(false);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to add recommendation"
      );
    }
  };

  // Helper function to get department by id
  const getDepartmentById = (id: string | null | undefined) => {
    if (!id) return null;
    return departments.find((dept) => dept.id === id) || null;
  };

  // Helper function to get user name by id
  const getUserNameById = (id: string) => {
    const user = users.find((u: { id: string }) => u.id === id);
    return user ? user.name : "Utilisateur inconnu";
  };

  // Get selected user's department for display
  const selectedUserDepartment = formData.userId
    ? getDepartmentById(
        users.find((user) => user.id === formData.userId)?.departmentId
      )
    : null;

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
            {profile?.role === 'admin' 
              ? "Confirmez les recommandations soumises par les utilisateurs"
              : "Confirmez les recommandations de votre département"
            } ({filteredRecommendations.length} en attente)
          </p>
        </div>

        {profile?.role === 'admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn"
            style={{ backgroundColor: "#00a551", color: "white" }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter une recommandation
          </button>
        )}
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

        <div className="flex items-center justify-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm font-medium text-primary-600 mr-3"
          >
            <Filter className="h-4 w-4 mr-1" />
            {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
          </button>

          {departmentFilter !== "all" && (
            <button
              onClick={() => setDepartmentFilter("all")}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {showFilters && profile?.role === 'admin' && (
          <div className="grid gap-4 grid-cols-1 p-4 border border-gray-200 rounded-lg bg-gray-50 max-w-3xl mx-auto">
            <DepartmentFilter
              departments={departments}
              currentDepartment={departmentFilter}
              onDepartmentChange={setDepartmentFilter}
            />
          </div>
        )}
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

      {/* Add Recommendation Modal - Only for Admin */}
      {isModalOpen && profile?.role === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                Ajouter une nouvelle recommandation{" "}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                {formError && (
                  <div className="mb-4 bg-error-50 text-error-700 p-3 rounded-md text-sm">
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="title" className="label">
                    Titre
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter recommendation title"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="input min-h-[100px]"
                    placeholder="Enter detailed description"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="userId" className="label flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Attribuer à un utilisateur
                    </label>
                    {users.length === 0 ? (
                      <p className="text-error-700 text-sm">
                        Aucun utilisateur disponible. Veuillez d'abord ajouter
                        des utilisateurs.
                      </p>
                    ) : (
                      <select
                        id="userId"
                        name="userId"
                        value={formData.userId}
                        onChange={handleInputChange}
                        className="input"
                      >
                        <option value="">Sélectionnez un utilisateur </option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="label flex items-center">
                      Département
                    </label>
                    {selectedUserDepartment ? (
                      <p className="text-gray-600">
                        {selectedUserDepartment.acronym} -{" "}
                        {selectedUserDepartment.name}
                      </p>
                    ) : formData.userId ? (
                      <p className="text-error-700 text-sm">
                        Aucun département trouvé pour l'utilisateur sélectionné.
                      </p>
                    ) : (
                      <p className="text-gray-600">
                        Sélectionnez un utilisateur pour voir son département
                      </p>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="deadline" className="label flex items-center">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Date limite
                  </label>
                  <input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    className="input"
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ backgroundColor: "#00a551", color: "white" }}
                  disabled={users.length === 0} // Disable if no users
                >
                  Ajouter une recommandation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecommendationsConfirm;