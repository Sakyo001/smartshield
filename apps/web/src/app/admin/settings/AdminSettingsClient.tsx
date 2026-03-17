"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@lib/supabase";

type SettingsState = {
  detectionSensitivity: number;
  warningThreshold: number;
  phishingThreshold: number;
  realtimeMonitoring: boolean;
  communityReports: boolean;
  dailySummaryEmail: boolean;
};

const STORAGE_KEY = "smartshield-admin-settings-v1";

const defaultSettings: SettingsState = {
  detectionSensitivity: 78,
  warningThreshold: 45,
  phishingThreshold: 72,
  realtimeMonitoring: true,
  communityReports: true,
  dailySummaryEmail: false,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function AdminSettingsClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user?.email) {
          router.push("/admin/login");
          return;
        }

        const { data: adminUser, error: adminError } = await supabase
          .from("admin_users")
          .select("email")
          .eq("email", user.email)
          .maybeSingle();

        if (adminError || !adminUser?.email) {
          router.push("/admin/login");
          return;
        }

        setAdminEmail(adminUser.email);
      } catch (err) {
        console.error("Error checking admin settings access:", err);
        router.push("/admin/login");
        return;
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      setSettings((prev) => ({
        ...prev,
        ...parsed,
      }));
    } catch (err) {
      console.warn("Unable to restore admin settings:", err);
    }
  }, []);

  const riskLabel = useMemo(() => {
    if (settings.detectionSensitivity >= 75) return "High sensitivity";
    if (settings.detectionSensitivity >= 50) return "Balanced";
    return "Low sensitivity";
  }, [settings.detectionSensitivity]);

  const saveSettings = async () => {
    setSaving(true);
    setSavedNotice("");
    try {
      const normalized: SettingsState = {
        ...settings,
        warningThreshold: clamp(settings.warningThreshold, 10, 85),
        phishingThreshold: clamp(settings.phishingThreshold, 20, 95),
        detectionSensitivity: clamp(settings.detectionSensitivity, 0, 100),
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      setSettings(normalized);
      setSavedNotice("Settings saved successfully.");
    } catch (err) {
      console.error("Unable to save settings:", err);
      setSavedNotice("Unable to save settings. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-950 to-black text-gray-100">
      <header className="border-b border-gray-800/50 bg-gray-900/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src="/images/light-logo.png"
                alt="SmartShield"
                fill
                sizes="40px"
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-white font-semibold">Admin Settings</h1>
              <p className="text-xs text-gray-400">Tune dashboard behavior and detection policy</p>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-gray-400">
            Admin: <span className="text-white font-medium">{adminEmail}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/admin/dashboard" className="text-sm text-gray-300 hover:text-white underline underline-offset-4">
            Back to Dashboard
          </Link>
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="rounded-lg border border-[#6B73FF]/40 bg-[#6B73FF]/20 px-4 py-2 text-sm font-medium text-white hover:bg-[#6B73FF]/30 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {savedNotice && (
          <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
            {savedNotice}
          </div>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-gray-800 bg-black/30 p-5 space-y-5">
            <h2 className="text-white font-semibold">Threat Detection Controls</h2>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <label htmlFor="sensitivity" className="text-gray-300">Detection sensitivity</label>
                <span className="text-blue-300">{settings.detectionSensitivity}% · {riskLabel}</span>
              </div>
              <input
                id="sensitivity"
                type="range"
                min={0}
                max={100}
                value={settings.detectionSensitivity}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, detectionSensitivity: Number(e.target.value) }))
                }
                className="w-full accent-[#6B73FF]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <label htmlFor="warningThreshold" className="text-gray-300">Suspicious threshold</label>
                <span className="text-yellow-300">{settings.warningThreshold}%</span>
              </div>
              <input
                id="warningThreshold"
                type="range"
                min={10}
                max={85}
                value={settings.warningThreshold}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    warningThreshold: Number(e.target.value),
                    phishingThreshold: Math.max(prev.phishingThreshold, Number(e.target.value) + 5),
                  }))
                }
                className="w-full accent-yellow-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <label htmlFor="phishingThreshold" className="text-gray-300">Phishing threshold</label>
                <span className="text-red-300">{settings.phishingThreshold}%</span>
              </div>
              <input
                id="phishingThreshold"
                type="range"
                min={20}
                max={95}
                value={settings.phishingThreshold}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    phishingThreshold: Math.max(Number(e.target.value), prev.warningThreshold + 5),
                  }))
                }
                className="w-full accent-red-400"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-black/30 p-5 space-y-5">
            <h2 className="text-white font-semibold">Monitoring Preferences</h2>

            <label className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
              <div>
                <p className="text-sm text-white">Realtime monitoring</p>
                <p className="text-xs text-gray-400">Keep dashboard feed live with incoming scans.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.realtimeMonitoring}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, realtimeMonitoring: e.target.checked }))
                }
                className="h-4 w-4 accent-[#6B73FF]"
              />
            </label>

            <label className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
              <div>
                <p className="text-sm text-white">Community reports panel</p>
                <p className="text-xs text-gray-400">Show user-submitted comments in scan details.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.communityReports}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, communityReports: e.target.checked }))
                }
                className="h-4 w-4 accent-[#6B73FF]"
              />
            </label>

            <label className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
              <div>
                <p className="text-sm text-white">Daily summary email</p>
                <p className="text-xs text-gray-400">Send daily threat totals to admin inbox.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.dailySummaryEmail}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, dailySummaryEmail: e.target.checked }))
                }
                className="h-4 w-4 accent-[#6B73FF]"
              />
            </label>
          </div>
        </section>
      </main>
    </div>
  );
}