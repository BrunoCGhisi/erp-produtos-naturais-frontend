import { Suspense } from "react";
import { SupportList } from "@/components/support-list";
import { Loading } from "@/components/feedback";
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SupportList resource="units" />
    </Suspense>
  );
}
