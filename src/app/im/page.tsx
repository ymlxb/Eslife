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
    <Suspense fallback={<main className="min-h-screen bg-[#f4efe6] p-6 text-[#6f6257]">加载中...</main>}>
      <ImClient initialToUserId={initialToUserId} />
    </Suspense>
  );
}
