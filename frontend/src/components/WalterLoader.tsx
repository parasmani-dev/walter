import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WalterLoaderProps {
  onComplete: () => void;
}

export default function WalterLoader({ onComplete }: WalterLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'complete' | 'exiting'>('loading');
  const reqRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  
  // Progress duration
  const DURATION = 3200;

  // Easing function (custom easeInOutCubic with slight fast start/finish)
  const easeProgress = (t: number) => {
    // 0-20% fast, 20-70% slower, 70-95% slightly slower, 95-100% quick finish
    // We can use a bezier or a piecewise curve, but standard easeInOut works well enough for general purpose if tweaked.
    // Let's implement a piecewise curve to perfectly match the spec:
    if (t < 0.2) return t * 1.5; // fast start
    if (t < 0.7) return 0.3 + (t - 0.2) * 0.8; // slower
    if (t < 0.95) return 0.7 + (t - 0.7) * 0.6; // slightly slower
    return 0.85 + (t - 0.95) * 3; // quick finish
  };

  useEffect(() => {
    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const elapsed = time - startTimeRef.current;
      
      let rawT = Math.min(elapsed / DURATION, 1);
      
      // Apply easing
      let eased = easeProgress(rawT);
      if (eased > 1) eased = 1;
      
      setProgress(eased * 100);

      if (rawT < 1) {
        reqRef.current = requestAnimationFrame(animate);
      } else {
        setPhase('complete');
        setTimeout(() => {
          setPhase('exiting');
          setTimeout(() => onComplete(), 500); // 500ms fade out
        }, 400); // Pause at 100%
      }
    };

    // Delay start by 200ms
    const delayTimer = setTimeout(() => {
      reqRef.current = requestAnimationFrame(animate);
    }, 200);

    return () => {
      clearTimeout(delayTimer);
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [onComplete]);

  // Particles
  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage of width
      size: Math.floor(Math.random() * 3) + 2, // 2px, 3px, 4px
      duration: Math.random() * 4 + 3, // 3-7s
      delay: Math.random() * 5, // 0-5s
      opacity: Math.random() * 0.2 + 0.1, // 0.1-0.3
    }));
  }, []);

  // Text mapping
  const getProgressText = (p: number) => {
    if (p < 30) return "Initializing Walter";
    if (p < 60) return "Scanning Runtime";
    if (p < 90) return "Loading Intelligence";
    return "Walter Ready";
  };

  // Liquid height based on progress (svg y coordinates: 0 is top, 200 is bottom)
  // Progress 0 = y:200. Progress 100 = y:0
  const liquidY = 200 - (progress * 2);

  return (
    <AnimatePresence>
      {phase !== 'exiting' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="fixed inset-0 z-[9999] bg-[#090909] flex flex-col items-center justify-center overflow-hidden pointer-events-none"
        >
          {/* Inline SVG Noise Texture */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-screen pointer-events-none">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-50">
              <filter id="noiseFilter">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
              </filter>
              <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
            </svg>
          </div>
          
          <motion.div 
            className="relative flex flex-col items-center"
            animate={phase === 'complete' ? { scale: [1, 1.02, 1], transition: { duration: 0.4 } } : {}}
          >
            {/* SVG Mask Container */}
            <div className="relative w-[95vw] md:w-[85vw] max-w-[1600px] aspect-[4/1] flex items-center justify-center">
              
              <svg width="100%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 overflow-visible">
                <defs>
                  <mask id="walterTextMask">
                    {/* The white text is what will be visible of the liquid */}
                    <text 
                      x="50%" 
                      y="50%" 
                      dominantBaseline="middle" 
                      textAnchor="middle" 
                      fill="white" 
                      fontSize="170"
                      className="font-[Inter,Geist,sans-serif] font-black tracking-tight"
                    >
                      Walter
                    </text>
                  </mask>
                  
                  {/* Glow filter */}
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur1" />
                    <feGaussianBlur stdDeviation="15" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur2" />
                      <feMergeNode in="blur1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Base Empty Text (Dark) */}
                <text 
                  x="50%" 
                  y="50%" 
                  dominantBaseline="middle" 
                  textAnchor="middle" 
                  fill="#3A3A3A" 
                  fontSize="170"
                  className="font-[Inter,Geist,sans-serif] font-black tracking-tight"
                >
                  Walter
                </text>

                {/* Liquid layer clipped by the mask */}
                <g mask="url(#walterTextMask)">
                  {/* Liquid background fill */}
                  <rect x="0" y={liquidY} width="100%" height="200" fill="#FFFFFF" 
                        filter={phase === 'complete' ? "url(#glow)" : undefined} />
                  
                  {/* Wave 1 */}
                  {phase === 'loading' && (
                    <motion.path 
                      fill="rgba(255,255,255,0.7)"
                      d={`M0,${liquidY} Q200,${liquidY - 25} 400,${liquidY} T800,${liquidY} T1200,${liquidY} T1600,${liquidY} V400 H0 Z`}
                      animate={{ x: [0, -800] }}
                      transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                    />
                  )}
                  {/* Wave 2 */}
                  {phase === 'loading' && (
                    <motion.path 
                      fill="rgba(255,255,255,0.4)"
                      d={`M0,${liquidY} Q200,${liquidY + 30} 400,${liquidY} T800,${liquidY} T1200,${liquidY} T1600,${liquidY} V400 H0 Z`}
                      animate={{ x: [-800, 0] }}
                      transition={{ repeat: Infinity, duration: 9, ease: "linear" }}
                    />
                  )}

                  {/* Particles */}
                  {particles.map((p) => (
                    <motion.circle
                      key={p.id}
                      cx={`${p.x}%`}
                      cy="100%"
                      r={p.size}
                      fill="white"
                      initial={{ opacity: 0, y: 0 }}
                      animate={{ 
                        opacity: [0, p.opacity, 0],
                        y: [0, -200]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: p.duration,
                        delay: p.delay,
                        ease: "linear"
                      }}
                    />
                  ))}

                  {/* Scan Line */}
                  {phase === 'loading' && (
                    <motion.rect
                      x="0"
                      width="100%"
                      height="2"
                      fill="white"
                      style={{ mixBlendMode: 'screen', filter: 'blur(4px)', opacity: 0.25 }}
                      initial={{ y: 0 }}
                      animate={{ y: 200 }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                    />
                  )}
                </g>
                
                {/* 100% Glow Pulse Overlay */}
                {phase === 'complete' && (
                  <motion.text 
                    x="50%" 
                    y="50%" 
                    dominantBaseline="middle" 
                    textAnchor="middle" 
                    fill="#FFFFFF" 
                    fontSize="170"
                    className="font-[Inter,Geist,sans-serif] font-black tracking-tight"
                    initial={{ textShadow: "0 0 0px rgba(255,255,255,0)" }}
                    animate={{ textShadow: ["0 0 12px rgba(255,255,255,0.4)", "0 0 30px rgba(255,255,255,0.8)", "0 0 12px rgba(255,255,255,0)"] }}
                    transition={{ duration: 0.18 }}
                  >
                    Walter
                  </motion.text>
                )}
              </svg>
            </div>

            {/* Progress Text */}
            <motion.div 
              className="mt-4 flex items-center justify-between w-64 text-sm font-mono tracking-widest text-white/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'complete' ? 0 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <span className="uppercase">{getProgressText(progress)}</span>
              <span>{Math.floor(progress)}%</span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
