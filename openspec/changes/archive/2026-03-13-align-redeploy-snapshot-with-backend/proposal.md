# Add Scaling to Redeploy Snapshot

## Problem

The frontend's `getContainerRedeploySnapshot` determines when to show "Save & redeploy" vs "Save" for running containers. It currently does not include `scaling` (autoscaling) fields. The backend's `isApplicableForRollingUpdate` does trigger a rolling update on scaling changes, so the frontend shows a misleading plain "Save" button when only autoscaling is changed.

## Solution

Add `scaling` to `ContainerRedeploySnapshot` and `getContainerRedeploySnapshot` so that changes to `minReplicas`, `maxReplicas`, `scaleToZeroDelaySeconds`, or `strategy` on a running container show "Save & redeploy".

## Non-goals

- Tightening `command`/`args`/`containerGrpcPort` to be type-specific (separate change)
- Changing `allowedDomains` or `probeProperties` handling
