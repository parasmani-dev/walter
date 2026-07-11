import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function BackgroundEffects() {
  useEffect(() => {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let waveDampening = 1;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      // Very low mouse reactivity (max 12 degrees)
      targetX = (e.clientX / window.innerWidth - 0.5) * 12; 
      targetY = (e.clientY / window.innerHeight - 0.5) * -12; 
      // Dampen the wave amplitude significantly when the mouse is moving
      waveDampening = 0.2; 
    };

    const update = () => {
      // Extremely lazy lerp (0.01) for premium heavy feel
      currentX += (targetX - currentX) * 0.01;
      currentY += (targetY - currentY) * 0.01;
      
      // Slowly recover wave dampening back to 1 when mouse stops
      waveDampening += (1 - waveDampening) * 0.01;
      
      // Stronger continuous slow sine wave for idle water surface motion
      const time = Date.now() * 0.0005;
      const waveX = Math.sin(time) * (18 * waveDampening); 
      const waveY = Math.cos(time * 0.8) * (18 * waveDampening);

      document.documentElement.style.setProperty('--mouse-x', `${currentX + waveX}deg`);
      document.documentElement.style.setProperty('--mouse-y', `${currentY + waveY}deg`);
      
      animationFrameId = requestAnimationFrame(update);
    };

    window.addEventListener('mousemove', handleMouseMove);
    update(); // Start the loop

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#09090B] pointer-events-none">
      
      {/* 1. Subtle Radial Glow */}
      <div 
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(124, 58, 237, 0.15), transparent 70%)'
        }}
      />

      {/* 2. User's Flowing 3D Grid */}
      <div className="grid-background-container">
        <div className="moving-grid"></div>
      </div>

      {/* 3. Animated Vertical Scanning Lines (Barely Visible) */}
      <motion.div
        className="absolute inset-0 opacity-[0.02] w-full"
        style={{
          backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,1) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
        transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
      />

      {/* 4. Very Soft Noise Texture */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-screen pointer-events-none">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-50">
          <filter id="heroNoiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#heroNoiseFilter)"/>
        </svg>
      </div>

    </div>
  );
}
