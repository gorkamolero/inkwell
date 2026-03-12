ALTER TABLE "projects" ADD COLUMN "public_slug" text;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "slug" text;
--> statement-breakpoint
WITH project_bases AS (
	SELECT
		id,
		created_at,
		CASE
			WHEN base_slug IN ('_next', 'api', 'favicon.ico', 'login', 'pricing', 'projects', 'robots.txt', 's', 'sessions', 'signup', 'sitemap.xml', 'test')
				THEN base_slug || '-project'
			ELSE base_slug
		END AS base_slug
	FROM (
		SELECT
			id,
			created_at,
			COALESCE(
				NULLIF(
					trim(BOTH '-' FROM regexp_replace(regexp_replace(lower(COALESCE(slug, name, 'project')), '[^a-z0-9\\s-]', '', 'g'), '[\\s_-]+', '-', 'g')),
					''
				),
				'project'
			) AS base_slug
		FROM "projects"
	) AS normalized_projects
),
ranked_projects AS (
	SELECT
		id,
		base_slug,
		row_number() OVER (PARTITION BY base_slug ORDER BY created_at, id) AS row_num
	FROM project_bases
)
UPDATE "projects"
SET "public_slug" = CASE
	WHEN ranked_projects.row_num = 1 THEN ranked_projects.base_slug
	ELSE ranked_projects.base_slug || '-' || ranked_projects.row_num::text
END
FROM ranked_projects
WHERE "projects"."id" = ranked_projects.id;
--> statement-breakpoint
WITH document_bases AS (
	SELECT
		id,
		project_id,
		created_at,
		CASE
			WHEN base_slug = 'new' THEN 'document'
			ELSE base_slug
		END AS base_slug
	FROM (
		SELECT
			id,
			project_id,
			created_at,
			COALESCE(
				NULLIF(
					trim(BOTH '-' FROM regexp_replace(regexp_replace(lower(
						COALESCE(
							NULLIF(trim(title), ''),
							regexp_replace(regexp_replace(regexp_replace(path, '^.*/', ''), '\\.md$', '', 'i'), '^\\d+[-_\\s]?', ''),
							'document'
						)
					), '[^a-z0-9\\s-]', '', 'g'), '[\\s_-]+', '-', 'g')),
					''
				),
				'document'
			) AS base_slug
		FROM "documents"
	) AS normalized_documents
),
ranked_documents AS (
	SELECT
		id,
		project_id,
		base_slug,
		row_number() OVER (PARTITION BY project_id, base_slug ORDER BY created_at, id) AS row_num
	FROM document_bases
)
UPDATE "documents"
SET "slug" = CASE
	WHEN ranked_documents.row_num = 1 THEN ranked_documents.base_slug
	ELSE ranked_documents.base_slug || '-' || ranked_documents.row_num::text
END
FROM ranked_documents
WHERE "documents"."id" = ranked_documents.id;
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "public_slug" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "slug" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_public_slug_unique" UNIQUE("public_slug");
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_slug_unique" UNIQUE("project_id","slug");
