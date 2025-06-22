import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  X,
  Search,
  Filter,
  Target,
} from "lucide-react";
import MissionCard from "../../components/MissionCard";

const ChiefMissions = () => {
  const {
    missions,
    departments,
    chiefUsers,         
    loading,
    profile,
    addMission,
    updateMission,
    deleteMission,
  } = useAuth();

  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline]     = useState("");
  const [error, setError]           = useState("");

  // filtres
  const [searchTerm, setSearchTerm]   = useState("");
  const [filterUser, setFilterUser]   = useState("");
  const [showFilters, setShowFilters] = useState(false);
  if (profile?.role !== "chief") {
    return (
      <div className="max-w-7xl mx-auto px-4 text-center py-8">
        <p className="text-error-700">
          Accès refusé : page réservée aux Chefs de département.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 text-center py-8">
        <p className="text-gray-600">Chargement des missions…</p>
      </div>
    );
  }
  const getDepartmentById = (id: string | null) =>
    departments.find((d) => d.id === id);

  const getUserById = (id: string) =>
    chiefUsers?.find((u) => u.id === id);

  const filteredMissions = missions

    .filter(
      (m) => m.departmentId === profile.departmentId ||
             m.createdBy === profile.id
    )
    
    .filter((m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    .filter((m) =>
      !filterUser || m.createdBy === filterUser
    );

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDeadline("");
    setError("");
  };
  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    await addMission({
      title,
      description,
      deadline: deadline || null,
      departmentId: profile.departmentId!,
    });
    closeModal();
    resetForm();
  };

  const handleUpdateMission = (id: string, data: any) =>
    updateMission(id, data);
  const handleDeleteMission = (id: string) =>
    deleteMission(id);

 const handleViewRecommendations = (missionId?: string) => {
  if (!missionId) {
    console.error("Mission ID manquant");
    return;
  }
  navigate(`/chief/recommendations?missionId=${missionId}`);
};

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Missions de votre département
          </h1>
          <p className="text-gray-600">
            Gérez vos missions et leurs recommandations
          </p>
        </div>
        <button
          onClick={openModal}
          className="btn"
          style={{ backgroundColor: "#00a551", color: "white" }}
        >
          <Plus className="h-4 w-4 mr-1" /> Ajouter une mission
        </button>
      </div>

      {/* barre recherche + filtres */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher par titre ou description…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          {/* <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" /> Filtres
          </button> */}
        
        </div>

        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Utilisateur (créateur)</label>
                <select
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="input"
                >
                  <option value="">Tous les utilisateurs</option>
                  {chiefUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterUser("");
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

      {/* grille missions */}
      {filteredMissions.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg border">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {missions.length === 0
              ? "Aucune mission trouvée"
              : "Aucune mission ne correspond aux filtres"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {filteredMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              department={getDepartmentById(mission.departmentId)}
              userName={getUserById(mission.createdBy)?.name}
              onUpdate={handleUpdateMission}
              onDelete={handleDeleteMission}
              onViewRecommendations={handleViewRecommendations}
            />
          ))}
        </div>
      )}

      {/* modal ajout */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
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
                  <label className="label">Titre</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input"
                    rows={3}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Date limite (optionnel)</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-end space-x-2 rounded-b-lg">
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

export default ChiefMissions;
