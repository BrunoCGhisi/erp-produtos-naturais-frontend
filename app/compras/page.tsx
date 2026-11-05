import { Suspense } from "react";
import { PurchaseList } from "@/components/purchases";
import { Loading } from "@/components/feedback";
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PurchaseList />
    </Suspense>
  );
}
