import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ResetPasswordPage() {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setMessage("Konfirmasi password tidak sama!");
      return;
    }

    setLoading(true);
    // Simulasi pengiriman ke API Reset Password
    // Ganti dengan axios.post('/api/reset_password', { ... })
    setTimeout(() => {
      setMessage("Password berhasil diubah (simulasi).");
      setLoading(false);
      setTimeout(() => navigate("/profile"), 2000);
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#fafafa] relative shadow-2xl overflow-x-hidden">
      <header className="bg-gradient-to-br from-primary to-secondary pt-10 pb-12 px-5 flex items-center justify-between rounded-b-3xl text-white">
        <Link to="/" className="text-white text-xl">
          <i className="fas fa-arrow-left"></i>
        </Link>
        <div className="font-bold text-lg">Reset Password</div>
        <div className="w-6"></div>
      </header>

      <div className="bg-white -mt-10 mx-5 rounded-2xl p-6 shadow-lg relative z-10">
        {message && (
          <p
            className={`text-sm text-center mb-4 ${message.includes("berhasil") ? "text-green-600" : "text-red-500"}`}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password Lama
            </label>
            <input
              type="password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Masukkan password lama"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password Baru
            </label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Minimal 8 karakter"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ulangi password baru"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-full font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Memproses..." : "Ubah Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
