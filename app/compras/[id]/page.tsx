import { PurchaseRecord } from "@/components/purchases";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PurchaseRecord id={id} />;
}
