import React from "react";
import { motion, useInView } from "motion/react";

const stats = [
  { label: "گیمر فعال", value: 2400, suffix: "+" },
  { label: "لابی زنده", value: 300, suffix: "+" },
  { label: "پیام در روز", value: 12000, suffix: "" },
  { label: "مسابقات ماهانه", value: 45, suffix: "" },
];

const StatItem = ({ label, value, suffix, delay }: any) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      if (start === end) return;

      let totalMiliseconds = 2000;
      let incrementTime = (totalMiliseconds / end) * 5;

      let timer = setInterval(() => {
        start += Math.ceil(end / 100);
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(start);
        }
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="flex flex-col items-center justify-center p-6"
    >
      <div className="text-4xl font-black text-white sm:text-5xl lg:text-6xl mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm font-bold text-neon-blue uppercase tracking-widest">{label}</div>
    </motion.div>
  );
};

export const PlatformStats = () => {
  return (
    <section className="py-20 border-y border-white/5 bg-white/[0.02]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <StatItem key={i} {...stat} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
};
