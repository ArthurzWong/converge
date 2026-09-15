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
    <header className="no-print sticky top-0 z-20 border-b border-ink/5 bg-paper/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          {right ?? (
            <>
              <Link href="/story/demo-sme-sales" className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink/60 transition hover:bg-ink/5 hover:text-ink sm:inline-flex">
                Demo
              </Link>
              <a
                href="https://github.com/ArthurzWong/converge"
                target="_blank"
                rel="noreferrer"
                className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink/60 transition hover:bg-ink/5 hover:text-ink sm:inline-flex"
              >
                GitHub
              </a>
              <Link href="/new" className="btn-primary !py-2">
                New story
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
