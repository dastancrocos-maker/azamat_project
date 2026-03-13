"use client";

export default function AnimatedBackground() {
  const logos = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="bg-animation">
      {logos.map((n) => (
        <div key={n} className={`floating-logo fl-${n}`}>
          <img src="/logo_2.png" alt="" draggable={false} />
        </div>
      ))}
    </div>
  );
}
