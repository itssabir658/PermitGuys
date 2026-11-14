import type { UIDataTypes, UIMessage } from "ai";
import type { AdvisorUITools } from "./tools";

/** A message in the permit strategist's conversation, with its typed tool parts. Types only, so the widget can import it. */
export type AdvisorMessage = UIMessage<unknown, UIDataTypes, AdvisorUITools>;

/** Reasons the widget can explain. Sent as the body of a non-2xx response or as a stream error. */
export type AdvisorFailure = "not_configured" | "rate_limited" | "invalid" | "too_long" | "unavailable";
