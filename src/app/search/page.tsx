import { Suspense } from "react";

import SearchClient from "@/app/search/SearchClient";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ name?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;

  return (
    <Suspense fallback={<main className="p-6">加载中...</main>}>
      <SearchClient initialName={sp.name || ""} />
    </Suspense>
  );
}
