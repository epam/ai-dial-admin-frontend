## 1. Resolve the entity, or say it could not be

- [x] 1.1 Read an asset's path from the flat field, then from the merge metadata, as every other
      write path does.
- [x] 1.2 State the unmatched case in the panel rather than rendering nothing, and issue no request
      for it.
- [x] 1.3 Unit tests: the metadata path, the flat field winning over it, the empty state, and the
      request that is not sent.
