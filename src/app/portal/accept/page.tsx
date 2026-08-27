import { AcceptForm } from "@/app/portal/accept-form";

export const metadata = { title: "Activate portal access", robots: { index: false } };

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <p className="text-sm text-slate-600">That invite link is incomplete.</p>
      </div>
    );
  }
  return (
    <div className="flex min-h-dvh items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8">
        <h1 className="text-xl font-bold text-navy-900">Choose a password</h1>
        <p className="mt-2 text-sm text-slate-600">
          This is a one-time invite. After you set a password you will be signed in.
        </p>
        <div className="mt-6">
          <AcceptForm token={token} />
        </div>
      </div>
    </div>
  );
}
