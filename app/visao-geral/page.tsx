import { Suspense } from "react";
import { Overview } from "@/components/overview";
import { Loading } from "@/components/feedback";
export default function Page() {
  return <Suspense fallback={<Loading />}><Overview /></Suspense>;
}
