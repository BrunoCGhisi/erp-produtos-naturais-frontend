import { Suspense } from "react";
import { SaleList } from "@/components/sales";
import { Loading } from "@/components/feedback";
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SaleList />
    </Suspense>
  );
}
