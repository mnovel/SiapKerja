import { Link, useLocation } from "react-router-dom";

export default function BottomNav() {
  const location = useLocation(); // Untuk tahu halaman apa yang sedang dibuka

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white flex justify-around pt-5 pb-8 border-t border-gray-100 z-10">
      <Link
        to="/"
        className={`text-xl ${isActive("/") ? "text-primary" : "text-gray-300"}`}
      >
        <i className="fas fa-home"></i>
      </Link>
      <Link
        to="/profile"
        className={`text-xl ${isActive("/profile") ? "text-primary" : "text-gray-300"}`}
      >
        <i className="fas fa-user"></i>
      </Link>
    </nav>
  );
}
