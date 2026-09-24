## 1. Qualify a tool row by its server

- [x] 1.1 Add the tab's qualifier column and the separator that joins a row's group values into its
      id, and group, select and rank the tab query by both columns.
- [x] 1.2 Build a qualified row's id from both values in the fold, so the two never collide.
- [x] 1.3 Ask the previous window by both of a key's parts. Matching a composite id against the
      dimension alone returned nothing, and every row's change read as absent.
- [x] 1.4 Search a qualified tab by both of its columns.
- [x] 1.5 Unit tests: the grouping and the ranking keys, the id, the previous-window keys, the
      search clause, and the unqualified tabs left alone.
