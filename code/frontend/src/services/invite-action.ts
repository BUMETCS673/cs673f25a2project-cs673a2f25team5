import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

import { createAttendee } from "./attendees";
import { getUsers } from "./users";
import type {
  InviteActionResult,
  InviteeLookupResult,
} from "@/types/invitationTypes";
import type { UserResponse } from "@/types/userTypes";

type InviteActionOptions = {
  eventId: string;
  hostUserId: string;
};

const IdentifierSchema = z
  .string()
  .min(1, "Enter a name, email, or user ID")
  .max(200);

function isUuidLike(value: string) {
  return z.string().uuid().safeParse(value).success;
}

async function findInviteeCandidates(
  identifier: string,
  hostUserId: string,
  limit = 5,
): Promise<UserResponse[]> {
  const attempts: Array<{ filters: string[]; limit?: number }> = [];
  const trimmed = identifier.trim();

  if (isUuidLike(trimmed)) {
    attempts.push({ filters: [`user_id:eq:${trimmed}`], limit: 1 });
  }

  if (trimmed.includes("@")) {
    attempts.push({ filters: [`email:eq:${trimmed}`], limit: 1 });
  }

  const fuzzy = `%${trimmed}%`;
  attempts.push({ filters: [`email:ilike:${fuzzy}`], limit: 5 });
  attempts.push({ filters: [`first_name:ilike:${trimmed}%`], limit: 5 });
  attempts.push({ filters: [`last_name:ilike:${trimmed}%`], limit: 5 });

  const seen = new Set<string>();
  const candidates: UserResponse[] = [];

  for (const attempt of attempts) {
    try {
      const result = await getUsers({
        filters: attempt.filters,
        limit: attempt.limit ?? 10,
      });

      for (const user of result.items) {
        if (user.user_id === hostUserId || seen.has(user.user_id)) {
          continue;
        }
        seen.add(user.user_id);
        candidates.push(user);
      }

      if (candidates.length >= limit) {
        break;
      }
    } catch (error) {
      console.error("Failed to search invitee candidates", error);
    }
  }

  return candidates.slice(0, limit);
}

export function createInviteAction({
  eventId,
  hostUserId,
}: InviteActionOptions) {
  return async function onInvite(
    identifier: string,
    userId?: string,
  ): Promise<InviteActionResult> {
    "use server";

    const viewer = await currentUser();
    const viewerExternalId = viewer?.externalId ?? null;

    if (!viewerExternalId) {
      return {
        success: false,
        code: "unauthenticated",
        message: "Sign in to send invitations.",
      };
    }

    if (viewerExternalId !== hostUserId) {
      return {
        success: false,
        code: "forbidden",
        message: "Only the event host can send invitations.",
      };
    }

    const parsedIdentifier = IdentifierSchema.safeParse(identifier);
    if (!parsedIdentifier.success) {
      return {
        success: false,
        code: "validation",
        message: "Enter who you want to invite.",
      };
    }

    const normalizedInput = parsedIdentifier.data.trim();
    if (!normalizedInput) {
      return {
        success: false,
        code: "validation",
        message: "Add a name or email to invite someone.",
      };
    }

    if (normalizedInput === hostUserId) {
      return {
        success: false,
        code: "self",
        message: "You can't invite yourself.",
      };
    }

    let invitee: UserResponse | null = null;

    if (userId && isUuidLike(userId)) {
      try {
        const result = await getUsers({
          filters: [`user_id:eq:${userId}`],
          limit: 1,
        });
        invitee = result.items[0] ?? null;
      } catch (error) {
        console.error("Failed to load selected invitee", error);
      }
    }

    if (!invitee) {
      const candidates = await findInviteeCandidates(
        normalizedInput,
        hostUserId,
        1,
      );
      invitee = candidates[0] ?? null;
    }

    if (!invitee) {
      return {
        success: false,
        code: "notFound",
        message: "No matching user found. Ask them to sign up first.",
      };
    }

    try {
      await createAttendee({
        event_id: eventId,
        user_id: invitee.user_id,
        status: null,
      });

      return {
        success: true,
        invitedUser: {
          user_id: invitee.user_id,
          email: invitee.email,
          first_name: invitee.first_name,
          last_name: invitee.last_name,
        },
        message:
          `Invitation sent to ${invitee.first_name} ${invitee.last_name}`.trim(),
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't send this invitation right now.";

      if (message.includes("status 404")) {
        return {
          success: false,
          code: "notFound",
          message: "That user no longer exists. Try inviting someone else.",
        };
      }

      if (message.includes("status 409")) {
        return {
          success: false,
          code: "duplicate",
          message: "They're already on the guest list.",
        };
      }

      console.error("Failed to send invitation", error);
      return {
        success: false,
        code: "unknown",
        message: "We couldn't send this invitation. Please try again.",
      };
    }
  };
}

type ResolveInviteeOptions = {
  hostUserId: string;
};

export function createResolveInviteeAction({
  hostUserId,
}: ResolveInviteeOptions) {
  return async function resolveInvitee(
    identifier: string,
  ): Promise<InviteeLookupResult> {
    "use server";

    const viewer = await currentUser();
    const viewerExternalId = viewer?.externalId ?? null;

    if (!viewerExternalId) {
      return {
        success: false,
        code: "unauthenticated",
        message: "Sign in to find people to invite.",
      };
    }

    if (viewerExternalId !== hostUserId) {
      return {
        success: false,
        code: "forbidden",
        message: "Only the host can search for invitees.",
      };
    }

    const parsed = IdentifierSchema.safeParse(identifier);
    if (!parsed.success) {
      return {
        success: false,
        code: "validation",
        message: "Add a name or email to look someone up.",
      };
    }

    const invitees = await findInviteeCandidates(parsed.data, hostUserId, 10);

    if (invitees.length === 0) {
      return {
        success: false,
        code: "notFound",
        message: "No matching user found.",
      };
    }

    return {
      success: true,
      users: invitees.map((invitee) => ({
        user_id: invitee.user_id,
        email: invitee.email,
        first_name: invitee.first_name,
        last_name: invitee.last_name,
      })),
    };
  };
}
