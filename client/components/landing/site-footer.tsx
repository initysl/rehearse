import Link from "next/link";

export const SiteFooter = () => {
  return (
    <footer className="mt-8 border-t border-white/10 pt-4 text-xs text-white/55 sm:flex sm:items-center sm:justify-between sm:text-sm">
      <p>Copyright {new Date().getFullYear()} Rehearse. All rights reserved.</p>
      <div className="mt-2 flex items-center gap-4 sm:mt-0">
        <Link className="hover:text-white" href="/terms">
          Terms
        </Link>
        <Link className="hover:text-white" href="/privacy">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
};
