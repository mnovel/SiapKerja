import axios from "axios";

const API_URL = "/rest_pegawai";

export const autentikasi = async (username, password) => {
  try {
    const body = new URLSearchParams();
    body.append("trigger", "login");
    body.append("nama", username);
    body.append("password", password);

    const response = await axios.post("/api/sda/autentikasi", body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data;
  } catch (error) {
    console.error("Error autentikasi:", error);
    throw error;
  }
};

// 2. Endpoint login_android (Ambil Token & Data Pegawai)
export const loginAndroid = async (pegawai_id) => {
  try {
    const response = await axios.post("/rest_pegawai/login_android", {
      pegawai_id,
    });
    return response.data;
  } catch (error) {
    console.error("Error login android:", error);
    throw error;
  }
};

export const getEmployeeDetail = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/master/pegawai/detail/${id}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching employee detail:", error);
    throw error;
  }
};

export const getBirthdayList = async () => {
  try {
    const response = await axios.get(`${API_URL}/pegawai/ultah`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching birthdays:", error);
    throw error;
  }
};

export const getDailyAttendance = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/pegawai/jadwal/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching daily attendance:", error);
    throw error;
  }
};

export const getRsudLocations = async () => {
  try {
    const response = await axios.get(`${API_URL}/lokasi/rsud`);
    return response.data.data; // Mengembalikan array koordinat
  } catch (error) {
    console.error("Error fetching locations:", error);
    throw error;
  }
};

// Kirim Absen ke Backend
export const saveAbsen = async (payload) => {
  try {
    const response = await axios.post(
      "/rest_pegawai/save_absen/pegawai",
      payload,
    );
    return response.data;
  } catch (error) {
    console.error("Error saving attendance:", error);
    throw error;
  }
};

export const getAbsensiList = async (id, startDate, endDate) => {
  try {
    const response = await axios.get(
      `${API_URL}/ListAbsensi/${id}/${startDate}/${endDate}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching absensi list:", error);
    throw error;
  }
};

export const saveFace = async (payload) => {
  try {
    const response = await axios.post(`${API_URL}/pegawai/save_face`, payload);
    return response.data; // Mengembalikan { status, message }
  } catch (error) {
    console.error("Error saving face data:", error);
    throw error;
  }
};

export const verifyFace = async (payload) => {
  try {
    const response = await axios.post(
      `${API_URL}/pegawai/verify_face`,
      payload,
    );
    return response.data;
  } catch (error) {
    console.error("Error verifying face:", error);
    throw error;
  }
};
