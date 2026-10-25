import { SITE_URL } from "@/utils/env";

export const Const = {
  // SF-4: the one site origin (NEXT_PUBLIC_SITE_URL), shared with metadata.
  ClientLink: SITE_URL,
  Brand: "Nahara",
  IN_STOCK: "IN_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
};

// PRD-014 UX-34: one password policy for signup, checkout and reset; the
// backend's reset requires 8 characters (WEAK_PASSWORD below that).
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MIN_MESSAGE =
  `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;

export const StatusCode = {
  Success: 200,
  NotFound: 404,
  UnAuthorized: 401,
  Forbidden: 403,
  IntervalServer: 500,
};

export const ProductStatus = {
  DRAFT: "DRAFT",
  SCHEDULED: "SCHEDULED",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
};

export const StockStatus = {
  IN_STOCK: "In Stock",
  OUT_OF_STOCK: "Out of stock",
};

export const UserStatus = {
  DEACTIVE: "DEACTIVE",
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED",
};

export const EmailSubscribedStatus = {
  SUBSCRIBED: "SUBSCRIBED",
  UNSUBSCRIBED: "UNSUBSCRIBED",
  NEVER_SUBSCRIBED: "NEVER_SUBSCRIBED",
};

export const Sort = {
  ASC: "ASC",
  DESC: "DESC",
};
