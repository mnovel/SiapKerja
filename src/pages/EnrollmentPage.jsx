import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { saveFace } from "../services/api";
import * as faceapi from "face-api.js";
import { useAuth } from "../context/AuthContext";
import { StyleSheetManager } from "styled-components";
import { Camera } from "react-camera-pro";

const shouldForwardProp = (prop) => !["aspectRatio", "mirrored"].includes(prop);

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

export default function EnrollmentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cameraRef = useRef(null);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedDescriptors, setCapturedDescriptors] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isInstructionOpen, setIsInstructionOpen] = useState(false);
  const [instructionText, setInstructionText] = useState("");
  const [instructionSubText, setInstructionSubText] = useState("");
  const [instructionIcon, setInstructionIcon] = useState("fa-face-smile");
  const [instructionAnim, setInstructionAnim] = useState("animate-pulse");

  // Load model Face API
  useEffect(() => {
    const loadModels = async () => {
      setStatusMessage("Memuat model AI...");
      setErrorMessage("");
      try {
        // Gunakan webgl di HP agar lebih cepat, fallback ke cpu jika gagal
        try {
          await faceapi.tf.setBackend("webgl");
          await faceapi.tf.ready();
        } catch (e) {
          await faceapi.tf.setBackend("cpu");
          await faceapi.tf.ready();
        }
        const MODEL_URL = "/models/";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setIsModelLoaded(true);
        setStatusMessage("Model siap. Klik 'Rekam Wajah' untuk memulai.");
      } catch (error) {
        console.error("Gagal load model:", error);
        setErrorMessage(`Gagal load model: ${error.message || error}`);
        setStatusMessage("");
      }
    };
    loadModels();
  }, []);

  const waitForBlink = async () => {
    const video = cameraRef.current?.video;
    if (!video) return false;
    for (let i = 0; i < 10; i++) {
      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();
        if (detection) {
          const ear = calculateEAR(detection.landmarks.positions);
          if (ear < 0.2) return true;
        }
      } catch (error) {
        console.error("Error deteksi kedipan:", error);
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    return false;
  };

  const startCapture = async () => {
    if (!isModelLoaded || !cameraRef.current) return;
    setIsCapturing(true);
    setCapturedDescriptors([]);
    setErrorMessage("");
    setIsInstructionOpen(true);

    const descriptors = [];
    const loopCount = 5; // Kurangi dari 7 ke 5 agar lebih cepat di HP

    const instructions = [
      {
        text: "Posisi Netral",
        subText: "Tatap kamera lurus.",
        icon: "fa-face-smile",
        anim: "animate-pulse",
      },
      {
        text: "Miring ke Kiri",
        subText: "Miringkan kepala ke kiri.",
        icon: "fa-arrow-left",
        anim: "animate-bounce",
      },
      {
        text: "Miring ke Kanan",
        subText: "Miringkan kepala ke kanan.",
        icon: "fa-arrow-right",
        anim: "animate-bounce",
      },
      {
        text: "Posisi Netral",
        subText: "Kembali lurus.",
        icon: "fa-face-smile",
        anim: "animate-pulse",
      },
      {
        text: "Kedipkan Mata",
        subText: "Kedipkan mata Anda.",
        icon: "fa-eye",
        anim: "animate-pulse",
      },
    ];

    try {
      for (let i = 0; i < loopCount; i++) {
        setInstructionText(instructions[i].text);
        setInstructionSubText(instructions[i].subText);
        setInstructionIcon(instructions[i].icon);
        setInstructionAnim(instructions[i].anim);

        // Kurangi jeda dari 1.5 detik ke 1 detik agar lebih cepat
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (i === 4) {
          // Kedipan di sampel ke-5
          const blinked = await waitForBlink();
          if (!blinked) {
            setStatusMessage("Kedipan tidak terdeteksi. Melanjutkan...");
          }
        }

        const photo = cameraRef.current.takePhoto();
        const img = new Image();
        img.src = photo;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          descriptors.push(detection.descriptor);
        }

        setStatusMessage(`Sampel ${i + 1}/${loopCount} berhasil.`);
      }

      if (descriptors.length >= 3) {
        const avgDescriptor = descriptors[0].map((_, idx) => {
          const sum = descriptors.reduce((acc, desc) => acc + desc[idx], 0);
          return sum / descriptors.length;
        });
        setCapturedDescriptors([avgDescriptor]);
        setStatusMessage("Perekaman berhasil! Wajah siap disimpan.");
        setIsInstructionOpen(false);
      } else {
        setErrorMessage("Sampel kurang. Coba lagi.");
        setIsCapturing(false);
        setIsInstructionOpen(false);
      }
    } catch (error) {
      console.error(error);
      setIsInstructionOpen(false);
      setErrorMessage("Terjadi kesalahan saat merekam.");
      setIsCapturing(false);
    }
  };

  const handleSave = async () => {
    if (capturedDescriptors.length === 0) return;
    try {
      setStatusMessage("Menyimpan data wajah...");
      const payload = {
        idPegawai: user?.PEGAWAI_ID,
        face_descriptor: JSON.stringify(capturedDescriptors[0]),
      };
      const result = await saveFace(payload);
      if (result.status === "success") {
        setStatusMessage("Data wajah berhasil disimpan!");
        setTimeout(() => navigate("/"), 2000);
      } else {
        setErrorMessage(result.message || "Gagal menyimpan.");
      }
    } catch (error) {
      setErrorMessage("Koneksi ke server gagal.");
    }
  };

  const resetCapture = () => {
    setCapturedDescriptors([]);
    setStatusMessage("Silakan rekam ulang.");
    setErrorMessage("");
    setIsInstructionOpen(false);
  };

  return (
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <div className="max-w-md mx-auto min-h-screen bg-[#fafafa] relative shadow-2xl overflow-x-hidden pb-10">
        {/* HEADER */}
        <header className="bg-gradient-to-br from-primary to-secondary pt-10 pb-12 px-5 flex items-center justify-between rounded-b-3xl text-white">
          <Link to="/" className="text-white text-xl">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <div className="font-bold text-lg">Perekaman Wajah</div>
          <div className="w-6"></div>
        </header>

        {/* KONTEN */}
        <div className="bg-white -mt-10 mx-5 rounded-2xl p-5 shadow-lg relative z-10">
          <h2 className="font-bold text-primary mb-4 text-sm">
            Registrasi Wajah Pegawai
          </h2>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Nama:{" "}
              <span className="font-semibold">{user?.NAMA || "Memuat..."}</span>
            </p>
            <p className="text-sm text-gray-600">
              NIP: <span className="font-semibold">{user?.NIP || "-"}</span>
            </p>
          </div>

          {/* AREA INSTRUKSI DI ATAS (BANNER) */}
          {isInstructionOpen && (
            <div className="mb-4 bg-primary-light rounded-xl p-3 flex items-center gap-3">
              <div
                className={`w-10 h-10 bg-white rounded-full flex items-center justify-center ${instructionAnim}`}
              >
                <i
                  className={`fas ${instructionIcon} text-primary text-xl`}
                ></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary">
                  {instructionText}
                </h3>
                <p className="text-xs text-gray-600">{instructionSubText}</p>
              </div>
            </div>
          )}

          {/* AREA KAMERA DI BAWAH */}
          <div className="relative bg-black rounded-2xl overflow-hidden mb-4 aspect-[3/4] flex items-center justify-center">
            {isModelLoaded ? (
              <>
                <Camera
                  ref={cameraRef}
                  facingMode="user"
                  aspectRatio={3 / 4}
                  errorMessages={{
                    noCameraAccessible: "Kamera tidak dapat diakses.",
                    permissionDenied: "Izin kamera ditolak.",
                    switchCamera: "Tidak dapat mengganti kamera.",
                    canvas: "Gagal memproses gambar.",
                  }}
                />
                {/* Overlay panduan */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-52 h-64 border-2 border-dashed border-white/80 rounded-[50%] flex items-start justify-center pt-8 relative">
                    <span className="text-white text-xs font-semibold mt-2 tracking-wide">
                      Letakkan wajah
                    </span>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-64 h-16 border-b-2 border-white/50 rounded-b-[50%]"></div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm">
                {isModelLoaded ? "Kamera belum aktif" : "Memuat model AI..."}
              </p>
            )}
          </div>

          {/* PESAN STATUS / ERROR */}
          {statusMessage && (
            <p className="text-sm text-primary bg-primary-light px-3 py-2 rounded-xl mb-4">
              {statusMessage}
            </p>
          )}
          {errorMessage && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl mb-4">
              {errorMessage}
            </p>
          )}

          {/* TOMBOL KONTROL */}
          <div className="flex gap-3">
            {capturedDescriptors.length === 0 ? (
              <button
                onClick={startCapture}
                disabled={isCapturing}
                className="flex-1 bg-primary text-white py-3 rounded-full font-semibold disabled:opacity-50"
              >
                {isCapturing ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin mr-2"></i>{" "}
                    Merekam...
                  </>
                ) : (
                  <>
                    <i className="fas fa-video mr-2"></i> Rekam Wajah
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex-1 bg-green-600 text-white py-3 rounded-full font-semibold"
              >
                <i className="fas fa-save mr-2"></i> Simpan
              </button>
            )}
          </div>

          {capturedDescriptors.length > 0 && (
            <button
              onClick={resetCapture}
              className="w-full mt-3 text-xs text-primary underline"
            >
              Ulangi Perekaman
            </button>
          )}
        </div>
      </div>
    </StyleSheetManager>
  );
}
