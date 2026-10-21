import imageCompression from "browser-image-compression";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Camera } from "react-camera-pro";
import { StyleSheetManager } from "styled-components";
import * as faceapi from "face-api.js";
import {
  getDailyAttendance,
  getRsudLocations,
  saveAbsen,
  verifyFace,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

const shouldForwardProp = (prop) => !["aspectRatio", "mirrored"].includes(prop);

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const calculateEAR = (landmarks) => {
  const leftEye = landmarks.slice(36, 42);
  const rightEye = landmarks.slice(42, 48);
  const distance = (a, b) =>
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  const leftEAR =
    (distance(leftEye[1], leftEye[5]) + distance(leftEye[2], leftEye[4])) /
    (2 * distance(leftEye[0], leftEye[3]));
  const rightEAR =
    (distance(rightEye[1], rightEye[5]) + distance(rightEye[2], rightEye[4])) /
    (2 * distance(rightEye[0], rightEye[3]));
  return (leftEAR + rightEAR) / 2;
};

const formatApiTime = (timeStr) => (timeStr ? timeStr.slice(0, 5) : "-");

export default function AbsensiPage() {
  const { user } = useAuth();
  const cameraRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState(null);
  const [rsudLocations, setRsudLocations] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  const [isInsideArea, setIsInsideArea] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const [locationError, setLocationError] = useState("");

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFaceVerifying, setIsFaceVerifying] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  const [challengeText, setChallengeText] = useState("");
  const [challengeIcon, setChallengeIcon] = useState("fa-arrows-up-down");

  const RADIUS_LIMIT = 150;

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.tf.setBackend("cpu");
        await faceapi.tf.ready();
        const MODEL_URL = "/models/";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setIsModelLoaded(true);
      } catch (error) {
        console.error("Gagal load model:", error);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.PEGAWAI_ID) {
      getDailyAttendance(user.PEGAWAI_ID)
        .then(setAttendanceData)
        .catch(console.error);
    }
    getRsudLocations().then(setRsudLocations).catch(console.error);
  }, [user]);

  const getLandmarksFromPhoto = async (photo) => {
    const img = new Image();
    img.src = photo;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    return detection ? detection.landmarks.positions : null;
  };

  // 🔥 Hanya 1x takePhoto untuk deteksi kedip (jauh lebih cepat!)
  const waitForBlink = async () => {
    const photo = cameraRef.current?.takePhoto();
    if (photo) {
      const landmarks = await getLandmarksFromPhoto(photo);
      if (landmarks) {
        const ear = calculateEAR(landmarks);
        if (ear < 0.35) return true;
      }
    }
    return false;
  };

  const captureAndSubmit = async () => {
    if (!isInsideArea || isLoading || isCompleted) return;

    setIsFaceVerifying(true);

    try {
      // 🟢 LANGKAH 1: Netralkan Kepala (1 detik)
      setChallengeText("Netralkan Kepala Anda");
      setChallengeIcon("fa-face-smile");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const photoNetral1 = cameraRef.current.takePhoto();
      if (!photoNetral1) throw new Error("Gagal ambil foto netral");
      const landmarksNetral1 = await getLandmarksFromPhoto(photoNetral1);
      if (!landmarksNetral1) throw new Error("Wajah tidak terdeteksi");

      // 🟢 LANGKAH 2: Random Head Movement (1 detik)
      const challenges = [
        { text: "Angkat Kepala", dir: "UP", icon: "fa-arrow-up" },
        { text: "Tundukkan Kepala", dir: "DOWN", icon: "fa-arrow-down" },
        { text: "Miringkan ke Kiri", dir: "LEFT", icon: "fa-arrow-left" },
        { text: "Miringkan ke Kanan", dir: "RIGHT", icon: "fa-arrow-right" },
      ];
      const randomChallenge =
        challenges[Math.floor(Math.random() * challenges.length)];

      setChallengeText(randomChallenge.text);
      setChallengeIcon(randomChallenge.icon);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const photoGerak = cameraRef.current.takePhoto();
      if (!photoGerak) throw new Error("Gagal ambil foto gerakan");
      const landmarksGerak = await getLandmarksFromPhoto(photoGerak);
      if (!landmarksGerak)
        throw new Error("Wajah tidak terdeteksi saat bergerak");

      const noseA = landmarksNetral1[30];
      const noseB = landmarksGerak[30];
      const deltaX = noseB.x - noseA.x;
      const deltaY = noseB.y - noseA.y;

      let isMoveValid = false;
      // KOREKSI MIRROR
      if (randomChallenge.dir === "UP" && deltaY < -12) isMoveValid = true;
      if (randomChallenge.dir === "DOWN" && deltaY > 12) isMoveValid = true;
      if (randomChallenge.dir === "LEFT" && deltaX > 12) isMoveValid = true;
      if (randomChallenge.dir === "RIGHT" && deltaX < -12) isMoveValid = true;

      if (!isMoveValid) {
        alert(`Gerakan "${randomChallenge.text}" tidak terdeteksi. Coba lagi.`);
        setIsFaceVerifying(false);
        setChallengeText("");
        return;
      }

      // 🟢 LANGKAH 3: Kembali Netral (1 detik)
      setChallengeText("Netralkan Kepala Anda");
      setChallengeIcon("fa-face-smile");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const photoNetralFinal = cameraRef.current.takePhoto();
      const img = new Image();
      img.src = photoNetralFinal;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // 🟢 LANGKAH 4: Kedipkan Mata (1x foto)
      setChallengeText("Kedipkan Mata Anda");
      setChallengeIcon("fa-eye");
      const blinked = await waitForBlink();
      if (!blinked) {
        alert("Verifikasi gagal! Anda tidak berkedip.");
        setIsFaceVerifying(false);
        setChallengeText("");
        return;
      }

      // 🟢 LANGKAH 5: Verifikasi & Kirim Absen
      const detectionPromise = faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      const compressPromise = compressImage(photoNetralFinal);
      const [detection, compressedBase64] = await Promise.all([
        detectionPromise,
        compressPromise,
      ]);

      if (!detection) {
        alert("Wajah tidak terdeteksi pada foto final.");
        setIsFaceVerifying(false);
        setChallengeText("");
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const event = hasCheckedIn ? "2" : "1";
      const verifyPayload = {
        idPegawai: user?.PEGAWAI_ID,
        face_descriptor: JSON.stringify(descriptor),
      };

      const verifyRes = await verifyFace(verifyPayload);
      if (verifyRes.status !== "success") {
        alert("Verifikasi Wajah Gagal! Wajah tidak sesuai.");
        setIsFaceVerifying(false);
        setChallengeText("");
        return;
      }

      const payload = {
        id_kirim: event,
        idPegawai: user?.PEGAWAI_ID || "1512",
        nip: user?.NIP || "2003 202502 13 00 103",
        IpAddress: "unknown",
        Type: "Web",
        locationLat: userCoords?.lat,
        locationLon: userCoords?.lng,
        photo: compressedBase64,
        face_descriptor: verifyPayload.face_descriptor,
        nama: user?.NAMA || "MUHAMMAD NOVEL",
        in_rs: isInsideArea,
        shift: attendanceData?.data?.kode ?? "Non Shift",
        v_gedung: "",
        nama_gedung: "",
        versiCode: "1.1",
      };

      const res = await saveAbsen(payload);
      if (res.status === 200) {
        if (user?.PEGAWAI_ID) {
          getDailyAttendance(user.PEGAWAI_ID).then(setAttendanceData);
        }
        setIsCameraActive(false);
        setChallengeText("");
      } else {
        alert(res.message || "Gagal simpan absen");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan. Pastikan wajah terlihat jelas.");
    } finally {
      setChallengeText("");
      setIsFaceVerifying(false);
    }
  };

  const handleMainButton = () => {
    if (!isInsideArea || isCompleted) return;
    if (!isCameraActive) {
      setIsCameraActive(true);
      return;
    }
  };

  const compressImage = async (base64String) => {
    const response = await fetch(base64String);
    const blob = await response.blob();
    const options = {
      maxSizeMB: 0.15,
      maxWidthOrHeight: 640,
      useWebWorker: true,
      fileType: "image/jpeg",
    };
    try {
      const compressedBlob = await imageCompression(blob, options);
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedBlob);
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
      });
    } catch (error) {
      return base64String.split(",")[1];
    }
  };

  const checkLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Browser tidak mendukung geolokasi");
      setIsLocating(false);
      return;
    }
    setIsLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        let isInside = false;
        for (let i = 0; i < rsudLocations.length; i++) {
          const loc = rsudLocations[i];
          const distance = calculateDistance(
            latitude,
            longitude,
            loc.latitude,
            loc.longitude,
          );
          if (distance <= RADIUS_LIMIT) {
            isInside = true;
            break;
          }
        }
        setIsInsideArea(isInside);
        setIsLocating(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED)
          setLocationError("Izin lokasi ditolak.");
        else setLocationError("Gagal mengambil lokasi.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  useEffect(() => {
    if (rsudLocations.length > 0) checkLocation();
  }, [rsudLocations]);

  const formatTime = (date) =>
    date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  const formatDate = (date) =>
    date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const hasCheckedIn = attendanceData?.data_datang?.length > 0;
  const hasCheckedOut = attendanceData?.data_pulang?.length > 0;
  const isCompleted = hasCheckedIn && hasCheckedOut;

  const historyItems = [];
  if (attendanceData?.data_datang?.length > 0) {
    attendanceData.data_datang.forEach((item) => {
      historyItems.push({
        time: formatApiTime(item.TIME),
        type: "Masuk",
        icon: "fa-arrow-right-to-bracket text-primary",
      });
    });
  }
  if (attendanceData?.data_pulang?.length > 0) {
    attendanceData.data_pulang.forEach((item) => {
      historyItems.push({
        time: formatApiTime(item.TIME),
        type: "Pulang",
        icon: "fa-arrow-right-from-bracket text-orange-500",
      });
    });
  }

  return (
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-[#fafafa] relative">
        <header className="bg-gradient-to-br from-primary to-secondary pt-8 pb-6 px-5 grid grid-cols-3 items-center shrink-0 text-white">
          <Link to="/" className="justify-self-start text-xl">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <div className="text-center font-bold text-lg">Absensi</div>
          <div className="justify-self-end w-6"></div>
        </header>

        <div className="shrink-0 px-4">
          <div className="bg-white -mt-6 mx-1 rounded-2xl p-4 shadow-lg relative z-10">
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                {formatDate(currentTime)}
              </p>
              <div className="text-4xl font-bold text-primary tabular-nums tracking-tight">
                {formatTime(currentTime)}
              </div>
              <div className="flex justify-center items-center gap-2 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${isCompleted ? "bg-gray-100 text-gray-500" : hasCheckedIn ? "bg-primary-light text-primary" : "bg-yellow-100 text-yellow-700"}`}
                >
                  {isCompleted
                    ? "Absen Selesai"
                    : hasCheckedIn
                      ? "Sudah Absen Masuk"
                      : "Belum Absen"}
                </span>
                <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                  Shift: {attendanceData?.data?.shift || "Non Shift"}
                </span>
              </div>
            </div>
          </div>

          <div
            className={`flex items-center justify-between p-2 rounded-xl border mt-2 ${isLocating ? "bg-gray-50 border-gray-200" : isInsideArea ? "bg-primary-light border-primary" : "bg-red-50 border-red-300"}`}
          >
            <div className="flex items-center gap-2">
              <i
                className={`fas fa-map-marker-alt text-lg ${isLocating ? "text-gray-400 animate-pulse" : isInsideArea ? "text-primary" : "text-red-500"}`}
              ></i>
              <div>
                <p
                  className={`text-xs font-semibold ${isLocating ? "text-gray-500" : isInsideArea ? "text-primary-dark" : "text-red-600"}`}
                >
                  {isLocating
                    ? "Mencari lokasi..."
                    : isInsideArea
                      ? "Di Dalam Area Kantor"
                      : "Di Luar Area Kantor"}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {userCoords
                    ? `Lat: ${userCoords.lat.toFixed(5)} | Lng: ${userCoords.lng.toFixed(5)}`
                    : "Menunggu GPS..."}
                </p>
              </div>
            </div>
            <button
              onClick={checkLocation}
              className="text-xs text-primary underline"
            >
              Perbarui
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 mx-4 mt-2 relative bg-black rounded-2xl overflow-hidden">
          {isCameraActive ? (
            <>
              <Camera
                ref={cameraRef}
                facingMode="user"
                videoConstraints={{
                  facingMode: "user",
                  focusMode: "continuous",
                  width: { ideal: 1280 }, // Minta resolusi tinggi
                  height: { ideal: 720 },
                }}
                errorMessages={{
                  noCameraAccessible: "Kamera tidak dapat diakses.",
                  permissionDenied: "Izin kamera ditolak.",
                  switchCamera: "Tidak dapat mengganti kamera.",
                  canvas: "Gagal memproses gambar.",
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-44 h-56 border-2 border-dashed border-white/80 rounded-[50%] flex items-start justify-center pt-8 relative">
                  <span className="text-white text-xs font-semibold mt-2 tracking-wide">
                    Posisikan wajah
                  </span>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-56 h-16 border-b-2 border-white/50 rounded-b-[50%]"></div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-500 text-sm">
                {isModelLoaded ? "Kamera belum aktif" : "Memuat model AI..."}
              </p>
            </div>
          )}
        </div>

        <div className="shrink-0 px-4 py-3">
          {isFaceVerifying ? (
            <div className="text-center text-xs font-semibold text-orange-500 mb-2 animate-pulse">
              Memverifikasi... {challengeText}
            </div>
          ) : (
            <div className="text-center text-xs font-semibold text-gray-400 mb-2">
              Klik Verifikasi untuk memulai proses
            </div>
          )}

          <div className="flex gap-2">
            {!isCameraActive ? (
              <button
                onClick={handleMainButton}
                disabled={!isInsideArea || isCompleted}
                className={`w-full py-4 rounded-full font-bold text-lg transition-all ${!isInsideArea || isCompleted ? "bg-gray-300 text-gray-500" : "bg-gradient-to-r from-primary to-secondary text-white"}`}
              >
                <i className="fas fa-fingerprint mr-2"></i>
                {isCompleted
                  ? "ABSEN SELESAI"
                  : hasCheckedIn
                    ? "ABSEN PULANG"
                    : "ABSEN MASUK"}
              </button>
            ) : (
              <>
                <button
                  onClick={captureAndSubmit}
                  disabled={
                    !isInsideArea || isCompleted || isFaceVerifying || isLoading
                  }
                  className={`flex-1 py-4 rounded-full font-bold text-lg transition-all ${!isInsideArea || isCompleted || isFaceVerifying || isLoading ? "bg-gray-300 text-gray-500" : "bg-primary text-white"}`}
                >
                  {isFaceVerifying ? "Memverifikasi..." : "Verifikasi & Absen"}
                </button>
                <button
                  onClick={() => {
                    setIsCameraActive(false);
                  }}
                  className="bg-gray-200 text-gray-600 px-4 py-4 rounded-full font-semibold"
                >
                  Batal
                </button>
              </>
            )}
          </div>
        </div>

        {isFaceVerifying && challengeText && (
          <div className="absolute top-24 left-0 right-0 z-30 flex justify-center px-4">
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-center animate-pulse">
              <i className={`fas ${challengeIcon} text-2xl mb-2 block`}></i>
              {challengeText}
            </div>
          </div>
        )}

        {!isCameraActive && (
          <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl mt-2 p-5 pb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-primary text-lg">
                Riwayat Hari Ini
              </h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {attendanceData?.hari_ini || "Memuat..."}
              </span>
            </div>

            {historyItems.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <i className="fas fa-inbox text-3xl mb-2"></i>
                <p>Belum ada data absensi hari ini.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {historyItems.map((item, index) => {
                  const isMasuk = item.type === "Masuk";
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 border-b border-gray-100 pb-3"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${isMasuk ? "bg-primary-light text-primary" : "bg-orange-100 text-orange-500"}`}
                      >
                        <i className={`fas ${item.icon}`}></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">
                          Absen {item.type}
                        </p>
                        <p className="font-bold text-gray-800">{item.time}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full ${isMasuk ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-500"}`}
                      >
                        {isMasuk ? "Masuk" : "Pulang"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </StyleSheetManager>
  );
}
