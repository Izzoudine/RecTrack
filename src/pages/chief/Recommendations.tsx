import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import RecommendationCard from "../../components/RecommendationCard";
import StatusFilter from "../../components/StatusFilter";
import DepartmentFilter from "../../components/DepartmentFilter";
import {
  Plus,
  Filter,
  Search,
  X,
  CalendarDays,
  AlertTriangle,
  User,
} from "lucide-react";
import { format } from "date-fns";

const ChiefRecommendations = () => {
  const {
    departments,
    chiefUsers,
    addRecommendation,
    updateRecommendation,
    deleteRecommendation,
    updateRecommendationStatus,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    getFilteredChiefRecommendations,
    loading,

    profile,
  } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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

  // Debug logs
  console.log("ChiefRecommendations - Departments:", departments);
  console.log("ChiefRecommendations - Users:", chiefUsers);
  console.log(
    "AdminRecommendations - Filtered Recommendations:",
    getFilteredChiefRecommendations()
  );

  if (profile?.role !== "admin" && profile?.role !== "chief") {
    return (
      <div className="max-w-7xl mx-auto px-4 text-center py-8">
        <p className="text-error-700">
          Accès refusé : Cette page est réservée aux administrateurs.
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

  // Filter recommendations based on search term
  const filteredRecommendations = getFilteredChiefRecommendations().filter(
    (rec) =>
      searchTerm === "" ||
      rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    const selectedUser = chiefUsers.find((user) => user.id === formData.userId);
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
    const user = chiefUsers.find((u: { id: string }) => u.id === id);
    return user ? user.name : "Utilisateur inconnu";
  };

  // Get selected user's department for display
  const selectedUserDepartment = formData.userId
    ? getDepartmentById(
      chiefUsers.find((user) => user.id === formData.userId)?.departmentId
      )
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Recommandations
          </h1>
          <p className="text-gray-600">
            Gérez et suivez toutes les recommandations du département
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn"
          style={{ backgroundColor: "#00a551", color: "white" }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter une recommandation
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative max-w-xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Recherche des recommandations..."
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

          {(statusFilter !== "all" || departmentFilter !== "all") && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setDepartmentFilter("all");
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 p-4 border border-gray-200 rounded-lg bg-gray-50 max-w-3xl mx-auto">
            <StatusFilter
              currentStatus={statusFilter}
              onStatusChange={setStatusFilter}
            />

            <DepartmentFilter
              departments={departments}
              currentDepartment={departmentFilter}
              onDepartmentChange={setDepartmentFilter}
            />
          </div>
        )}
      </div>

      {/* Recommendations Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto">
        {filteredRecommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            department={getDepartmentById(recommendation.departmentId)}
            userName={getUserNameById(recommendation.userId)}
            onStatusChange={updateRecommendationStatus}
            onUpdate={updateRecommendation}
            onDelete={deleteRecommendation}
          />
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200 max-w-3xl mx-auto">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Aucune recommandation trouvée</p>
          <p className="text-sm text-gray-400">
            Essayez de modifier vos filtres ou votre terme de recherche.
          </p>
        </div>
      )}

      {/* Add Recommendation Modal */}
      {isModalOpen && (
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
                    {chiefUsers.length === 0 ? (
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
                        {chiefUsers.map((user) => (
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
                  disabled={chiefUsers.length === 0} // Disable if no users
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

export default ChiefRecommendations;
