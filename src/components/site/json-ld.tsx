export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // CMS fields can include HTML. Escaping "<" keeps a </script> in a
      // description from breaking out of the JSON-LD tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
