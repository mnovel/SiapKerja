import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import FabButton from "../components/FabButton";
import { getBirthdayList } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  // Ambil data user dari context (sudah termasuk NAMA, LINK, PEGAWAI_ID)
  const { user } = useAuth();

  const [birthdays, setBirthdays] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const scrollRef = useRef(null);
  const galleryScrollRef = useRef(null);

  // Daftar URL Galeri
  const galleryImages = [
    "https://rsud.pasuruankota.go.id/assets/assets/img/fotors/radiologi.jpg",
    "https://rsud.pasuruankota.go.id/assets/assets/img/fotors/depan.jpg",
    "https://rsud.pasuruankota.go.id/assets/assets/img/fotors/gazebo.jpg",
    "https://rsud.pasuruankota.go.id/assets/assets/img/fotors/igd.jpg",
    "https://rsud.pasuruankota.go.id/assets/assets/img/fotors/klinik.jpg",
    "https://rsud.pasuruankota.go.id/assets/assets/img/fotors/7.jpeg",
    "https://rsud.pasuruankota.go.id/assets/assets/img/fotors/lab.jpg",
    "https://rsud.pasuruankota.go.id/assets/assets/img/fotors/radiologi.jpg",
    "https://rsud.pasuruankota.go.id/assets/assets/img/fotors/depan.jpg",
    "https://rsud.pasuruankota.go.id/assets/assets/img/fotors/gazebo.jpg",
    "https://rsud.pasuruankota.go.id/assets/assets/img/fotors/depan.jpg",
    "https://rsud.pasuruankota.go.id/assets/assets/img/slide/header1.jpg",
    "https://rsud.pasuruankota.go.id/assets/assets/img/slide/5.jpg",
    "https://rsud.pasuruankota.go.id/assets/assets/img/slide/6.JPG",
  ];

  useEffect(() => {
    // Ambil daftar pegawai ulang tahun (tidak tergantung user login)
    getBirthdayList()
      .then((data) => setBirthdays(data))
      .catch((err) => console.error("Gagal ambil data ulang tahun:", err));
  }, []);

  // Helper format tanggal lahir
  const formatBirthday = (dateStr) => {
    if (!dateStr) return "Tgl tidak diketahui";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  // Filter pegawai ulang tahun hari ini
  const todayBirthdays = birthdays.filter((person) => {
    if (!person.TGLAHIR) return false;
    const birthDate = new Date(person.TGLAHIR);
    const birthMMDD = `${String(birthDate.getMonth() + 1).padStart(2, "0")}-${String(birthDate.getDate()).padStart(2, "0")}`;
    const now = new Date();
    const todayMMDD = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return birthMMDD === todayMMDD;
  });

  // AUTO-SCROLL ULANG TAHUN
  useEffect(() => {
    if (todayBirthdays.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % todayBirthdays.length;
        const scrollAmount = scrollRef.current.clientWidth * nextIndex;
        scrollRef.current.scrollTo({ left: scrollAmount, behavior: "smooth" });
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [todayBirthdays.length]);

  // AUTO-SCROLL GALERI
  useEffect(() => {
    if (galleryImages.length <= 1) return;

    const interval = setInterval(() => {
      setActiveGalleryIndex((prev) => {
        const nextIndex = (prev + 1) % galleryImages.length;
        const step = 200 + 16;
        galleryScrollRef.current.scrollTo({
          left: nextIndex * step,
          behavior: "smooth",
        });
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [galleryImages.length]);

  // Manual scroll untuk ultah
  const handleScroll = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.clientWidth;
      const index = Math.round(scrollRef.current.scrollLeft / cardWidth);
      setActiveIndex(index);
    }
  };

  // Manual scroll untuk galeri
  const handleGalleryScroll = () => {
    if (galleryScrollRef.current) {
      const step = 200 + 16;
      const index = Math.round(galleryScrollRef.current.scrollLeft / step);
      setActiveGalleryIndex(index);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#fafafa] pb-28 relative shadow-2xl overflow-x-hidden">
      {/* Header Hijau - Data diambil dari User Login */}
      <header className="bg-gradient-to-br from-primary to-secondary pt-10 pb-14 px-5 flex justify-between items-center rounded-b-3xl text-white">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-white overflow-hidden">
            {user?.LINK ? (
              <img
                src={user.LINK}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full"></div>
            )}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-sm tracking-wide">
              {user?.NAMA || "Memuat..."}
            </span>
            <span className="text-[11px] text-white/80">
              {user?.NIP || user?.PEGAWAI_ID || "-"}
            </span>
          </div>
        </div>
        <div className="relative cursor-pointer">
          <i className="fas fa-bell text-xl"></i>
          <span className="absolute -top-1 -right-2 bg-red-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-primary">
            0
          </span>
        </div>
      </header>

      {/* Card Pegawai Ulang Tahun */}
      <div className="bg-white -mt-10 mx-5 rounded-2xl p-5 shadow-lg relative z-10">
        <h3 className="font-bold text-primary mb-4">🎂 Ulang Tahun Hari Ini</h3>

        {todayBirthdays.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            Tidak ada pegawai yang berulang tahun hari ini.
          </p>
        ) : (
          <>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory"
            >
              {todayBirthdays.map((person, index) => (
                <div
                  key={index}
                  className="w-full flex-shrink-0 bg-primary-light rounded-2xl p-4 flex items-center gap-4 snap-center"
                >
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-primary font-bold overflow-hidden shadow-sm flex-shrink-0">
                    {person.link ? (
                      <img
                        src={person.link}
                        alt={person.NAMA}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      person.NAMA?.charAt(0) || "?"
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-tight mb-1 truncate">
                      {person.NAMA}{" "}
                      {person.GELAR_BLK && person.GELAR_BLK !== "0"
                        ? `, ${person.GELAR_BLK}`
                        : ""}
                    </p>
                    <p className="text-xs text-gray-500 mb-2 truncate">
                      {person.namaunit || "Tanpa Unit"}
                    </p>
                    <span className="inline-block text-xs bg-white text-primary-dark px-3 py-1 rounded-full font-semibold">
                      {formatBirthday(person.TGLAHIR)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {todayBirthdays.length > 1 && (
              <div className="flex justify-center gap-2 mt-1">
                {todayBirthdays.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === activeIndex ? "bg-primary w-4" : "bg-gray-300"
                    }`}
                  ></div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Menu Absensi & History */}
      <div className="flex gap-4 mx-5 mt-5">
        <Link
          to="/absensi"
          className="flex-1 bg-primary-light border border-primary-border rounded-2xl p-5 flex flex-col items-center gap-3 active:scale-95 transition-transform"
        >
          <i className="fas fa-arrow-right-from-bracket text-3xl text-primary"></i>
          <span className="font-semibold text-primary text-sm">Absensi</span>
        </Link>

        <Link
          to="/history"
          className="flex-1 bg-primary-light border border-primary-border rounded-2xl p-5 flex flex-col items-center gap-3 active:scale-95 transition-transform"
        >
          <i className="fas fa-history text-3xl text-primary"></i>
          <span className="font-semibold text-primary text-sm">History</span>
        </Link>
      </div>

      {/* Bagian Cuti */}
      <div className="bg-white rounded-t-3xl mt-5 p-5">
        <h2 className="font-bold text-lg text-primary mb-5">Cuti</h2>
        <div className="flex gap-4">
          <div className="flex-1 bg-cuti-yellow rounded-2xl p-5 text-center flex flex-col items-center gap-1">
            <span className="text-5xl font-semibold text-primary">12</span>
            <span className="font-semibold text-primary text-sm">Cuti</span>
          </div>
          <div className="flex-1 bg-[#6db85f] rounded-2xl p-5 text-center flex flex-col items-center gap-1">
            <span className="text-5xl font-semibold text-yellow-100">12</span>
            <span className="font-semibold text-yellow-100 text-sm">
              Sisa Cuti
            </span>
          </div>
        </div>
      </div>

      {/* Bagian Galeri dengan AUTO-SLIDE */}
      <div className="mt-5 px-5">
        <h2 className="font-bold text-lg text-primary mb-4">Galeri</h2>
        <div
          ref={galleryScrollRef}
          onScroll={handleGalleryScroll}
          className="flex gap-4 overflow-x-auto pb-4 no-scrollbar"
        >
          {galleryImages.map((url, index) => (
            <div
              key={index}
              className="min-w-[200px] h-40 rounded-2xl bg-cover bg-center flex-shrink-0"
              style={{ backgroundImage: `url('${url}')` }}
            ></div>
          ))}
        </div>
        <div className="flex justify-center gap-2 mt-2">
          {galleryImages.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === activeGalleryIndex ? "bg-primary w-4" : "bg-gray-300"
              }`}
            ></div>
          ))}
        </div>
      </div>

      <FabButton />
      <BottomNav />
    </div>
  );
}
