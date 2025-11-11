import React, { useEffect, useRef } from 'react';

const Hourglass = ({ progress, isRunning, themeColor, darkMode }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const bottomSandRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Sand particle class
    class SandParticle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedY = Math.random() * 0.5 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.settled = false;
      }

      update(bottomSandHeight) {
        if (!this.settled) {
          // Falling through the narrow middle
          if (this.y < height * 0.5 - 10) {
            // Top bulb - fall toward center
            this.x += (width / 2 - this.x) * 0.02;
            this.y += this.speedY;
          } else if (this.y < height * 0.5 + 10) {
            // Narrow middle - faster fall
            this.x = width / 2 + this.speedX;
            this.y += this.speedY * 2;
          } else {
            // Bottom bulb - spread out
            this.speedX += (Math.random() - 0.5) * 0.1;
            this.y += this.speedY;

            // Check if settled on bottom sand pile
            const bottomLevel = height - bottomSandHeight;
            if (this.y >= bottomLevel - 2) {
              this.y = bottomLevel - 2;
              this.settled = true;
            }
          }

          // Boundaries
          if (this.x < width * 0.2) this.x = width * 0.2;
          if (this.x > width * 0.8) this.x = width * 0.8;
        }
      }

      draw(ctx, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Calculate how much sand should be in bottom based on progress
    const targetBottomSand = height * 0.35 * progress;
    bottomSandRef.current = targetBottomSand;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw bottom sand pile (accumulated sand)
      if (bottomSandRef.current > 0) {
        const gradient = ctx.createLinearGradient(0, height - bottomSandRef.current, 0, height);
        gradient.addColorStop(0, themeColor + '80');
        gradient.addColorStop(1, themeColor);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(
          width / 2,
          height - bottomSandRef.current / 2,
          width * 0.25,
          bottomSandRef.current / 2,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Only animate falling particles when timer is running
      if (isRunning) {
        // Add new particles at top
        if (Math.random() > 0.3 && progress < 1) {
          const newParticle = new SandParticle(
            width / 2 + (Math.random() - 0.5) * width * 0.2,
            height * 0.15
          );
          particlesRef.current.push(newParticle);
        }

        // Update and draw particles
        particlesRef.current = particlesRef.current.filter(particle => {
          particle.update(bottomSandRef.current);
          particle.draw(ctx, themeColor);

          // Remove particles that are settled and buried
          return particle.y < height;
        });

        // Limit particle count for performance
        if (particlesRef.current.length > 150) {
          particlesRef.current = particlesRef.current.slice(-150);
        }
      } else {
        // Draw existing particles without updating when paused
        particlesRef.current.forEach(particle => {
          particle.draw(ctx, themeColor);
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, progress, themeColor]);

  // Reset particles when timer resets
  useEffect(() => {
    if (progress === 0) {
      particlesRef.current = [];
      bottomSandRef.current = 0;
    }
  }, [progress]);

  return (
    <div className="relative w-48 h-64 mx-auto">
      {/* SVG Hourglass Frame */}
      <svg
        viewBox="0 0 200 280"
        className="absolute inset-0 w-full h-full"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
      >
        <defs>
          <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: darkMode ? '#ffffff' : '#f0f0f0', stopOpacity: 0.3 }} />
            <stop offset="50%" style={{ stopColor: darkMode ? '#ffffff' : '#ffffff', stopOpacity: 0.1 }} />
            <stop offset="100%" style={{ stopColor: darkMode ? '#cccccc' : '#e0e0e0', stopOpacity: 0.3 }} />
          </linearGradient>
          <linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
            <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0.4 }} />
            <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        {/* Top wooden frame */}
        <rect x="30" y="10" width="140" height="15" rx="3" fill={darkMode ? '#6B4423' : '#8B5A2B'} />
        <rect x="35" y="12" width="130" height="3" rx="1" fill={darkMode ? '#8B6B47' : '#A0826D'} />

        {/* Top glass bulb */}
        <path
          d="M 50 25 Q 50 25, 50 95 Q 50 125, 100 140 Q 150 125, 150 95 Q 150 25, 150 25 Z"
          fill="url(#glassGradient)"
          stroke={darkMode ? '#888' : '#999'}
          strokeWidth="2"
          opacity="0.6"
        />

        {/* Glass highlight on top bulb */}
        <ellipse
          cx="75"
          cy="60"
          rx="15"
          ry="25"
          fill="url(#glassShine)"
          opacity="0.5"
        />

        {/* Bottom glass bulb */}
        <path
          d="M 50 140 Q 50 155, 50 225 Q 50 225, 50 225 Q 50 225, 150 225 Q 150 225, 150 225 Q 150 155, 150 140 Q 100 155, 100 140 Z"
          fill="url(#glassGradient)"
          stroke={darkMode ? '#888' : '#999'}
          strokeWidth="2"
          opacity="0.6"
        />

        {/* Glass highlight on bottom bulb */}
        <ellipse
          cx="75"
          cy="180"
          rx="15"
          ry="25"
          fill="url(#glassShine)"
          opacity="0.5"
        />

        {/* Bottom wooden frame */}
        <rect x="30" y="225" width="140" height="15" rx="3" fill={darkMode ? '#6B4423' : '#8B5A2B'} />
        <rect x="35" y="227" width="130" height="3" rx="1" fill={darkMode ? '#8B6B47' : '#A0826D'} />

        {/* Decorative details */}
        <circle cx="40" cy="17.5" r="3" fill={darkMode ? '#4A4A4A' : '#666'} />
        <circle cx="160" cy="17.5" r="3" fill={darkMode ? '#4A4A4A' : '#666'} />
        <circle cx="40" cy="232.5" r="3" fill={darkMode ? '#4A4A4A' : '#666'} />
        <circle cx="160" cy="232.5" r="3" fill={darkMode ? '#4A4A4A' : '#666'} />
      </svg>

      {/* Canvas for sand particles */}
      <canvas
        ref={canvasRef}
        width={200}
        height={280}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />

      {/* Glow effect when running */}
      {isRunning && (
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-20 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${themeColor} 0%, transparent 70%)`,
          }}
        />
      )}
    </div>
  );
};

export default Hourglass;
