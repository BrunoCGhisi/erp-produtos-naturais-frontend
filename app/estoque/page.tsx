import { Suspense } from "react";
import { Inventory } from "@/components/inventory";
import { Loading } from "@/components/feedback";
export default function Page() { return <Suspense fallback={<Loading />}><Inventory /></Suspense>; }
