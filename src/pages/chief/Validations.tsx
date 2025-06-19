import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Building2, Plus, X } from "lucide-react";

const ChiefValidations = () => {
  const { departments, addDepartment, getRecommendationsByDepartment } =
    useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [acronym, setAcronym] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const resetForm = () => {
    setAcronym("");
    setName("");
    setError("");
  };

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = 
  
  
  
  
  (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!acronym || !name) {
      setError("Please provide both acronym and name");
      return;
    }

    if (acronym.length > 5) {
      setError("Acronym should be 5 characters or less");
      return;
    }

    // Check for duplicates
    const isDuplicateAcronym = departments.some(
      (dept) => dept.acronym.toLowerCase() === acronym.toLowerCase()
    );

    if (isDuplicateAcronym) {
      setError("A department with this acronym already exists");
      return;
    }

    // Add department
    addDepartment({
      acronym: acronym.toUpperCase(),
      name,
    });

    // Close modal and reset form
    closeModal();
    resetForm();
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Départements
          </h1>
          <p className="text-gray-600">
            Gérer les départements de l'organisation
          </p>
        </div>
        <button
          onClick={openModal}
          className="btn"
          style={{ backgroundColor: "#00a551", color: "white" }}
        >
          <Plus className="h-4 w-4 mr-1" style={{ stroke: "white" }} />
          Ajouter un département
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((department) => {
          const deptRecommendations = getRecommendationsByDepartment(
            department.id
          );
          const completedCount = deptRecommendations.filter(
            (r) => r.status === "completed"
          ).length;
          const completionRate =
            deptRecommendations.length > 0
              ? Math.round((completedCount / deptRecommendations.length) * 100)
              : 0;

          return (
            <div
              key={department.id}
              className="card hover:shadow-md transition-shadow duration-300"
            >
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <div
                    className="rounded-full p-2 mr-3"
                    style={{ backgroundColor: "#d1fae5", color: "#00a551" }}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      {department.acronym}
                    </h3>
                    <p className="text-sm text-gray-600">{department.name}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-500">Recommandations</p>
                      <p className="text-lg font-semibold">
                        {deptRecommendations.length}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-500">Achèvement</p>
                      <p className="text-lg font-semibold">{completionRate}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {departments.length === 0 && (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Aucun département trouvé</p>
          <button onClick={openModal} className="btn btn-primary">
            <Plus className="h-4 w-4 mr-1" />
            Ajouter un département
          </button>
        </div>
      )}

      {/* Add Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                Ajouter un nouveau département
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-4">
                {error && (
                  <div className="mb-4 bg-error-50 text-error-700 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="acronym" className="label">
                    Acronyme (5 caractères max)
                  </label>
                  <input
                    id="acronym"
                    type="text"
                    value={acronym}
                    onChange={(e) => setAcronym(e.target.value)}
                    className="input"
                    placeholder="e.g., HR, IT, FIN"
                    maxLength={5}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name" className="label">
                    Nom du département
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    placeholder="e.g., Human Resources"
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
                  Ajouter un département
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChiefValidations;
