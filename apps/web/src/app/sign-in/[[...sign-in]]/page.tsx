import { SignIn } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-6">
      {/* Land a returning signed-in user on their dashboard, NOT the marketing "/". The
          env SIGN_IN_FORCE_REDIRECT_URL=/ pointed at the public landing page; this prop is
          committed (env-independent) and takes precedence. fallback handles the case where
          they arrived without a ?redirect_url. */}
      <SignIn forceRedirectUrl="/home" fallbackRedirectUrl="/home" />
    </div>
  );
}
