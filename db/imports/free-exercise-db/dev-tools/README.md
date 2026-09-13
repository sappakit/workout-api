# Free Exercise DB Dev Tools

Development-only utilities for preparing Free Exercise DB tracking-type data.

These tools generate review inputs and merge reviewed results into the canonical tracking-type mapping used by the importer.

## Commands

Generate the initial tracking-type classification input:

```bash
pnpm run dev:exercise-tools -- tracking-type-initial-input
```

Output:

```text
dev-tools/reports/input/tracking-type-initial-input.json
```

After reviewing/classifying that file, save the result as:

```text
dev-tools/reports/result/tracking-type-initial-result.json
```

Generate detailed input for exercises that still require review:

```bash
pnpm run dev:exercise-tools -- tracking-type-review-input
```

Output:

```text
dev-tools/reports/input/tracking-type-review-input.json
```

After reviewing/classifying that file, save the result as:

```text
dev-tools/reports/result/tracking-type-review-result.json
```

Merge the initial and review results into the canonical tracking-type mapping:

```bash
pnpm run dev:exercise-tools -- tracking-type-finalize
```

Output:

```text
db/imports/free-exercise-db/data/exercise-tracking-types.json
```

## Workflow

```text
tracking-type-initial-input.json
        ↓ review/classify
tracking-type-initial-result.json
        ↓ generate review input
tracking-type-review-input.json
        ↓ review/classify
tracking-type-review-result.json
        ↓ finalize
exercise-tracking-types.json
```

Files inside `dev-tools/reports/` are temporary development artifacts and should not be committed.

The final `data/exercise-tracking-types.json` file is the canonical mapping used by the import process.
