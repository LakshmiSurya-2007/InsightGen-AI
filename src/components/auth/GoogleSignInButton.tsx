import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { GoogleCredentialResponse } from "@/types/google";

interface GoogleSignInButtonProps {
  mode?: "signin" | "signup";
  disabled?: boolean;
}

const GIS_SCRIPT_ID = "google-identity-services-script";

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return;

    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(GIS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Identity Services")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GIS_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

export function GoogleSignInButton({ mode = "signin", disabled }: GoogleSignInButtonProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  const handleCredentialResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      const idToken = response?.credential;
      if (!idToken) {
        toast.error("Google sign-in did not return a valid credential. Please try again.");
        return;
      }

      setLoading(true);
      try {
        // Authenticate with Supabase using the verified Google ID Token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });

        if (error) {
          console.error("[Google Auth] Supabase sign-in error:", error);
          toast.error(error.message || "Google authentication failed. Please try again.");
          return;
        }

        if (data.session) {
          toast.success(mode === "signup" ? "Account created — welcome!" : "Welcome back");
          navigate({ to: "/dashboard" });
        }
      } catch (err) {
        console.error("[Google Auth] Unexpected error:", err);
        const msg = err instanceof Error ? err.message : "Authentication error occurred.";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [mode, navigate],
  );

  useEffect(() => {
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (!cancelled) setScriptReady(true);
      })
      .catch((err) => {
        console.warn("[Google Auth] Could not load GIS script:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!scriptReady || !googleClientId || !containerRef.current || !window.google?.accounts?.id) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: mode === "signup" ? "signup" : "signin",
      });

      // Clear any prior rendered button in this container before rendering
      containerRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: 336,
      });
    } catch (err) {
      console.error("[Google Auth] Error initializing Google button:", err);
    }
  }, [scriptReady, googleClientId, handleCredentialResponse, mode]);

  const handleMissingConfig = () => {
    toast.error(
      "Google Client ID is missing. Please add VITE_GOOGLE_CLIENT_ID to your environment variables and Google Cloud Console.",
      { duration: 5000 },
    );
  };

  if (loading) {
    return (
      <Button type="button" variant="outline" className="w-full glass" disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
        Signing in with Google...
      </Button>
    );
  }

  // If Google Client ID is configured and script is ready, the official button is mounted
  if (googleClientId) {
    return (
      <div className="w-full flex justify-center min-h-[40px]">
        <div
          ref={containerRef}
          className="w-full flex justify-center [&>div]:!w-full [&_iframe]:!w-full"
        />
      </div>
    );
  }

  // Fallback when VITE_GOOGLE_CLIENT_ID has not been configured yet
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full glass"
      onClick={handleMissingConfig}
      disabled={disabled}
    >
      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4-5.5 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.5 12 2.5 6.8 2.5 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.5H12z"
        />
      </svg>
      Continue with Google
    </Button>
  );
}
