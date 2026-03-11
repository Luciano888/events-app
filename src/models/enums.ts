/**
 * Event type enum. Matches Supabase DB enum event_type_enum.
 */
export enum EventType {
  Social = 'social',
  Musical = 'musical',
  Dance = 'dance',
  Bar = 'bar',
  Cultural = 'cultural',
  GeneralInterest = 'general_interest',
  ThirdAge = 'third_age',
  Children = 'children',
  Sport = 'sport',
}

/**
 * Event visibility. Matches Supabase DB enum visibility_enum.
 * - Public: visible to everyone (anon + registered)
 * - Private: visible only to registered users
 * - Draft: visible only to the creator
 */
export enum Visibility {
  Public = 'public',
  Private = 'private',
  Draft = 'draft',
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EventType.Social]: 'Social event',
  [EventType.Musical]: 'Musical event',
  [EventType.Dance]: 'Dance event',
  [EventType.Bar]: 'Bar event',
  [EventType.Cultural]: 'Cultural event',
  [EventType.GeneralInterest]: 'General interest',
  [EventType.ThirdAge]: 'Third age',
  [EventType.Children]: 'Children',
  [EventType.Sport]: 'Sport',
};

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  [Visibility.Public]: 'Public',
  [Visibility.Private]: 'Private',
  [Visibility.Draft]: 'Draft',
};
