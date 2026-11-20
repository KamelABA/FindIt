// Shape of an item as returned by the API (the frontend reads it with normalizeItem).

export const ITEM_TYPES = ["lost", "found"];
export const MODERATION_STATUSES = ["pending", "approved", "rejected"];
export const LIFECYCLE_STATUSES = ["open", "resolved", "archived"];

/** Columns to read, with the publisher joined from `users`. */
export const ITEM_COLUMNS = `
  id, title, description, type, category, location, event_date, images,
  moderation_status, lifecycle_status, is_active, resolved_at, archived_at, created_at, updated_at,
  publisher:users ( id, full_name, email, phone )
`;

export function toItem(row) {
  const { publisher, ...item } = row;
  return {
    ...item,
    publisher: publisher
      ? { id: publisher.id, name: publisher.full_name, email: publisher.email, phone: publisher.phone }
      : null,
  };
}
