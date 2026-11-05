import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
afterEach(cleanup);

// Model the server-provided, credential-free environment namespace.
import { beforeEach } from "vitest";
beforeEach(() => {
  localStorage.clear();
  document.head.innerHTML = '<meta name="recovery-environment" content="test-backend">';
});
