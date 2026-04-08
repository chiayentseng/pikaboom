import type { SessionContext } from "@/lib/types/game";

export function getLocalSessionContext(): SessionContext {
  return {
    role: "parent",
    householdId: "local-household",
    parentProfileId: "local-parent",
    childProfileId: "local-child-profile",
    actingChildId: "local-child-profile"
  };
}

export function assertParentAccess(session: SessionContext) {
  if (session.role !== "parent") {
    throw new Error("Parent access is required.");
  }
}

export function assertChildAccess(session: SessionContext) {
  if (!["parent", "child"].includes(session.role)) {
    throw new Error("Child access is required.");
  }
}
