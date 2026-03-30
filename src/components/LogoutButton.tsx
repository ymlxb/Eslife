"use client";

import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/http";

type Props = {
  className?: string;
};

export default function LogoutButton({ className }: Props) {
  const router = useRouter();

  const onLogout = async () => {
    await apiRequest({ url: "/api/auth/logout", method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={onLogout}
      className={
        className ||
        "rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100"
      }
    >
      退出
    </button>
  );
}
