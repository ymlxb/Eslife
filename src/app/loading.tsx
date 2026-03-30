import PlantLoading from "@/components/PlantLoading";

export default function Loading() {
  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-8">
      <PlantLoading fullScreen text="绿色能量加载中..." />
    </main>
  );
}
