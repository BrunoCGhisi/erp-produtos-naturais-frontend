import { ReceiptRecord } from "@/components/receipts";
export default async function Page({ params }: { params: Promise<{ id:string }> }) { const { id } = await params; return <ReceiptRecord id={id} edit />; }
