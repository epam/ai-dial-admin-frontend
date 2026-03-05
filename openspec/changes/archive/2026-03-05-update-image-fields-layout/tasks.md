## 1. Layout Update

- [x] 1.1 Move `ImageBuildPrivileges` from its own divider-separated section into the first group alongside `ImageBase` in `ImageFields.tsx`
- [x] 1.2 Ensure only one divider separates the base group (ImageBase + ImageBuildPrivileges) from the source group (ImageSource + ImageTransport)

## 2. Tests

- [x] 2.1 Update `ImageFields.spec.tsx` to verify ImageBuildPrivileges renders in the same group as base fields in Properties view
- [x] 2.2 Verify modal view still does not render ImageBuildPrivileges
