interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className = 'h-5 w-5', label }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex justify-center items-center py-24 text-blue-600 dark:text-blue-400">
      <Spinner className="h-10 w-10" label={label} />
    </div>
  );
}
