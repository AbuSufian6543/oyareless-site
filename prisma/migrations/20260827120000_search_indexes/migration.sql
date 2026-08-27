-- Additive full-text indexes for public search. Expression indexes do not
-- rewrite existing rows.

CREATE INDEX IF NOT EXISTS "Page_search_idx"
  ON "Page" USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce("metaDescription", '')));

CREATE INDEX IF NOT EXISTS "Post_search_idx"
  ON "Post" USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '')));

CREATE INDEX IF NOT EXISTS "FaqItem_search_idx"
  ON "FaqItem" USING gin (to_tsvector('english', coalesce(question, '') || ' ' || coalesce(answer, '')));

CREATE INDEX IF NOT EXISTS "KbArticle_search_idx"
  ON "KbArticle" USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '')));

CREATE INDEX IF NOT EXISTS "Brand_search_idx"
  ON "Brand" USING gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

CREATE INDEX IF NOT EXISTS "CaseStudy_search_idx"
  ON "CaseStudy" USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(problem, '')));

CREATE INDEX IF NOT EXISTS "Service_search_idx"
  ON "Service" USING gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(summary, '')));
