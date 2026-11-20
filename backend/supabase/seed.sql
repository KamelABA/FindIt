-- FindIt example data. Run after schema.sql (Supabase → SQL Editor).
-- Safe to run again: each row is only added if it is missing, and rows you changed are left alone.

-- ── Categories ───────────────────────────────────────────────────────────────
insert into public.categories (slug, name_en, name_ar, sort_order) values
  ('electronics', 'Electronics',      'إلكترونيات',     1),
  ('personal',    'Personal Items',   'أغراض شخصية',    2),
  ('documents',   'Documents',        'وثائق',          3),
  ('clothing',    'Clothing',         'ملابس',          4),
  ('university',  'University Items', 'أدوات جامعية',   5),
  ('accessories', 'Accessories',      'إكسسوارات',      6),
  ('other',       'Other',            'أخرى',           7)
on conflict (slug) do nothing;

-- ── Users ────────────────────────────────────────────────────────────────────
-- No users are created by this file: add accounts yourself in Table Editor → users
-- (set role = super_admin on your own account to open the admin dashboard and manage admins).
-- The example items, claims and logs below are linked to existing accounts by email
-- when those accounts exist; otherwise items are added without a publisher, and
-- claims / logs (which need a person) are skipped.

-- ── Items ────────────────────────────────────────────────────────────────────
-- Images are the illustrations shipped with the frontend (frontend/public/items).
insert into public.items
  (title, description, type, category, location, event_date, created_at, images,
   moderation_status, lifecycle_status, resolved_at, archived_at, publisher_id)
select v.title, v.description, v.type, v.category, v.location, v.event_date::date, v.created_at::timestamptz,
       v.images::text[], v.moderation_status, v.lifecycle_status,
       v.resolved_at::timestamptz, v.archived_at::timestamptz, u.id
