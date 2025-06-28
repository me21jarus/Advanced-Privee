import { motion } from "framer-motion";
import {
  Shield,
  Clock,
  Video,
  Image,
  Users,
  Eye,
  Timer,
  Lock,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "End-to-End Encryption",
    description:
      "Military-grade encryption ensures your conversations stay completely private",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Timer,
    title: "Auto-Delete Messages",
    description:
      "Messages automatically disappear after 2 minutes - no traces left behind",
    color: "from-red-500 to-pink-500",
  },
  {
    icon: Video,
    title: "Private Video Calls",
    description:
      "High-quality encrypted video calls with no recording or logging",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Eye,
    title: "View-Once Media",
    description:
      "Share photos that disappear after being viewed once - true ephemeral sharing",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: Users,
    title: "1-to-1 Rooms Only",
    description:
      "Intimate conversations with just one other person - maximum privacy",
    color: "from-orange-500 to-yellow-500",
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description:
      "Seamless experience across all devices with touch-friendly controls",
    color: "from-indigo-500 to-purple-500",
  },
];

const FeatureCard = ({ feature, index }: { feature: any; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.6 }}
    viewport={{ once: true }}
    className="group relative"
  >
    <div className="relative h-full p-8 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300">
      {/* Icon */}
      <div className="relative mb-6">
        <div
          className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300`}
        />
        <div
          className={`relative flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-r ${feature.color} text-white shadow-lg`}
        >
          <feature.icon className="h-8 w-8" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
        {feature.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
        {feature.description}
      </p>

      {/* Hover effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  </motion.div>
);

export function LandingFeatures() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-50/30 to-transparent dark:via-brand-950/30" />

      <div className="relative container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Privacy-First <span className="gradient-text">Features</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Every feature is designed with your privacy and security in mind. No
            compromises, no data collection, no traces.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500/10 to-blue-500/10 border border-brand-500/20 px-6 py-3 text-sm font-medium text-brand-600 dark:text-brand-400">
            <Lock className="h-4 w-4" />
            Your conversations remain truly private
          </div>
        </motion.div>
      </div>
    </section>
  );
}
