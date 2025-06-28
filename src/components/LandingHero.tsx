import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, MessageCircle, Lock, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const FeatureIcon = ({ icon: Icon, delay }: { icon: any; delay: number }) => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ delay, duration: 0.5, type: "spring", stiffness: 100 }}
    className="relative"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-blue-500 rounded-full blur-xl opacity-20 animate-pulse-slow" />
    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-blue-500 text-white shadow-2xl">
      <Icon className="h-8 w-8" />
    </div>
  </motion.div>
);

export function LandingHero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-slate-100 to-gray-100 dark:from-slate-900 dark:via-gray-900 dark:to-slate-800" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-15 blur-3xl animate-float" />
        <div
          className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-15 blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-20 left-1/4 h-40 w-40 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-10 blur-2xl animate-pulse-slow" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm border border-white/20 px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <Shield className="h-4 w-4 text-brand-500" />
            End-to-End Encrypted
          </motion.div>

          {/* Main heading */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold tracking-tight"
            >
              <span className="gradient-text">Private</span>
              <br />
              <span className="text-gray-900 dark:text-white">
                Chat Redefined
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
            >
              Experience truly private conversations with auto-deleting
              messages, encrypted calls, and disappearing media. Your privacy,
              your way.
            </motion.p>
          </div>

          {/* Feature icons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex justify-center items-center gap-8 py-8"
          >
            <FeatureIcon icon={MessageCircle} delay={0.9} />
            <FeatureIcon icon={Lock} delay={1.0} />
            <FeatureIcon icon={Zap} delay={1.1} />
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="pt-4"
          >
            <Button
              size="lg"
              asChild
              className="relative h-14 px-8 text-lg font-semibold bg-gradient-to-r from-brand-500 to-blue-500 hover:from-brand-600 hover:to-blue-600 text-white border-0 shadow-2xl hover:shadow-brand-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <Link to="/auth">
                <span className="relative z-10">Start Chatting Securely</span>
                <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-blue-600 rounded-md blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="pt-12 space-y-4"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Trusted privacy features
            </p>
            <div className="flex justify-center items-center gap-8 text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Zero Data Storage
              </span>
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Auto-Delete Messages
              </span>
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                End-to-End Encrypted
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