from (values
  -- current notice board
  ('Black Samsung Galaxy phone',
   'Black Samsung phone with a transparent case and a small crack on the top-left corner. Lock screen shows a picture of a cat.',
   'lost', 'electronics', 'Central Library – 2nd floor', '2026-11-17', '2026-11-17T14:20:00Z',
   '{/items/phone-front.svg,/items/phone-back.svg}', 'approved', 'open', null, null, 'amine@univ.dz'),
  ('Student card – Faculty of Economics',
   'Student card found near the cafeteria entrance. Name partially visible.',
   'found', 'documents', 'University Restaurant', '2026-11-18', '2026-11-18T09:05:00Z',
   '{/items/student-card.svg}', 'approved', 'open', null, null, 'sara@univ.dz'),
  ('Blue backpack with laptop sleeve',
   'Navy blue backpack, contains notebooks and a calculator. Left in amphitheatre B after the 10:00 lecture.',
   'lost', 'personal', 'Amphitheatre B', '2026-11-16', '2026-11-16T12:40:00Z',
   '{/items/backpack-front.svg,/items/backpack-sleeve.svg,/items/backpack-contents.svg}', 'approved', 'open', null, null, 'yacine@univ.dz'),
  ('Set of keys with red keychain',
   'Three keys on a ring with a red keychain shaped like a star.',
   'found', 'personal', 'Parking – Gate 2', '2026-11-15', '2026-11-15T17:10:00Z',
   '{/items/keys.svg}', 'approved', 'open', null, null, 'nour@univ.dz'),
  ('Grey wool scarf',
   'Long grey scarf found on a bench in the main courtyard.',
   'found', 'clothing', 'Main courtyard', '2026-11-14', '2026-11-14T10:00:00Z',
   '{/items/scarf.svg}', 'approved', 'open', null, null, 'lina@univ.dz'),
  ('Casio scientific calculator',
   'Casio fx-991 with initials “R.D.” written on the back.',
   'lost', 'university', 'Exam room 12', '2026-11-13', '2026-11-13T15:30:00Z',
   '{/items/calculator-front.svg,/items/calculator-back.svg}', 'approved', 'open', null, null, 'riad@univ.dz'),
  ('Silver wristwatch',
   'Silver watch with a black leather strap, found in the gym changing room.',
   'found', 'accessories', 'University gym', '2026-11-12', '2026-11-12T18:45:00Z',
   '{/items/watch.svg}', 'approved', 'open', null, null, 'kamel@univ.dz'),
  ('Wireless earbuds in a white case',
   'White charging case, one earbud missing. Lost between the bus stop and Faculty of Science.',
   'lost', 'electronics', 'Bus stop – Faculty of Science', '2026-11-19', '2026-11-19T08:00:00Z',
   '{}', 'pending', 'open', null, null, 'sara@univ.dz'),
  ('Prescription glasses',
   'Black frame glasses in a brown case, found in lecture room 4.',
   'found', 'personal', 'Lecture room 4', '2026-11-19', '2026-11-19T11:30:00Z',
   '{}', 'pending', 'open', null, null, 'amine@univ.dz'),
  -- history (for the statistics)
  ('Black leather wallet',
   'Black wallet with a student card and some cash inside.',
   'lost', 'personal', 'Faculty of Law – main hall', '2026-09-02', '2026-09-03T09:15:00Z',
   '{}', 'approved', 'resolved', '2026-09-06T12:00:00Z', null, 'nour@univ.dz'),
  ('USB flash drive 32 GB',
   'Silver USB key with a blue cap, found plugged into a lab computer.',
   'found', 'university', 'Computer lab 3', '2026-09-10', '2026-09-10T16:40:00Z',
   '{}', 'approved', 'resolved', '2026-09-15T10:30:00Z', null, 'riad@univ.dz'),
  ('Blue umbrella',
   'Folding blue umbrella left at the main entrance.',
   'found', 'other', 'Main entrance', '2026-09-18', '2026-09-18T08:20:00Z',
   '{}', 'approved', 'archived', null, '2026-10-20T09:00:00Z', 'lina@univ.dz'),
  ('Dell laptop charger',
   '65 W Dell charger with a scratched cable.',
   'lost', 'electronics', 'Library – ground floor', '2026-09-23', '2026-09-24T11:00:00Z',
   '{}', 'approved', 'resolved', '2026-09-29T15:00:00Z', null, 'kamel@univ.dz'),
  ('National ID card',
   'National ID card found on the ground near the bus stop.',
   'found', 'documents', 'Bus stop – Gate 1', '2026-10-01', '2026-10-01T07:50:00Z',
   '{/items/student-card.svg}', 'approved', 'resolved', '2026-10-03T11:20:00Z', null, 'sara@univ.dz'),
  ('Denim jacket',
   'Light blue denim jacket, size M, left on a chair.',
   'lost', 'clothing', 'Amphitheatre A', '2026-10-07', '2026-10-08T13:30:00Z',
   '{}', 'approved', 'open', null, null, 'yacine@univ.dz'),
  ('Gold bracelet',
   'Thin gold bracelet found in the prayer room.',
   'found', 'accessories', 'Prayer room', '2026-10-14', '2026-10-14T12:45:00Z',
   '{}', 'approved', 'resolved', '2026-10-20T10:00:00Z', null, 'amine@univ.dz'),
  ('Analysis lecture notebook',
   'Green notebook with all the Analysis 2 lectures. Name on the first page.',
   'lost', 'university', 'Room 105', '2026-10-20', '2026-10-21T09:10:00Z',
   '{}', 'approved', 'open', null, null, 'nour@univ.dz'),
  ('Phones for sale – contact me',
   'Selling new phones at a good price, write to me.',
   'found', 'other', 'Online', '2026-10-25', '2026-10-25T20:00:00Z',
   '{}', 'rejected', 'open', null, null, 'sofiane@univ.dz'),
  ('AirPods Pro case',
   'White AirPods Pro case with a small sticker on the back.',
   'lost', 'electronics', 'Cafeteria', '2026-10-28', '2026-10-29T14:15:00Z',
   '{}', 'approved', 'resolved', '2026-11-05T16:00:00Z', null, 'lina@univ.dz'),
  ('Green water bottle',
   'Green metal water bottle with stickers, found in the gym.',
   'found', 'accessories', 'University gym', '2026-11-02', '2026-11-02T18:30:00Z',
   '{}', 'approved', 'open', null, null, 'riad@univ.dz'),
  ('Driving licence',
   'Pink driving licence card, lost near the parking.',
   'lost', 'documents', 'Parking – Gate 2', '2026-11-05', '2026-11-06T08:40:00Z',
   '{}', 'approved', 'resolved', '2026-11-10T09:30:00Z', null, 'kamel@univ.dz'),
  ('Black cap',
   'Black baseball cap found next to the football field.',
   'found', 'clothing', 'Football field', '2026-11-09', '2026-11-09T17:20:00Z',
   '{}', 'approved', 'open', null, null, 'amine@univ.dz')
) as v (title, description, type, category, location, event_date, created_at, images,
        moderation_status, lifecycle_status, resolved_at, archived_at, publisher_email)
