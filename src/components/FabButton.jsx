import { Link } from "react-router-dom";

export default function FabButton() {
  return (
    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 max-w-md w-full flex justify-center z-20 pointer-events-none">
      <Link
        to="/id-card"
        className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-yellow-200 text-white flex items-center justify-center text-2xl shadow-lg border-4 border-white pointer-events-auto cursor-pointer active:scale-95 transition-transform"
      >
        <i className="fas fa-id-badge"></i>
      </Link>
    </div>
  );
}
