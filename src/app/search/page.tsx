import { Suspense } from "react";

import SearchClient from "@/app/search/SearchClient";
import PlantLoading from "@/components/PlantLoading";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ name?: string; tag?: string; day?: string; order?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;

  return (
    <Suspense fallback={<main className="min-h-screen bg-zinc-100 px-6 py-8"><PlantLoading fullScreen text="正在检索绿色好物..." /></main>}>
      <SearchClient
        initialName={sp.name || ""}
        initialTag={sp.tag || ""}
        initialDay={sp.day || ""}
        initialOrder={sp.order || ""}
      />
    </Suspense>
  );
}
