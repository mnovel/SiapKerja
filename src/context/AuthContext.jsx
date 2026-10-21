import { createContext, useContext, useState } from "react";
import { autentikasi, loginAndroid, getEmployeeDetail } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const login = async (username, password) => {
    try {
      // LANGKAH 1: Autentikasi username & password
      const res1 = await autentikasi(username, password);

      if (res1.status !== "200") {
        return { success: false, message: "Username atau password salah" };
      }

      const pegawaiId = res1.data.pegawai_id;

      // LANGKAH 2: Ambil token dari login_android
      const res2 = await loginAndroid(pegawaiId);

      if (res2.status !== "success") {
        return { success: false, message: "Gagal mengambil data pegawai" };
      }

      // LANGKAH 3: Ambil detail pegawai lengkap (termasuk LINK foto)
      const detailRes = await getEmployeeDetail(pegawaiId);
      const detailData = detailRes.data || detailRes;

      const userData = {
        ...res2.data,
        ...detailData,
        PEGAWAI_ID: pegawaiId,
      };

      // Simpan ke localStorage
      localStorage.setItem("token", userData.TOKEN || userData.token);
      localStorage.setItem("user", JSON.stringify(userData));

      setToken(userData.TOKEN || userData.token);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Koneksi ke server gagal" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
