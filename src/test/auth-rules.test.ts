import { describe, expect, it } from "vitest";

import { safeRedirect, signUpSchema, translateAuthError } from "@/lib/auth";

describe("auth rules", () => {
  it("rejects sign-up passwords shorter than 8 characters", () => {
    const r = signUpSchema.safeParse({ fullName: "Ana Souza", email: "ana@ex.com", password: "1234567" });
    expect(r.success).toBe(false);
  });

  it("requires a name on sign-up", () => {
    const r = signUpSchema.safeParse({ fullName: " ", email: "ana@ex.com", password: "12345678" });
    expect(r.success).toBe(false);
  });

  it("translates wrong credentials to Portuguese", () => {
    expect(translateAuthError({ code: "invalid_credentials" })).toBe("E-mail ou senha incorretos.");
    expect(translateAuthError({ message: "Invalid login credentials" })).toBe("E-mail ou senha incorretos.");
  });

  it("only redirects to same-site paths after login", () => {
    expect(safeRedirect("https://evil.com")).toBe("/dashboard");
    expect(safeRedirect("//evil.com")).toBe("/dashboard");
    expect(safeRedirect("/dashboard?x=1")).toBe("/dashboard?x=1");
  });
});
