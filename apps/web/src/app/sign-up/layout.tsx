import { ClerkProvider } from "@clerk/nextjs";

// Scoped Clerk provider for the auth route only — keeps Clerk client JS off the
// public marketing/feeds pages (the root layout no longer wraps everything).
export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
