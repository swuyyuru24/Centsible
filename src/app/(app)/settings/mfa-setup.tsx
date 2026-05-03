"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import QRCode from "qrcode";

type MfaStatus = "loading" | "disabled" | "enrolling" | "verifying" | "enabled";

export function MfaSetup() {
  const [status, setStatus] = useState<MfaStatus>("loading");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkMfaStatus();
  }, []);

  async function checkMfaStatus() {
    setStatus("loading");
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setStatus("disabled");
      return;
    }

    if (data.totp.length > 0) {
      setFactorId(data.totp[0].id);
      setStatus("enabled");
    } else {
      setStatus("disabled");
    }
  }

  async function handleEnroll() {
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Centsible",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Generate QR code from the TOTP URI
    const qr = await QRCode.toDataURL(data.totp.uri);
    setQrDataUrl(qr);
    setFactorId(data.id);
    setStatus("enrolling");
    setLoading(false);
  }

  async function handleVerify() {
    if (!factorId || verifyCode.length !== 6) return;

    setError(null);
    setLoading(true);

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError) {
      setError(challengeError.message);
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: verifyCode,
    });

    if (verifyError) {
      setError("Invalid code. Please try again.");
      setVerifyCode("");
      setLoading(false);
      return;
    }

    setStatus("enabled");
    setQrDataUrl(null);
    setVerifyCode("");
    setLoading(false);
  }

  async function handleDisable() {
    if (!factorId) return;

    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.mfa.unenroll({ factorId });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setFactorId(null);
    setStatus("disabled");
    setLoading(false);
  }

  if (status === "loading") {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Two-Factor Authentication
              {status === "enabled" ? (
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              ) : (
                <Badge variant="secondary">Disabled</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Add an extra layer of security using an authenticator app
            </CardDescription>
          </div>
          {status === "enabled" ? (
            <ShieldCheck className="h-8 w-8 text-green-600" />
          ) : (
            <ShieldOff className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {status === "disabled" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              When enabled, you&apos;ll need to enter a code from your authenticator app
              (Google Authenticator, Authy, 1Password, etc.) every time you sign in.
            </p>
            <Button onClick={handleEnroll} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Enable MFA
            </Button>
          </div>
        )}

        {status === "enrolling" && qrDataUrl && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Step 1: Scan this QR code with your authenticator app
              </p>
              <div className="flex justify-center rounded-lg border bg-white p-4">
                <img src={qrDataUrl} alt="MFA QR Code" className="h-48 w-48" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Step 2: Enter the 6-digit code from your app
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) =>
                    setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="max-w-32 text-center text-lg tracking-widest"
                />
                <Button
                  onClick={handleVerify}
                  disabled={verifyCode.length !== 6 || loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Verify
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus("disabled");
                setQrDataUrl(null);
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {status === "enabled" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your account is protected with two-factor authentication.
            </p>
            <Button variant="destructive" onClick={handleDisable} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldOff className="mr-2 h-4 w-4" />
              )}
              Disable MFA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
