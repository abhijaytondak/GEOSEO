import { SignIn } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-6">
      <SignIn />
    </div>
  );
}
