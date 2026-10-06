import Link from "next/link";
import { DayloraIcon } from "@/components/daylora/DayloraIcons";

/** Unknown product (design 03 "not found"). */
export default function ProductNotFound() {
  return (
    <main id="main" className="pdp">
      <div className="daylora-container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
        </nav>
        <div className="pdp-grid">
          <div className="nf-page">
            <span className="empty-ic">
              <DayloraIcon name="search" />
            </span>
            <h1>We can&apos;t find that product</h1>
            <p>It may have sold out or the link may be out of date. Try searching, or browse all departments.</p>
            <Link href="/catalog" className="btn btn-primary">
              Browse all departments
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
