import { useState } from "react";
import {
  UserRound,
  ArrowRight,
  Shield,
  Zap,
  Github,
  LockKeyhole,
} from "lucide-react";
import { FloatingGhost } from "./FloatingGhost";

interface AuthGateProps {
  onLogin: (username: string, password: string) => boolean;
}

export function AuthGate({ onLogin }: AuthGateProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(username, password)) {
      setError("Enter a valid username and password.");
      return;
    }
    setError("");
  };

  return (
    <div className="brand-surface relative flex h-full min-h-full items-center justify-center overflow-hidden px-6 py-10 text-[#07162d]">
      <div className="landing-brand-glow absolute inset-0" />
      <div className="brand-grid" />
      <FloatingGhost />

      <div className="brand-chrome relative z-10 flex w-full max-w-5xl flex-col gap-8 overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 lg:flex-row lg:items-start lg:px-12 lg:py-12">
        <section className="flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-support text-[11px] uppercase tracking-[0.35em] text-[#2451b8]">
            <span>MDG</span>
            <span>|</span>
            <span>dabbledabble</span>
            <span>|</span>
            <a
              href="https://github.com/jdgiles26"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 tracking-[0.22em] text-[#0b52d8] transition hover:text-[#083da4]"
            >
              <Github className="h-3.5 w-3.5" />
              github
            </a>
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/50 bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <Shield className="h-5 w-5 text-[#1f7dff]" />
              <p className="mt-3 text-sm font-medium text-[#081325]">Private</p>
            </div>
            <div className="rounded-3xl border border-white/50 bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <Zap className="h-5 w-5 text-[#1f7dff]" />
              <p className="mt-3 text-sm font-medium text-[#081325]">WebGPU</p>
            </div>
          </div>
        </section>

        <section className="w-full max-w-xl rounded-[1.75rem] border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(230,246,255,0.74))] p-5 shadow-[0_24px_80px_rgba(20,91,183,0.18)] backdrop-blur-xl sm:p-7">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-[#4162a5]">
                <UserRound className="h-3.5 w-3.5" />
                Username
              </span>
              <input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-2xl border border-[#cce6ff] bg-white/80 px-4 py-3 text-sm text-[#081325] outline-none transition focus:border-[#1f7dff] focus:ring-2 focus:ring-[#99dfff]"
                placeholder="jdgiles26"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-[#4162a5]">
                <LockKeyhole className="h-3.5 w-3.5" />
                Password
              </span>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-[#cce6ff] bg-white/80 px-4 py-3 text-sm text-[#081325] outline-none transition focus:border-[#1f7dff] focus:ring-2 focus:ring-[#99dfff]"
                placeholder="Enter your password"
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0b52d8_0%,#1f7dff_40%,#6de6ff_100%)] px-4 py-3.5 text-sm font-semibold tracking-[0.08em] text-white shadow-[0_18px_35px_rgba(31,125,255,0.35)] transition hover:-translate-y-0.5"
            >
              Enter workspace
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
