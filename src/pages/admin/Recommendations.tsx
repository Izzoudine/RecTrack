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

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const STATUS_OPTIONS = [
  { value: "all",         label: "Tous" },
  { value: "in_progress", label: "En cours" },
  { value: "pending",     label: "En attente" },
  { value: "confirmed",   label: "Terminées" },
];

const Recommendations = () => {
  const {
    missions,
    departments,
    users,
    updateRecommendation,
    deleteRecommendation,
    updateRecommendationStatus,
    addRecommendation,
    getRecommendationsByMission,
    loading,
    profile,
  } = useAuth();

  const navigate = useNavigate();
  const query = useQuery();
  const missionId = query.get("missionId") ?? "";

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

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  const mission = missions.find((m) => m.id === missionId);
  const missionRecommendations = useMemo(
    () => getRecommendationsByMission(missionId),
    [getRecommendationsByMission, missionId]
  );

  const filteredRec = missionRecommendations
    .filter((rec) =>
      profile && (rec.departmentId === profile.departmentId || rec.userId === profile.id)
    )
    .filter((rec) => {
      const t = rec.title.toLowerCase();
      const d = rec.description.toLowerCase();
      const q = searchTerm.toLowerCase();
      return t.includes(q) || d.includes(q);
    })
    .filter((rec) => statusFilter === "all" || rec.status === statusFilter)
    .filter((rec) => userFilter === "all" || rec.userId === userFilter);

  const handleInputChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.userId) {
      setFormError("Veuillez remplir tous les champs.");
      return;
    }

    const user = users.find((u) => u.id === formData.userId);
    if (!user) {
      setFormError("Utilisateur invalide.");
      return;
    }

    try {
      await addRecommendation({
        title: formData.title,
        description: formData.description,
        userId: formData.userId,
        departmentId: user.departmentId ?? null,
        missionId,
        deadline: formData.deadline,
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

  const getDepartmentById = (id?: string | null) =>
    id ? departments.find((d) => d.id === id) : null;
  const getUserNameById = (id: string) =>
    users.find((u) => u.id === id)?.name ?? "Inconnu";

  const usersFromMissionDepartment = useMemo(() => {
    if (!mission?.departmentId) return [];
    return users.filter((u) => u.departmentId === mission.departmentId);
  }, [users, mission]);

  if (!missionId) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        Mission ID manquant dans l’URL.
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ChevronLeft className="h-4 w-4" /> Retour aux missions
      </button>

      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {mission.title}
        </h1>
        <p className="text-gray-700 mb-3">{mission.description}</p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {mission.departmentId && (
            <span>
              Département: {" "}
              <strong>
                {getDepartmentById(mission.departmentId)?.acronym}
              </strong>
            </span>
          )}
          {mission.deadline && (
            <span>
              Deadline: <strong>{mission.deadline}</strong>
            </span>
          )}
          <span>
            Statut: <strong>{mission.status}</strong>
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <ClipboardList className="h-5 w-5" />
          Recommandations ({filteredRec.length})
        </h2>

        {profile?.role === "admin" && (
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

      {showFilters && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              {usersFromMissionDepartment.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

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

      {isModalOpen && profile?.role === "admin" && (
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
                  {usersFromMissionDepartment.length === 0 ? (
                    <option disabled>Aucun utilisateur dans ce département</option>
                  ) : (
                    usersFromMissionDepartment.map((user) => (
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

export default Recommendations;