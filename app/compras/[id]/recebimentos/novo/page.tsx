import { NewReceipt } from "@/components/receipts";
export default async function Page({ params }: { params: Promise<{ id:string }> }) { const { id } = await params; return <NewReceipt purchaseId={id} />; }
