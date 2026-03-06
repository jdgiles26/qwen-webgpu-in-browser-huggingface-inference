import { useEffect, useState } from "react";

import { LiquidIntro } from "./components/LiquidIntro";
import { AuthGate } from "./components/AuthGate";
import { LandingPage } from "./components/LandingPage";
import { ChatApp } from "./components/ChatApp";
import { useLLM } from "./hooks/useLLM";
import "katex/dist/katex.min.css";

type Stage = "intro" | "login" | "app";

interface SessionPayload {
  user: string;
  exp: number;
}

const SESSION_KEY = "mdg.session";

function encodeToken(payload: SessionPayload): string {
  return btoa(JSON.stringify(payload));
}

function decodeToken(token: string): SessionPayload | null {
  try {
    return JSON.parse(atob(token)) as SessionPayload;
  } catch {
    return null;
  }
}

function readSession(): SessionPayload | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(SESSION_KEY);
  if (!token) return null;
  const parsed = decodeToken(token);
  if (!parsed || parsed.exp < Date.now()) {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return parsed;
}

function App() {
  const { status, loadModel } = useLLM();

  const [stage, setStage] = useState<Stage>("intro");
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const isReady = status.state === "ready";
  const isLoading = hasStarted && !isReady && status.state !== "error";

  useEffect(() => {
    const session = readSession();
    if (session) {
      setSessionUser(session.user);
      setStage("app");
    }
  }, []);

  const handleLogin = (username: string, password: string) => {
    const user = username.trim();
    if (!user || password.trim().length < 6) return false;

    const token = encodeToken({
      user,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    });
    window.localStorage.setItem(SESSION_KEY, token);
    setSessionUser(user);
    setStage("app");
    return true;
  };

  const handleStart = () => {
    setHasStarted(true);
    loadModel();
  };

  const handleGoHome = () => {
    setShowChat(false);
    setTimeout(() => setHasStarted(false), 700);
  };

  const handleLogout = () => {
    window.localStorage.removeItem(SESSION_KEY);
    setSessionUser(null);
    setShowChat(false);
    setHasStarted(false);
    setStage("login");
  };

  useEffect(() => {
    if (isReady && hasStarted) {
      setShowChat(true);
    }
  }, [isReady, hasStarted]);

  return (
    <div className="relative h-screen w-screen brand-surface">
      {stage === "intro" && (
        <LiquidIntro onEnter={() => setStage(sessionUser ? "app" : "login")} />
      )}

      {stage === "login" && <AuthGate onLogin={handleLogin} />}

      {stage === "app" && (
        <>
          <div
            className={`absolute inset-0 z-10 transition-all duration-700 ${
              showChat ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <LandingPage
              onStart={handleStart}
              onLogout={handleLogout}
              status={status}
              isLoading={isLoading}
              showChat={showChat}
            />
          </div>

          <div
            className={`absolute inset-0 transition-all duration-700 ${
              showChat ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {hasStarted && (
              <ChatApp
                onGoHome={handleGoHome}
                onLogout={handleLogout}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
