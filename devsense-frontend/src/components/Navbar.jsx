import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            D
          </motion.div>
          <span className="hidden sm:inline font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            DevSense
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-gray-300 hover:text-white transition-colors text-sm"
          >
            Home
          </Link>
          <Link
            to="/app"
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-glow-blue transition-all duration-300 text-sm font-medium"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}