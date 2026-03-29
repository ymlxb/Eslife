import { redirect } from "next/navigation";

import AppNav from "@/components/AppNav";
import { getCurrentUser } from "@/lib/current-user";
import PostPublishClient from "@/app/person/postPublish/PostPublishClient";

export const dynamic = "force-dynamic";

export default async function PostPublishPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-zinc-100">
      <AppNav username={user.displayName || user.nickname || user.username} />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-4 text-2xl font-semibold">发帖记录</h1>
        <PostPublishClient />
      </div>
    </main>
  );
}
