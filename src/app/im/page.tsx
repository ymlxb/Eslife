import { Suspense } from "react";

import ImClient from "@/app/im/ImClient";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ toUserId?: string }>;
};

export default async function ImPage({ searchParams }: Props) {
  const sp = await searchParams;
  const userId = Number(sp.toUserId);
  const initialToUserId = Number.isInteger(userId) && userId > 0 ? userId : undefined;

  return (
    <Suspense fallback={<main className="p-6">加载中...</main>}>
      <ImClient initialToUserId={initialToUserId} />
    </Suspense>
  );
}
