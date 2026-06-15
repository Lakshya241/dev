import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Zap,
  MessageSquare,
  Bug,
  GitBranch,
  Users,
  BookOpen,
  ArrowRight,
  Database,
  Cloud,
  Server,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Hero3D from "../components/Hero3D";
import FeatureCard from "../components/FeatureCard";

const features = [
  {
    icon: Database,
    title: "Project Ingestion & Analysis",
    description: "Automatically scan and understand your entire codebase structure and architecture",
  },
  {
    icon: MessageSquare,
    title: "Context-Aware Q&A",
    description: "Ask intelligent questions about your code with full project context",
  },
  {
    icon: Bug,
    title: "Intelligent Debugging Support",
    description: "Get AI-powered insights for debugging complex issues faster",
  },
  {
    icon: GitBranch,
    title: "Dependency Mapping",
    description: "Visualize and understand all project dependencies and their relationships",
  },
  {
    icon: Users,
    title: "New Developer Onboarding",
    description: "Accelerate team onboarding with automated codebase documentation",
  },
  {
    icon: BookOpen,
    title: "Knowledge Retention",
    description: "Build institutional knowledge that grows with your codebase",
  },
];

const processSteps = [
  "Upload Project",
  "Parse Code",
  "Analyze Dependencies",
  "Generate Embeddings",
  "AI Reasoning",
  "Context-Aware Response",
];

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen">
        <Hero3D />
      </section>

      {/* Features Section */}
      <section className="relative py-32 px-6 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">
              Everything you need to understand, debug, and optimize your codebase
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="relative py-32 px-6 bg-gradient-to-b from-black to-slate-900 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Modern Architecture
            </h2>
            <p className="text-gray-400 text-xl">
              Built on cutting-edge cloud infrastructure for scale and reliability
            </p>
          </motion.div>

          <motion.div
            className="p-8 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 overflow-x-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between gap-4 min-w-max md:min-w-full">
              <ArchitectureBox icon={Cloud} label="Frontend" />
              <ArrowRight className="w-6 h-6 text-blue-400 flex-shrink-0" />
              <ArchitectureBox icon={Server} label="Backend API" />
              <ArrowRight className="w-6 h-6 text-blue-400 flex-shrink-0" />
              <div className="flex gap-2 flex-shrink-0">
                <ArchitectureBox icon={Database} label="AWS S3" small />
                <ArchitectureBox icon={Zap} label="OpenSearch" small />
                <ArchitectureBox icon={Brain} label="Bedrock" small />
                <ArchitectureBox icon={Database} label="DynamoDB" small />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process Flow Section */}
      <section className="relative py-32 px-6 bg-black overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              How It Works
            </h2>
          </motion.div>

          <div className="overflow-x-auto pb-6">
            <div className="flex gap-4 md:gap-2 min-w-max md:min-w-full justify-center">
              {processSteps.map((step, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <ProcessStep step={step} />
                  {idx < processSteps.length - 1 && (
                    <motion.div
                      className="hidden md:block w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      transition={{ duration: 0.6, delay: idx * 0.1 + 0.2 }}
                      style={{ originX: 0 }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6 bg-gradient-to-b from-black via-slate-900 to-black overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-gradient-to-b from-blue-500/10 to-transparent blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Ready to Transform Your Codebase?
            </h2>
            <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto">
              Join developers who are using DevSense to write better code, faster.
            </p>
            <motion.button
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg relative overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10">Start Free Trial</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-12 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Follow</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition">Discord</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; 2026 DevSense AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ArchitectureBox({ icon: Icon, label, small = false }) {
  return (
    <motion.div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm ${small ? "flex-col px-3 py-3" : ""}`}
      whileHover={{ y: -4 }}
    >
      <Icon className={`${small ? "w-4 h-4" : "w-5 h-5"} text-blue-400`} />
      <span className={`text-white font-medium ${small ? "text-xs text-center" : "text-sm"}`}>{label}</span>
    </motion.div>
  );
}

function ProcessStep({ step }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-3"
      whileHover={{ scale: 1.05 }}
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <Zap className="w-6 h-6 text-white" />
      </div>
      <p className="text-sm font-medium text-gray-300 text-center max-w-[100px]">{step}</p>
    </motion.div>
  );
}

// Icon for architecture (reusing from lucide)
function Brain(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 3a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h3z" />
      <path d="M15 3a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h3z" />
      <path d="M9 9v12a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V9" />
      <path d="M12 12v3" />
      <path d="M9 18h6" />
    </svg>
  );
}
