import { motion } from "framer-motion";
import { ReactNode } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface FormLayoutProps {
  title: string;
  gradientWord: string;
  subtitle: string;
  children: ReactNode;
}

const FormLayout = ({ title, gradientWord, subtitle, children }: FormLayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navigation />

      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[180px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight mb-4">
              {title} <span className="text-gradient-purple">{gradientWord}</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{subtitle}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="rounded-3xl p-8 md:p-10 bg-card border border-border/50"
          >
            {children}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FormLayout;
