import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
        <path d="M3 5 L13 13 L3 21" fill="none" stroke="#1d2433" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 13 L23 13" fill="none" stroke="#0f766e" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="23" cy="13" r="2.2" fill="#0f766e" />
      </svg>
      <span className="text-sm font-semibold tracking-[0.18em]">CONVERGE</span>
    </Link>
  );
}

export default function SiteHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="no-print sticky top-0 z-20 border-b border-ink/5 bg-paper/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="flex items-center gap-2">
          {right ?? (
            <Link href="/new" className="btn-primary !py-2">
              New story
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
