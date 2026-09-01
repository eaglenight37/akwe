export function CowrieMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <ellipse cx="16" cy="16" rx="11" ry="13" stroke="currentColor" strokeWidth="2" />
      <path
        d="M16 8c-2.2 3.2-3.2 6.4-3.2 8s1 4.8 3.2 8c2.2-3.2 3.2-6.4 3.2-8s-1-4.8-3.2-8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M10 13.5h3.2M18.8 13.5H22M10 18.5h3.2M18.8 18.5H22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
