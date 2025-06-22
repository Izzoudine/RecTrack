import { useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import RecommendationCard from "../../components/RecommendationCard";
import {
  Plus,
  ChevronLeft,
  ClipboardList,
  Search,
  Filter,
  X,
  CalendarDays,
  User,
} from "lucide-react";
import { format } from "date-fns";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const STATUS_OPTIONS = [
  { value: "all",         label: "Tous" },
  { value: "in_progress", label: "En cours" },
  { value: "pending",     label: "En attente" },
  { value: "confirmed",   label: "Terminées" },
] as const;

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
const ChiefRecommendations = () => {
  /* ----------------- Auth / données globales ---------------------- */
  const {
    missions,
    departments,
    chiefUsers,
    chiefRecommendations,
    addRecommendation,
    updateRecommendation,
    deleteRecommendation,
    updateRecommendationStatus,
    loading,
    profile,
  } = useAuth();

  const navigate   = useNavigate();
  const query      = useQuery();
  const missionId  = query.get("missionId") ?? "";

  /* -------------------- UI state ---------------------------------- */
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const [searchTerm,  setSearchTerm]  = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userFilter,   setUserFilter]   = useState<string>("all");

  /* -------------------- Mission ----------------------------------- */
  const mission = missions.find((m) => m.id === missionId);

  /* -------------------- Recommandations (données + filtres) -------- */

  // 1) Chef : ne voir que les recs de son département
  const departmentRecs = useMemo(() => {
    if (profile?.role === "chief" && profile.departmentId) {
      return chiefRecommendations.filter(
        (rec) => rec.departmentId === profile.departmentId
      );
    }
    return chiefRecommendations;
  }, [chiefRecommendations, profile?.role, profile?.departmentId]);

  // 2) Recherche + filtres
  const filteredRec = departmentRecs
    .filter((rec) => {
      const q = searchTerm.toLowerCase();
      return (
        rec.title.toLowerCase().includes(q) ||
        rec.description.toLowerCase().includes(q)
      );
    })
    .filter((rec) => statusFilter === "all" || rec.status === statusFilter)
    .filter((rec) => userFilter   === "all" || rec.userId === userFilter);

  /* -------------------- Utilitaires local ------------------------- */
  const getDepartmentById = (id?: string | null) =>
    id ? departments.find((d) => d.id === id) : null;

  const getUserNameById = (id: string) =>
    chiefUsers.find((u) => u.id === id)?.name ?? "Inconnu";

  // Utilisateurs à afficher dans le filtre et le sélecteur de création
  const usersForSelect = useMemo(() => {
    if (profile?.role === "chief" && profile.departmentId) {
      return chiefUsers.filter((u) => u.departmentId === profile.departmentId);
    }
    return [];
  }, [chiefUsers, profile?.role, profile?.departmentId]);

  /* -------------------- Handlers ---------------------------------- */
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.userId) {
      setFormError("Veuillez remplir tous les champs.");
      return;
    }
    const user = chiefUsers.find((u) => u.id === formData.userId);
    if (!user) {
      setFormError("Utilisateur invalide.");
      return;
    }

    try {
      await addRecommendation({
        title:       formData.title,
        description: formData.description,
        userId:      formData.userId,
        departmentId: user.departmentId ?? null,
        missionId,
        deadline:    formData.deadline,
      });
      setFormError("");
      setFormData({
        title: "",
        description: "",
        userId: "",
        deadline: format(
          new Date().setDate(new Date().getDate() + 7),
          "yyyy-MM-dd"
        ),
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message ?? "Erreur.");
    }
  };

  /* -------------------- Guards ------------------------------------ */
  if (!missionId) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        Mission ID manquant dans l’URL.
      </div>
    );
  }
  if (loading || !mission) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        Chargement des données...
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ChevronLeft className="h-4 w-4" /> Retour aux missions
      </button>

      {/* Carte mission */}
      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {mission.title}
        </h1>
        <p className="text-gray-700 mb-3">{mission.description}</p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {mission.departmentId && (
            <span>
              Département:&nbsp;
              <strong>{getDepartmentById(mission.departmentId)?.acronym}</strong>
            </span>
          )}
          {mission.deadline && (
            <span>
              Deadline:&nbsp;<strong>{mission.deadline}</strong>
            </span>
          )}
          <span>
            Statut:&nbsp;<strong>{mission.status}</strong>
          </span>
        </div>
      </div>

      {/* En-tête recommandations */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <ClipboardList className="h-5 w-5" />
          Recommandations ({filteredRec.length})
        </h2>

        {profile?.role === "chief" && (
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

      {/* Recherche + bouton Filtres */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-outline flex items-center"
        >
          <Filter className="h-4 w-4 mr-2" /> Filtres
        </button>
      </div>

      {/* Panneau filtres */}
      {showFilters && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Filtre utilisateur */}
          <div>
            <label className="label flex items-center">
              <User className="h-4 w-4 mr-1" /> Utilisateur
            </label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="input w-full"
            >
              <option value="all">Tous</option>
              {usersForSelect.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre statut */}
          <div>
            <label className="label flex items-center">
              <ClipboardList className="h-4 w-4 mr-1" /> Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Liste recommandations */}
      {filteredRec.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg border">
          <p className="text-gray-500">Aucune recommandation trouvée.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRec.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              department={getDepartmentById(rec.departmentId)}
              userName={getUserNameById(rec.userId)}
              onUpdate={updateRecommendation}
              onDelete={deleteRecommendation}
              onStatusChange={updateRecommendationStatus}
            />
          ))}
        </div>
      )}

      {/* Modal ajout (chief only) */}
      {isModalOpen && profile?.role === "chief" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="label">Titre</label>
                <input
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input min-h-[100px]"
                />
              </div>
              <div>
                <label className="label flex items-center">
                  <User className="h-4 w-4 mr-1" /> Attribuer à
                </label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="">Sélectionnez un utilisateur</option>
                  {usersForSelect.length === 0 ? (
                    <option disabled>Aucun utilisateur disponible</option>
                  ) : (
                    usersForSelect.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="label flex items-center">
                  <CalendarDays className="h-4 w-4 mr-1" /> Date limite
                </label>
                <input
                  name="deadline"
                  type="date"
                  min={format(new Date(), "yyyy-MM-dd")}
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline mr-2"
                >
                  Annuler
                </button>
                <button type="submit" className="btn">
                  Ajouter
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
