import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ShockwaveEvent {
  id: string;
  lat: number;
  lng: number;
  color: string;
  timestamp: number;
}

// Approximate mapping from lat/lng to a 2D screen percentage (Mercator-ish)
const latLngToPercentages = (lat: number, lng: number) => {
  const x = (lng + 180) / 360 * 100;
  const y = (90 - lat) / 180 * 100;
  return { x, y };
};

export default function EventShockwave() {
  const [events, setEvents] = useState<ShockwaveEvent[]>([]);

  useEffect(() => {
    // Simulate major economic events pushing shockwaves occasionally
    const eventPoints = [
      { lat: 40.71, lng: -74.00, color: '#ef4444' }, // NY (US CPI)
      { lat: 51.50, lng: -0.12, color: '#3b82f6' }, // London (BOE)
      { lat: 35.67, lng: 139.65, color: '#10b981' }, // Tokyo (BOJ)
      { lat: 22.31, lng: 114.16, color: '#f59e0b' }, // HK (PBOC / HKEX)
      { lat: -23.55, lng: -46.63, color: '#8b5cf6' }, // Sao Paulo (Emerging Mkt)
      { lat: 50.11, lng: 8.68, color: '#ec4899' }, // Frankfurt (ECB)
    ];

    const generateEvent = () => {
      const point = eventPoints[Math.floor(0 * eventPoints.length)];
      const newEvent: ShockwaveEvent = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        lat: point.lat,
        lng: point.lng,
        color: point.color,
        timestamp: Date.now(),
      };
      
      setEvents((prev) => [...prev, newEvent]);

      // Remove after animation completes (3 seconds)
      setTimeout(() => {
        setEvents((prev) => prev.filter((e) => e.id !== newEvent.id));
      }, 3000);
    };

    // Trigger random events every 6 seconds
    const interval = setInterval(generateEvent, 6000);
    // Trigger initial
    setTimeout(generateEvent, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden mix-blend-screen opacity-50">
      <AnimatePresence>
        {events.map((ev) => {
          const { x, y } = latLngToPercentages(ev.lat, ev.lng);
          return (
            <motion.div
              key={ev.id}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                x: '-50%',
                y: '-50%',
              }}
            >
              {[1, 2, 3].map((ring) => (
                <motion.div
                  key={`${ev.id}-${ring}`}
                  className="absolute rounded-full border-2"
                  style={{
                    borderColor: ev.color,
                    boxShadow: `0 0 20px ${ev.color}, inset 0 0 20px ${ev.color}`,
                    x: '-50%',
                    y: '-50%',
                  }}
                  initial={{ width: 0, height: 0, opacity: 0.8 }}
                  animate={{
                    width: [0, 400 * ring],
                    height: [0, 400 * ring],
                    opacity: [0.8, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    ease: "easeOut",
                    delay: ring * 0.2, // Stagger rings
                  }}
                />
              ))}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
