import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAbsensiList } from "../services/api";

// Helper format tanggal untuk input type="date" (YYYY-MM-DD)
const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper format tanggal untuk tampilan (Senin, 20 Agustus 2026)
const formatDateDisplay = (dateStr) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Helper untuk mengubah base64 mentah menjadi URL gambar yang bisa ditampilkan
const getImageSrc = (base64) => {
  if (!base64) return null;
  // Deteksi format: PNG diawali "iVBOR", JPEG diawali "/9j/"
  if (base64.startsWith("iVBOR")) return `data:image/png;base64,${base64}`;
  if (base64.startsWith("/9j/")) return `data:image/jpeg;base64,${base64}`;
  // Fallback ke JPEG jika tidak terdeteksi
  return `data:image/jpeg;base64,${base64}`;
};

export default function HistoryPage() {
  const { user } = useAuth();

  // Default: 1 minggu terakhir (hari ini mundur 6 hari)
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 6);

  const [startDate, setStartDate] = useState(formatDateInput(weekAgo));
  const [endDate, setEndDate] = useState(formatDateInput(today));
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // State untuk popup foto
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Tampilkan 5 hari per halaman

  // Fetch data saat tanggal berubah
  useEffect(() => {
    if (!user?.PEGAWAI_ID) return;

    setIsLoading(true);
    setError("");

    getAbsensiList(user.PEGAWAI_ID, startDate, endDate)
      .then((res) => {
        if (res.status === 200) {
          setData(res.data || []);
        } else {
          setData([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Gagal mengambil data history.");
      })
      .finally(() => setIsLoading(false));
  }, [user?.PEGAWAI_ID, startDate, endDate]);

  // Reset ke halaman 1 setiap kali filter tanggal berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

  // --- LOGIKA PAGINATION ---
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const currentData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Fungsi untuk menutup popup
  const closeModal = () => setSelectedPhoto(null);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#fafafa] pb-10 relative shadow-2xl overflow-x-hidden">
      {/* HEADER */}
      <header className="bg-gradient-to-br from-primary to-secondary pt-10 pb-12 px-5 flex items-center justify-between rounded-b-3xl text-white">
        <Link to="/" className="text-white text-xl">
          <i className="fas fa-arrow-left"></i>
        </Link>
        <div className="font-bold text-lg">History Absensi</div>
        <div className="w-6"></div>
      </header>

      {/* DATE RANGE FILTER */}
      <div className="bg-white -mt-10 mx-5 rounded-2xl p-5 shadow-lg relative z-10">
        <h2 className="font-bold text-primary mb-4 text-sm">Filter Tanggal</h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* LIST HASIL */}
      <div className="mx-5 mt-5">
        {isLoading ? (
          <div className="text-center text-gray-400 py-10">
            <i className="fas fa-circle-notch fa-spin text-3xl mb-3"></i>
            <p>Memuat data...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : data.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <i className="fas fa-calendar-times text-3xl mb-3"></i>
            <p>Tidak ada data absensi pada rentang tanggal ini.</p>
          </div>
        ) : (
          <>
            {/* Tampilkan data berdasarkan halaman aktif */}
            <div className="flex flex-col gap-4">
              {currentData.map((item) => (
                <div
                  key={item.tanggal}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  {/* Tanggal & Shift */}
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
                    <div>
                      <p className="font-bold text-gray-800">
                        {formatDateDisplay(item.tanggal)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Shift: {item.shift_nama || "Non Shift"}
                      </p>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {item.shift}
                    </span>
                  </div>

                  {/* Detail Absensi */}
                  {item.detail.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-2">
                      Tidak ada aktivitas absen
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {item.detail.map((log, idx) => {
                        const isMasuk = log.event === "1";
                        const time = log.time_act
                          ? log.time_act.split(" ")[1].slice(0, 5)
                          : "-";
                        const photoSrc = getImageSrc(log.photo);

                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${isMasuk ? "bg-primary-light text-primary" : "bg-orange-100 text-orange-500"}`}
                            >
                              <i
                                className={`fas ${isMasuk ? "fa-arrow-right-to-bracket" : "fa-arrow-right-from-bracket"} text-sm`}
                              ></i>
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800">
                                {isMasuk ? "Absen Masuk" : "Absen Pulang"} -{" "}
                                {time}
                              </p>
                              {!photoSrc && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Tidak ada foto
                                </p>
                              )}
                            </div>

                            {photoSrc && (
                              <img
                                src={photoSrc}
                                alt="Foto Absen"
                                onClick={() => setSelectedPhoto(photoSrc)}
                                className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200 shadow-sm flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* TOMBOL PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50 transition-opacity"
                >
                  <i className="fas fa-chevron-left mr-1"></i> Prev
                </button>

                <span className="text-sm font-semibold text-gray-600">
                  Hal. {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50 transition-opacity"
                >
                  Next <i className="fas fa-chevron-right ml-1"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL / POPUP FOTO */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={closeModal}
        >
          <div
            className="relative w-[95vw] h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto}
              alt="Foto Absen Besar"
              className="w-full h-full object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg text-gray-700 hover:bg-gray-200 z-10"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
