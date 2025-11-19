"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function WinnerConfetti() {
  useEffect(() => {
    // Duración de la celebración (3 segundos)
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Disparamos confeti desde la izquierda y la derecha (efecto cañones)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#1f77b4', '#2ca02c', '#7fdbff', '#aec7e8', '#d627ff', '#ff7f00', '#bcbd22'] // Colores azulados
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#1f77b4', '#2ca02c', '#7fdbff', '#aec7e8', '#d627ff', '#ff7f00', '#bcbd22'] // Colores azulados
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return null; // Este componente no renderiza HTML, solo efectos
}