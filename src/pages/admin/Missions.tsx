import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  X, 
  Search,
  Filter,
  Target
} from "lucide-react";
import MissionCard from "../../components/MissionCard"; 

const AdminMissions = () => {
  const { 
    missions, 
    departments, 
    loading, 
    profile, 
    addMission, 
    updateMission, 
    deleteMission,
    users 
  } = useAuth();
  const navigate = useNavigate();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [error, setError] = useState("");

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Sécurité : Accès admin uniquement
  if (profile?.role !== "admin") {
    return (
      <div className="max-w-7xl mx-auto px-4 text-center py-8">
        <p className="text-error-700">
          Accès refusé : Cette page est réservée aux administrateurs.
        </p>
      </div>
    );
  }

  // Chargement
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 text-center py-8">
        <p className="text-gray-600">Chargement des missions...</p>
      </div>
    );
  }

  // Helper functions
  const getDepartmentById = (id: string | null) => {
    return departments.find((d) => d.id === id);
  };

  const getUserById = (id: string) => {
    return users?.find((u) => u.id === id);
  };

  // Filter missions
  const filteredMissions = missions.filter((mission) => {
    const matchesSearch = mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !filterDepartment || mission.departmentId === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Modal functions
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDeadline("");
    setDepartmentId("");
    setError("");
  };

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title || !description || !departmentId) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Add mission
    addMission({
      title,
      description,
      deadline: deadline || null,
      departmentId,
 
    });

    // Close modal and reset form
    closeModal();
    resetForm();
  };

  const handleUpdateMission = (id: string, data: any) => {
    updateMission(id, data);
  };

  const handleDeleteMission = (id: string) => {
    deleteMission(id);
  };

  const handleViewRecommendations = (missionId?: string) => {
    if (!missionId) {
      console.error("Mission ID manquant");
      return;
    }
    navigate(`/admin/recommendations?missionId=${missionId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Missions</h1>
          <p className="text-gray-600">
            Gérer les missions et accéder à leurs recommandations
          </p>
        </div>
        <button
          onClick={openModal}
          className="btn"
          style={{ backgroundColor: "#00a551", color: "white" }}
        >
          <Plus className="h-4 w-4 mr-1" style={{ stroke: "white" }} />
          Ajouter une mission
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher par titre ou description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </button>
        </div>

        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Département</label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="input"
                >
                  <option value="">Tous les départements</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.acronym} - {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterDepartment("");
                  }}
                  className="btn btn-outline"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Missions Grid */}
      {filteredMissions.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">
            {missions.length === 0 ? "Aucune mission trouvée" : "Aucune mission ne correspond aux filtres"}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            {missions.length === 0 
              ? "Ajoutez des missions pour commencer."
              : "Essayez de modifier vos critères de recherche."
            }
          </p>
          {missions.length === 0 && (
            <button onClick={openModal} className="btn btn-primary">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter une mission
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {filteredMissions.map((mission) => {
            const dept = getDepartmentById(mission.departmentId);
            const user = mission.createdBy ? getUserById(mission.createdBy) : null;
            
            return (
              <MissionCard
                key={mission.id}
                mission={mission}
                department={dept}
                userName={user?.name}
                onUpdate={handleUpdateMission}
                onDelete={handleDeleteMission}
                onViewRecommendations={handleViewRecommendations}
              />
            );
          })}
        </div>
      )}

      {/* Add Mission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                Ajouter une nouvelle mission
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-4">
                {error && (
                  <div className="bg-error-50 text-error-700 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="title" className="label">
                    Titre de la mission
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input"
                    placeholder="Entrez le titre de la mission"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="label">
                    Description 
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="Décrivez la mission en détail"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="departmentId" className="label">
                    Département 
                  </label>
                  <select
                    id="departmentId"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Sélectionnez un département</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.acronym} - {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

          

                <div className="form-group">
                  <label htmlFor="deadline" className="label">
                    Date limite (optionnel)
                  </label>
                  <input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-outline"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Ajouter la mission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMissions;