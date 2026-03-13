"use client";

export default function AnimatedBackground() {
  return (
    <div className="bg-animation">
      <div className="bg-grain" />
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
    </div>
  );
}
