import type { QueryClient } from "@tanstack/react-query";
// All catalog queries use generated keys. Refresh every active catalog view after a
// mutation, including category/unit names on product details and relationship tabs.
export async function refreshCatalog(client: QueryClient, throwOnError = false) {
  await client.invalidateQueries({
    predicate: (query) => {
      const first = query.queryKey[0];
      return (
        typeof first === "object" &&
        first !== null &&
        "url" in first &&
        typeof first.url === "string" &&
        first.url.startsWith("/api/")
      );
    },
  }, { throwOnError });
}
