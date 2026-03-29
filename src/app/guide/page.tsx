import { redirect } from "next/navigation";

import AppNav from "@/components/AppNav";
import { getCurrentUser } from "@/lib/current-user";
import GuideClient from "@/app/guide/GuideClient";

export const dynamic = "force-dynamic";

export default async function GuidePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-zinc-100 pb-10">
      <AppNav username={user.displayName || user.nickname || user.username} />
      <GuideClient />
    </main>
  );
}
