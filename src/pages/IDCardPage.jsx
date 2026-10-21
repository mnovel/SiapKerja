import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { QRCodeSVG } from "qrcode.react";

export default function IDCardPage() {
  const { user } = useAuth();

  // Data untuk QR Code
  const qrValue = `PEGAWAI_ID:${user?.PEGAWAI_ID}|NIP:${user?.NIP}|NAMA:${user?.NAMA}`;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#fafafa] relative shadow-2xl overflow-x-hidden pb-10">
      {/* HEADER HALAMAN */}
      <header className="bg-gradient-to-br from-primary to-secondary pt-10 pb-6 px-5 flex items-center justify-between rounded-b-3xl text-white">
        <Link to="/" className="text-white text-xl">
          <i className="fas fa-arrow-left"></i>
        </Link>
        <div className="font-bold text-lg">ID Card Digital</div>
        <div className="w-6"></div>
      </header>

      {/* KARTU ID (Margin diubah jadi positif agar tidak menabrak header) */}
      <div className="bg-white mt-5 mx-4 rounded-3xl shadow-2xl overflow-hidden">
        {/* Bagian Atas Kartu */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white text-center">
          <h1 className="font-bold text-xl tracking-wide">RSUD PASURUAN</h1>
          <p className="text-xs opacity-90 mt-1">Kartu Identitas Pegawai</p>
        </div>

        <div className="p-6">
          {/* Profil & Data Diri */}
          <div className="flex items-center gap-4 mb-6">
            {/* Foto Profil */}
            <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden border-2 border-primary-light flex-shrink-0">
              {user?.LINK && !user?.LINK.includes("no_pict") ? (
                <img
                  src={user.LINK}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary font-bold text-3xl">
                  {user?.NAMA?.charAt(0) || "P"}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-800 truncate">
                {user?.NAMA || "Nama Pegawai"}
              </h2>
              <p className="text-sm text-gray-500 truncate">
                {user?.NAMAUNIT || "Unit Kerja"}
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">NIP:</span> {user?.NIP || "-"}
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Status:</span>{" "}
                  {user?.STATUS_KEPEGAWAIAN || "Pegawai"}
                </p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <QRCodeSVG value={qrValue} size={150} />
            </div>
            <p className="text-xs text-gray-500 text-center leading-relaxed mt-4">
              Tunjukkan QR ini untuk verifikasi absensi
            </p>
          </div>

          {/* Footer Kartu */}
          <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-center text-xs text-gray-500">
            <span>ID: {user?.PEGAWAI_ID || "-"}</span>
            <span>RSUD Pasuruan</span>
          </div>
        </div>
      </div>
    </div>
  );
}
