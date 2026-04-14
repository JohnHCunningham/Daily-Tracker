/**
 * Marketing Layout
 * Wraps all public-facing pages: home, /sandler, /about, /blog, /privacy, /terms
 * The (app) and (auth) groups use their own layouts and are NOT affected by this.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
