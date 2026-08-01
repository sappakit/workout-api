# TODO

- check to know all the places that need licensing mention

# BUG

# OPTIONAL

- import source exercises always overwrite local edits
  fix by:
  - make import only insert exericses (not update existing one)
  - separate source values and local overrides. such as (source_name, name_override), (source_description, description_override) [more complex]
- use checksum field to detect identical file contents (calculate from file.buffer) for media (images)
- fix race window on startWorkoutSession
