import { SITE_URL } from "@/utils/env";

export const Const = {
  // SF-4: the one site origin (NEXT_PUBLIC_SITE_URL), shared with metadata.
  ClientLink: SITE_URL,
  Brand: "Nahara",
  IN_STOCK: "IN_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
};

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
