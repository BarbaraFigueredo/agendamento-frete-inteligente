import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <svg className="w-7 h-7 text-brand-600" viewBox="0 0 32 32" fill="none">
          <rect x="2" y="8" width="28" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
          <path
            d="M8 14 L14 20 L24 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-bold text-lg text-gray-900">FreightFlow</span>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-gray-600">
            {user.first_name} {user.last_name}
          </span>
        )}
        <button onClick={handleLogout} className="btn-secondary text-sm py-1.5">
          Sair
        </button>
      </div>
    </header>
  );
}
