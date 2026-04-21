import confetti from "canvas-confetti";

export function celebrate() {
  const colors = ["#6366f1", "#8b5cf6", "#a78bfa", "#22d3ee", "#f472b6"];
  const end = Date.now() + 900;

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 65,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 65,
      origin: { x: 1, y: 0.7 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  confetti({
    particleCount: 80,
    spread: 100,
    startVelocity: 40,
    origin: { y: 0.6 },
    colors,
    scalar: 1.1,
  });
}
