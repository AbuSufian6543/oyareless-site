import { TechBackdrop } from "@/components/visuals/tech-backdrop";

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <TechBackdrop density={0.55} />
      <div className="container-page py-14 lg:py-18">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-widest text-accent-300">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-navy-200">{description}</p>
      </div>
    </section>
  );
}
