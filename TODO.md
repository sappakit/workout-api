# TODO

- check to know all the places to mention licensing
- use p-limit for batch operation

# Optional

- update entities to use 'string | null' instead of '?' (see ExerciseSource)
- import source exercises always overwrite local edits
  fix by:
  - make import only insert exericses (not update existing one)
  - separate source values and local overrides. such as (source_name, name_override), (source_description, description_override) [more complex]
- use checksum to detect identical file contents (calculate from file.buffer)
