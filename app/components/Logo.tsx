"use client";

export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="logo-animated flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5851fa" />
            <stop offset="100%" stopColor="#0c84f3" />
          </linearGradient>
        </defs>
        {/* Outer hexagon */}
        <path
          d="M20 2L36.66 11V29L20 38L3.34 29V11L20 2Z"
          stroke="url(#logoGrad)"
          strokeWidth="2"
          fill="none"
        />
        {/* Inner diamond */}
        <path
          d="M20 8L30 20L20 32L10 20L20 8Z"
          fill="url(#logoGrad)"
          opacity="0.12"
        />
        <path
          d="M20 8L30 20L20 32L10 20L20 8Z"
          stroke="url(#logoGrad)"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Center dot */}
        <circle cx="20" cy="20" r="3" fill="url(#logoGrad)" />
        {/* Data lines */}
        <line x1="20" y1="14" x2="20" y2="17" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="23" x2="20" y2="26" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="20" x2="17" y2="20" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="23" y1="20" x2="26" y2="20" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div className="flex flex-col">
        <span
          className="font-bold text-sm tracking-tight leading-none"
          style={{ color: "#ffffff" }}
        >
          CROCOS
        </span>
        <span
          className="text-[9px] tracking-widest uppercase leading-tight mt-0.5"
          style={{ color: "#8b8d9c" }}
        >
          Estimator
        </span>
      </div>
    </div>
  );
}
