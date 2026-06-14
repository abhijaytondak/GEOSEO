import { SignUp } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-6">
      <SignUp />
    </div>
  );
}
