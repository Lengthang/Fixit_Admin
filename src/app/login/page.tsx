"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, auth } from "@/lib/api";
import { Button } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    setError(null);
    setLoading(true);
    try {
      await api.sendOtp(phone.trim());
      setStep("otp");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setError(null);
    setLoading(true);
    try {
      const { access_token } = await api.verifyOtp(phone.trim(), code.trim());
      auth.set(access_token);
      // The token belongs to an admin only if role === "admin"; the backend
      // gates every /admin route, so a non-admin will simply see 403s.
      router.push("/providers");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-display text-4xl font-bold text-ink">
            Fix<span className="text-brand">It</span>
          </div>
          <p className="mt-2 text-sm text-slate">Admin Console</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          {step === "phone" ? (
            <>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Phone number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                placeholder="+855..."
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-ink"
              />
              <div className="mt-4">
                <Button onClick={sendOtp} disabled={loading || !phone.trim()}>
                  {loading ? "Sending..." : "Send code"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <label className="mb-1.5 block text-sm font-semibold text-ink">
                Enter the code sent to {phone}
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verify()}
                placeholder="6-digit code"
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm tracking-widest outline-none focus:border-ink"
              />
              <div className="mt-4 flex items-center gap-2">
                <Button onClick={verify} disabled={loading || !code.trim()}>
                  {loading ? "Verifying..." : "Sign in"}
                </Button>
                <Button variant="ghost" onClick={() => setStep("phone")}>
                  Back
                </Button>
              </div>
            </>
          )}

          {error && <p className="mt-4 text-sm font-medium text-danger">{error}</p>}
        </div>
      </div>
    </div>
  );
}
