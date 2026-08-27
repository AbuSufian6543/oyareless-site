import { PortalShell } from "@/app/portal/layout";
import { prisma } from "@/lib/prisma";
import { requirePortalUser } from "@/lib/portal-auth";
import { scopedWhere } from "@/lib/portal-scope";

export const metadata = { title: "Documents", robots: { index: false } };

export default async function PortalDocumentsPage() {
  const user = await requirePortalUser();
  const documents = await prisma.customerDocument.findMany({
    where: scopedWhere(user.customerId),
    orderBy: { createdAt: "desc" },
  });

  return (
    <PortalShell>
      <h1 className="text-2xl font-extrabold text-navy-900">Documents</h1>
      <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-semibold text-navy-900">{doc.title}</p>
              <p className="text-xs text-slate-500">{doc.description}</p>
            </div>
            <a href={doc.url} className="font-semibold text-brand-700 hover:underline">
              Download
            </a>
          </li>
        ))}
        {documents.length === 0 && (
          <li className="px-4 py-6 text-sm text-slate-500">No documents have been shared yet.</li>
        )}
      </ul>
    </PortalShell>
  );
}