left join public.users u on lower(u.email) = v.publisher_email
where not exists (select 1 from public.items i where i.title = v.title);

-- ── Claims ───────────────────────────────────────────────────────────────────
insert into public.claims (item_id, claimant_id, message, evidence_urls, status, created_at, completed_at)
select i.id, u.id, v.message, v.evidence::text[], v.status, v.created_at::timestamptz, v.completed_at::timestamptz
from (values
  ('Grey wool scarf', 'yacine@univ.dz',
   'I think this is mine: it has a small label with the letter Y inside.',
   '{/items/scarf.svg}', 'pending', '2026-11-15T09:00:00Z', null),
  ('Set of keys with red keychain', 'riad@univ.dz',
   'My keys: one of them is a small blue mailbox key.',
   '{}', 'pending', '2026-11-16T08:30:00Z', null),
  ('Student card – Faculty of Economics', 'kamel@univ.dz',
   'This could be my card, I lost it at lunch on Tuesday.',
   '{}', 'pending', '2026-11-19T12:10:00Z', null),
  ('USB flash drive 32 GB', 'sara@univ.dz',
   'The drive has a folder called "Memoire_Sara" with my thesis.',
   '{}', 'completed', '2026-09-12T10:00:00Z', '2026-09-15T10:30:00Z'),
  ('National ID card', 'yacine@univ.dz',
   'It is my national ID card, I can show my passport with the same photo.',
   '{/items/student-card.svg}', 'completed', '2026-10-02T09:00:00Z', '2026-10-03T11:20:00Z'),
  ('Gold bracelet', 'lina@univ.dz',
   'A gift from my mother, engraved with the letter L inside.',
   '{}', 'completed', '2026-10-16T14:00:00Z', '2026-10-20T10:00:00Z'),
  ('Green water bottle', 'nour@univ.dz',
   'My bottle: it has a sticker of the Medicine faculty and a dent at the bottom.',
   '{}', 'approved', '2026-11-04T11:00:00Z', null),
  ('Black cap', 'kamel@univ.dz',
   'I lost a cap like this one.',
   '{}', 'rejected', '2026-11-10T16:00:00Z', null)
) as v (item_title, claimant_email, message, evidence, status, created_at, completed_at)
join public.items i on i.title = v.item_title
join public.users u on lower(u.email) = v.claimant_email
where not exists (select 1 from public.claims c where c.item_id = i.id and c.claimant_id = u.id);

-- ── Activity logs (a short example history, added only to an empty log) ──────
insert into public.activity_logs (admin_id, action, target_type, target_id, target_label, details, created_at)
select a.id, v.action, v.target_type,
       coalesce(i.id, us.id), v.label, v.details::jsonb, v.created_at::timestamptz
from (values
  ('item.resolve',    'item', 'USB flash drive 32 GB',        null,              '{}',                                   '2026-09-15T10:30:00Z'),
  ('item.archive',    'item', 'Blue umbrella',                null,              '{}',                                   '2026-10-20T09:00:00Z'),
  ('item.reject',     'item', 'Phones for sale – contact me', null,              '{"note": "Advertising, not a lost or found item"}', '2026-10-26T09:55:00Z'),
  ('user.suspend',    'user', 'Sofiane L.',                   'sofiane@univ.dz', '{"note": "Posted advertising"}',       '2026-10-26T10:00:00Z'),
  ('user.reject',     'user', 'Imane Z.',                     'imane@univ.dz',   '{"note": "ID card photo unreadable"}', '2026-11-05T09:00:00Z'),
  ('item.resolve',    'item', 'Driving licence',              null,              '{}',                                   '2026-11-10T09:30:00Z')
) as v (action, target_type, label, user_email, details, created_at)
cross join (select id from public.users where lower(email) = 'admin@findit.dz') a
left join public.items i  on v.target_type = 'item' and i.title = v.label
left join public.users us on v.target_type = 'user' and lower(us.email) = v.user_email
where not exists (select 1 from public.activity_logs);
