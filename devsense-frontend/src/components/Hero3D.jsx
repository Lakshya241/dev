import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Hero3D() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20 - 10,
        y: (e.clientY / window.innerHeight) * 20 - 10,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const shapes = [
    { top: "10%", left: "10%", size: "300px", delay: 0, color: "from-blue-500/30 to-purple-500/30" },
    { top: "60%", right: "10%", size: "200px", delay: 0.5, color: "from-cyan-500/20 to-blue-500/20" },
    { top: "30%", right: "20%", size: "250px", delay: 1, color: "from-purple-500/25 to-pink-500/25" },
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black">
      {/* Animated background shapes */}
      {shapes.map((shape, idx) => (
        <motion.div
          key={idx}
          className={`absolute rounded-full blur-3xl bg-gradient-to-r ${shape.color}`}
          style={{
            width: shape.size,
            height: shape.size,
            top: shape.top,
            left: shape.left,
            right: shape.right,
          }}
          animate={{
            x: mousePosition.x,
            y: mousePosition.y,
          }}
          transition={{ type: "spring", stiffness: 50, damping: 30 }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
        />
      ))}

      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_70%)]" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center px-6">
        <motion.div
          className="text-center max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.h1
            className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            DevSense AI
          </motion.h1>

          <motion.p
            className="text-2xl md:text-3xl text-gray-300 mb-8 font-light leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Context-aware intelligence for
            <span className="block text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text mt-2">
              real-world codebases
            </span>
          </motion.p>

          <motion.div
            className="max-w-2xl mx-auto mb-12 text-gray-400 text-lg leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            DevSense ingests full project codebases, folder structures, logs, and dependencies to provide project-specific debugging, impact analysis, and onboarding assistance. We transform your codebase into an intelligent knowledge base.
          </motion.div>

          <motion.button
            onClick={() => navigate('/app')}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg relative overflow-hidden group cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <span className="relative z-10">Enter Platform</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 shadow-glow-blue opacity-0 group-hover:opacity-100 transition-all" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}