"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const knownRoutes = new Set([
  "/login",
  "/home",
  "/brand",
  "/community",
  "/about",
  "/trade",
  "/guide",
  "/editMall",
  "/mall",
  "/search",
  "/im",
  "/ai",
  "/carbon",
  "/person",
]);

export default function LegacyAppFrame() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hashPath = useMemo(() => {
    const query = searchParams.toString();
    const path = pathname || "/login";

    if (!knownRoutes.has(path) && !path.startsWith("/detail/") && !path.startsWith("/person/")) {
      return "/login";
    }

    return query ? `${path}?${query}` : path;
  }, [pathname, searchParams]);

  return (
    <iframe
      title="legacy-react-app"
      src={`/legacy/index.html#${hashPath}`}
      style={{ width: "100%", height: "100vh", border: 0, display: "block" }}
    />
  );
}
