import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(username, password);

    if (result.success) {
      navigate("/"); // Jika berhasil, pindah ke Dashboard
    } else {
      setError(result.message || "Login gagal");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#24c35c] flex flex-col items-center justify-start p-6 pt-24 relative">
      {/* 1. LOGO & BRANDING (Bagian Atas) */}
      <div className="flex flex-col items-center mb-8">
        <img
          src="/icons/rsud-512x512.png"
          alt="Logo RSUD"
          className="w-32 h-32 object-contain mb-4"
        />
        <h1 className="text-xl font-bold text-white text-center leading-tight mb-1">
          RSUD dr. R. Soedarsono
        </h1>
        <h2 className="text-lg font-bold text-center">
          <span className="text-orange-500">SMART</span>{" "}
          <span className="text-gray-900">Hospital</span>
        </h2>
      </div>

      {/* 2. FORM LOGIN (Kartu Putih) */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Masukkan username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Masukkan password"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-full font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>
      </div>

      {/* 3. FOOTER VERSION (Bagian Bawah) */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-white/70 text-xs font-semibold">© Version 1.1</p>
      </div>
    </div>
  );
}
