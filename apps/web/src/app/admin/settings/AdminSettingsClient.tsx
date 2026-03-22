"use client";

import Aurora from "@components/ui/Aurora";
import ThemeToggle from "@components/ui/ThemeToggle";
import { createClient } from "@lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-heading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page text-heading transition-colors duration-300">
      <header className="border-b border-[#545BFF]/15 bg-page/85 backdrop-blur relative overflow-hidden">
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <Aurora
            colorStops={["#545BFF", "#b19eef", "#545BFF"]}
            amplitude={1.1}
            blend={0.55}
          />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6 relative z-10">
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
              <h1 className="text-heading font-semibold">Admin Settings</h1>
              <p className="text-xs text-faded">
                Tune dashboard behavior and detection policy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs sm:text-sm text-faded">
              Admin:{" "}
              <span className="text-heading font-medium">{adminEmail}</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/admin/dashboard"
            className="group relative inline-flex items-center gap-2 px-5 h-10 rounded-full overflow-hidden border border-[#545BFF]/30 bg-gradient-to-r from-[#545BFF]/15 to-[#6B73FF]/15 hover:from-[#545BFF]/25 hover:to-[#6B73FF]/25 text-heading text-sm font-semibold hover:border-[#545BFF]/50 hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:-translate-x-0.5 transition-transform duration-200"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to Dashboard
          </Link>
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="group relative inline-flex items-center gap-2 px-6 h-10 rounded-full overflow-hidden
              bg-gradient-to-r from-[#545BFF] to-[#6B73FF] hover:from-[#4349dd] hover:to-[#545BFF]
              text-white text-sm font-semibold
              shadow-[0_0_20px_rgba(84,91,255,0.38)] hover:shadow-[0_0_36px_rgba(84,91,255,0.62)]
              hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10">
              {saving ? "Saving..." : "Save Changes"}
            </span>
            {!saving && (
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            )}
          </button>
        </div>

        {savedNotice && (
          <div className="rounded-xl border border-[#545BFF]/25 bg-[#545BFF]/10 px-4 py-3 text-sm text-[#545BFF]/90">
            {savedNotice}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-page/70 dark:bg-panel/55 border border-[#545BFF]/15 rounded-2xl p-6 backdrop-blur-sm hover:border-[#545BFF]/30 transition-all duration-300">
            <p className="text-faded text-sm mb-2">Detection sensitivity</p>
            <p className="text-3xl font-bold text-heading">
              {settings.detectionSensitivity}%
            </p>
            <p className="text-[#545BFF] text-xs mt-2">{riskLabel}</p>
          </div>
          <div className="bg-page/70 dark:bg-panel/55 border border-[#545BFF]/15 rounded-2xl p-6 backdrop-blur-sm hover:border-[#545BFF]/30 transition-all duration-300">
            <p className="text-faded text-sm mb-2">Suspicious threshold</p>
            <p className="text-3xl font-bold text-heading">
              {settings.warningThreshold}%
            </p>
            <p className="text-[#545BFF] text-xs mt-2">
              Triggers warning state
            </p>
          </div>
          <div className="bg-page/70 dark:bg-panel/55 border border-[#545BFF]/15 rounded-2xl p-6 backdrop-blur-sm hover:border-[#545BFF]/30 transition-all duration-300">
            <p className="text-faded text-sm mb-2">Phishing threshold</p>
            <p className="text-3xl font-bold text-heading">
              {settings.phishingThreshold}%
            </p>
            <p className="text-[#545BFF] text-xs mt-2">Triggers block state</p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-page/70 dark:bg-panel/55 border border-[#545BFF]/15 rounded-2xl p-6 backdrop-blur-sm hover:border-[#545BFF]/30 transition-all duration-300 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-heading font-semibold">Threat Detection</h2>
                <p className="text-xs text-faded mt-1">
                  Adjust sensitivity and classification thresholds
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-panel/50 text-faded text-xs font-semibold rounded-xl border border-[#545BFF]/15">
                Policy
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <label htmlFor="sensitivity" className="text-copy">
                  Detection sensitivity
                </label>
                <span className="text-blue-600 dark:text-blue-300">
                  {settings.detectionSensitivity}% · {riskLabel}
                </span>
              </div>
              <input
                id="sensitivity"
                type="range"
                min={0}
                max={100}
                value={settings.detectionSensitivity}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    detectionSensitivity: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#6B73FF]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <label htmlFor="warningThreshold" className="text-copy">
                  Suspicious threshold
                </label>
                <span className="text-yellow-600 dark:text-yellow-300">
                  {settings.warningThreshold}%
                </span>
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
                    phishingThreshold: Math.max(
                      prev.phishingThreshold,
                      Number(e.target.value) + 5,
                    ),
                  }))
                }
                className="w-full accent-yellow-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <label htmlFor="phishingThreshold" className="text-copy">
                  Phishing threshold
                </label>
                <span className="text-red-600 dark:text-red-300">
                  {settings.phishingThreshold}%
                </span>
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
                    phishingThreshold: Math.max(
                      Number(e.target.value),
                      prev.warningThreshold + 5,
                    ),
                  }))
                }
                className="w-full accent-red-400"
              />
            </div>
          </div>

          <div className="bg-page/70 dark:bg-panel/55 border border-[#545BFF]/15 rounded-2xl p-6 backdrop-blur-sm hover:border-[#545BFF]/30 transition-all duration-300 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-heading font-semibold">Preferences</h2>
                <p className="text-xs text-faded mt-1">
                  Control what the admin experience shows and sends
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-panel/50 text-faded text-xs font-semibold rounded-xl border border-[#545BFF]/15">
                UX
              </span>
            </div>

            <label className="flex items-center justify-between rounded-xl border border-[#545BFF]/15 bg-panel/55 dark:bg-black/20 px-4 py-3 hover:border-[#545BFF]/30 transition-colors">
              <div>
                <p className="text-sm text-heading">Realtime monitoring</p>
                <p className="text-xs text-faded">
                  Keep dashboard feed live with incoming scans.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.realtimeMonitoring}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    realtimeMonitoring: e.target.checked,
                  }))
                }
                className="h-4 w-4 accent-[#545BFF]"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-[#545BFF]/15 bg-panel/55 dark:bg-black/20 px-4 py-3 hover:border-[#545BFF]/30 transition-colors">
              <div>
                <p className="text-sm text-heading">Community reports panel</p>
                <p className="text-xs text-faded">
                  Show user-submitted comments in scan details.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.communityReports}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    communityReports: e.target.checked,
                  }))
                }
                className="h-4 w-4 accent-[#545BFF]"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-[#545BFF]/15 bg-panel/55 dark:bg-black/20 px-4 py-3 hover:border-[#545BFF]/30 transition-colors">
              <div>
                <p className="text-sm text-heading">Daily summary email</p>
                <p className="text-xs text-faded">
                  Send daily threat totals to admin inbox.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.dailySummaryEmail}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    dailySummaryEmail: e.target.checked,
                  }))
                }
                className="h-4 w-4 accent-[#545BFF]"
              />
            </label>
          </div>
        </section>
      </main>
    </div>
  );
}
