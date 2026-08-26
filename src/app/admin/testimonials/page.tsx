import { Quote, Star, Trash2 } from "lucide-react";

import {
  deleteTestimonialAction,
  saveTestimonialAction,
} from "@/app/admin/testimonials/actions";
import {
  Alert,
  Badge,
  Card,
  CardTitle,
  CheckboxField,
  PageHeader,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/admin/ui";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Testimonials" };

export default async function TestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>;
}) {
  const params = await searchParams;

  const [user, testimonials] = await Promise.all([
    getCurrentUser(),
    prisma.testimonial.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
  ]);

  const canDelete = hasRole(user, "ADMIN");

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Testimonials"
        description="Client quotes that any Testimonials section can pull from automatically."
      />

      {params.saved && (
        <div className="mb-5">
          <Alert tone="success">The testimonial was saved.</Alert>
        </div>
      )}
      {params.deleted && (
        <div className="mb-5">
          <Alert tone="success">The testimonial was deleted.</Alert>
        </div>
      )}
      {params.error && (
        <div className="mb-5">
          <Alert tone="danger">A quote and an author name are required.</Alert>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {testimonials.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Quote className="size-8 text-slate-300" aria-hidden="true" />
                <p className="text-sm text-slate-500">
                  No testimonials yet. Add the first one using the form.
                </p>
              </div>
            </Card>
          ) : (
            testimonials.map((testimonial) => (
              <Card key={testimonial.id}>
                <form action={saveTestimonialAction} className="space-y-4">
                  <input type="hidden" name="id" value={testimonial.id} />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={
                            index < testimonial.rating
                              ? "size-4 fill-amber-400 text-amber-400"
                              : "size-4 text-slate-300"
                          }
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {testimonial.featured && (
                        <Badge tone="info">Featured</Badge>
                      )}
                      {testimonial.status === "DRAFT" && (
                        <Badge tone="warning">Draft</Badge>
                      )}
                    </div>
                  </div>

                  <TextAreaField
                    label="Quote"
                    name="quote"
                    rows={3}
                    required
                    defaultValue={testimonial.quote}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="Author"
                      name="authorName"
                      required
                      defaultValue={testimonial.authorName}
                    />
                    <TextField
                      label="Role"
                      name="authorRole"
                      defaultValue={testimonial.authorRole ?? ""}
                    />
                    <TextField
                      label="Company"
                      name="company"
                      defaultValue={testimonial.company ?? ""}
                    />
                    <TextField
                      label="Avatar URL"
                      name="avatarUrl"
                      defaultValue={testimonial.avatarUrl ?? ""}
                    />
                    <SelectField
                      label="Rating"
                      name="rating"
                      defaultValue={String(testimonial.rating)}
                      options={[5, 4, 3, 2, 1].map((value) => ({
                        value: String(value),
                        label: `${value} star${value === 1 ? "" : "s"}`,
                      }))}
                    />
                    <TextField
                      label="Sort order"
                      name="order"
                      type="number"
                      min={0}
                      defaultValue={testimonial.order}
                    />
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <CheckboxField
                      label="Feature this quote"
                      name="featured"
                      defaultChecked={testimonial.featured}
                    />
                    <SelectField
                      label="Status"
                      name="status"
                      defaultValue={testimonial.status}
                      options={[
                        { value: "PUBLISHED", label: "Published" },
                        { value: "DRAFT", label: "Draft" },
                      ]}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      Save
                    </button>
                  </div>
                </form>

                {canDelete && (
                  <form
                    action={deleteTestimonialAction}
                    className="mt-3 border-t border-slate-100 pt-3"
                  >
                    <input type="hidden" name="id" value={testimonial.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Delete this testimonial
                    </button>
                  </form>
                )}
              </Card>
            ))
          )}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardTitle description="Published quotes appear wherever a Testimonials section is set to pull from the database.">
              Add a testimonial
            </CardTitle>

            <form action={saveTestimonialAction} className="space-y-4">
              <TextAreaField
                label="Quote"
                name="quote"
                rows={4}
                required
                placeholder="WirelessCom kept our sites online through the ice storm…"
              />
              <TextField label="Author" name="authorName" required />
              <TextField
                label="Role"
                name="authorRole"
                placeholder="Operations Manager"
              />
              <TextField label="Company" name="company" />
              <SelectField
                label="Rating"
                name="rating"
                defaultValue="5"
                options={[5, 4, 3, 2, 1].map((value) => ({
                  value: String(value),
                  label: `${value} star${value === 1 ? "" : "s"}`,
                }))}
              />
              <CheckboxField label="Feature this quote" name="featured" />

              <button
                type="submit"
                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Add testimonial
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
