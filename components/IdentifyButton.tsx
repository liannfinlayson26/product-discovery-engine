"use client";

interface Props {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}

export default function IdentifyButton({ onClick, disabled, loading }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-base font-medium text-paper shadow-[0_14px_30px_-14px_rgba(28,24,20,0.6)] transition-all duration-200 hover:bg-accent hover:shadow-[0_16px_34px_-14px_rgba(182,74,43,0.6)] disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-muted disabled:shadow-none"
    >
      {loading ? (
        <>
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3.5"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v3.5A4.5 4.5 0 007.5 12H4z"
            />
          </svg>
          Identifying…
        </>
      ) : (
        <>
          Identify product
          <svg
            className="h-4 w-4 transition-transform duration-200 group-enabled:group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </>
      )}
    </button>
  );
}
