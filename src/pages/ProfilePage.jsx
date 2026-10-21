import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Hapus data user dari localStorage & context
    logout();
    // Arahkan ke halaman login
    navigate("/login");
  };

  // Format tanggal lahir agar rapi (YYYY-MM-DD -> DD Bulan YYYY)
  const formatBirthDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#fafafa] relative shadow-2xl overflow-x-hidden pb-10">
      {/* HEADER HALAMAN */}
      <header className="bg-gradient-to-br from-primary to-secondary pt-10 pb-14 px-5 flex items-center justify-between rounded-b-3xl text-white">
        <Link to="/" className="text-white text-xl">
          <i className="fas fa-arrow-left"></i>
        </Link>
        <div className="font-bold text-lg">Profil Saya</div>
        <div className="w-6"></div>
      </header>

      {/* KARTU PROFIL UTAMA */}
      <div className="bg-white -mt-10 mx-5 rounded-2xl p-6 shadow-lg relative z-10 text-center">
        <div className="w-24 h-24 rounded-full bg-primary mx-auto overflow-hidden border-4 border-primary-light mb-4">
          {user?.LINK ? (
            <img
              src={user.LINK}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-3xl">
              {user?.NAMA?.charAt(0) || "U"}
            </div>
          )}
        </div>
        <h1 className="text-xl font-bold text-gray-800">
          {user?.NAMA || "Nama Pegawai"}
        </h1>
        <p className="text-sm text-gray-500">
          {user?.NAMAUNIT || "Unit Kerja"}
        </p>

        <div className="flex justify-center gap-3 mt-4">
          <span className="bg-primary-light text-primary px-3 py-1 rounded-full text-xs font-semibold">
            NIP: {user?.NIP || "-"}
          </span>
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
            {user?.STATUS_KEPEGAWAIAN || "Pegawai"}
          </span>
        </div>
      </div>

      {/* DATA DIRI */}
      <div className="bg-white mx-5 mt-5 rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-primary mb-4">Data Diri</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
              <i className="fas fa-id-card"></i>
            </div>
            <div>
              <p className="text-xs text-gray-400">ID Pegawai</p>
              <p className="font-semibold text-gray-800">
                {user?.PEGAWAI_ID || "-"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
              <i className="fas fa-map-marker-alt"></i>
            </div>
            <div>
              <p className="text-xs text-gray-400">Tempat, Tanggal Lahir</p>
              <p className="font-semibold text-gray-800">
                {user?.TMLAHIR ? `${user.TMLAHIR}, ` : ""}
                {formatBirthDate(user?.TGLAHIR)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
              <i className="fas fa-venus-mars"></i>
            </div>
            <div>
              <p className="text-xs text-gray-400">Jenis Kelamin</p>
              <p className="font-semibold text-gray-800">
                {user?.KELAMIN || "-"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
              <i className="fas fa-phone"></i>
            </div>
            <div>
              <p className="text-xs text-gray-400">No. HP</p>
              <p className="font-semibold text-gray-800">{user?.HP || "-"}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
              <i className="fas fa-home"></i>
            </div>
            <div>
              <p className="text-xs text-gray-400">Alamat</p>
              <p className="font-semibold text-gray-800">
                {user?.ALAMAT || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TOMBOL REKAM WAJAH */}
      <Link
        to="/enroll-face"
        className="w-1/2 mx-auto mt-6 bg-primary text-white py-3 rounded-full font-bold shadow-lg flex justify-center items-center gap-2"
      >
        <i className="fas fa-camera-retro"></i> Rekam Wajah
      </Link>

      {/* TOMBOL LOGOUT (yang sudah ada) */}
      <button
        onClick={handleLogout}
        className="w-1/2 mx-auto mt-4 bg-red-500 text-white py-3 rounded-full font-bold shadow-lg hover:bg-red-600 transition-colors flex justify-center items-center gap-2"
      >
        <i className="fas fa-sign-out-alt"></i> Keluar
      </button>
    </div>
  );
}
