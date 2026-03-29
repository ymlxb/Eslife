import { redirect } from "next/navigation";

import AppNav from "@/components/AppNav";
import { getCurrentUser } from "@/lib/current-user";
import BrandClient from "@/app/brand/BrandClient";

export const dynamic = "force-dynamic";

export default async function BrandPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-zinc-100 pb-10">
      <AppNav username={user.displayName || user.nickname || user.username} />
      <BrandClient />
    </main>
  );
}
