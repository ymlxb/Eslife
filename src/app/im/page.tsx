import { Suspense } from "react";

import ImClient from "@/app/im/ImClient";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ toUserId?: string }>;
};

export default async function ImPage({ searchParams }: Props) {
  const sp = await searchParams;
  const userId = Number(sp.toUserId);

  return (
    <Suspense fallback={<main className="p-6">加载中...</main>}>
      <ImClient initialToUserId={Number.isInteger(userId) ? userId : undefined} />
    </Suspense>
  );
}
