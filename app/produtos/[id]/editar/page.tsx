import { ProductEditor } from "@/components/product-editor";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ProductEditor id={(await params).id} />;
}
