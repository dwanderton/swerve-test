import ReplayApp from "@/components/ReplayApp";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReplayApp id={id} />;
}
