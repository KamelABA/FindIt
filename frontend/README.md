# FindIt – Frontend

واجهة FindIt: React 19 + Vite + Tailwind CSS v4 + GSAP.
هذا الجزء من عمل Ridha (الصفحة الرئيسية وتفاصيل الغرض)، ومعه العناصر المشتركة التي يحتاجها بقية الفريق: الشريط العلوي، التذييل، بطاقة الغرض، نظام الألوان، والترجمة.

## التشغيل

```bash
cd frontend
npm install
cp .env.example .env      # على Windows: copy .env.example .env
npm run dev               # http://localhost:5173
```

يحتاج Node 20 أو أحدث.

| المتغير في `.env` | معناه |
|---|---|
| `VITE_API_URL` | رابط الـ API، الافتراضي `http://localhost:5000/api` |
| `VITE_AUTH_ENABLED=true` | يظهر Login و Register في الشريط العلوي وزر Claim في صفحة الغرض |

كل البيانات تأتي من قاعدة البيانات (Supabase) عبر الـ backend، فشغّله أولاً: انظر [`backend/README.md`](../backend/README.md).

## ما الموجود

| المسار | الدور |
|---|---|
| `src/pages/Home.jsx` | Hero، شريط الكلمات، الخطوات، الأصناف، أحدث الأغراض |
| `src/pages/ItemDetails.jsx` | تفاصيل الغرض، معرض الصور، التواصل، Claim |
| `src/pages/BrowseItems.jsx` | صفحة بسيطة للبحث والفلترة، لتعمل روابط الصفحة الرئيسية |
| `src/pages/Placeholder.jsx` | صفحة مؤقتة للمسارات التي يملكها بقية الفريق |
| `src/components/Navbar.jsx`, `Footer.jsx` | التنقل، مع مبدّل اللغة والوضع الليلي وزر التثبيت |
| `src/components/ItemCard.jsx` | بطاقة الغرض القابلة لإعادة الاستعمال |
| `src/components/SearchBar.jsx`, `CategoryCard.jsx`, `ItemStatusBadge.jsx` | مكوّنات مشتركة |
| `src/components/SplitReveal.jsx`, `StaggerIn.jsx`, `SegmentedControl.jsx`, `Marquee.jsx` | مكوّنات الحركة (GSAP) |
| `src/pages/admin/` | لوحة المشرف (`/admin`) بتخطيطها الخاص: نظرة عامة، المستخدمون، المفقودات، الموجودات، المطالبات، التقارير، سجل النشاط. `AdminLayout.jsx` يحمي كل المسارات |
| `src/components/admin/` | مكوّنات اللوحة القابلة لإعادة الاستعمال: `DataTable`, `FilterBar`, `SearchField`, `Pagination`, `Drawer`, `ActionBar`, `StatCard`, `StatusChip`, `PageHeader`، والرسوم في `charts/` |
| `src/services/apiClient.js` | دالة `request` المشتركة للاتصال بالـ API |
| `src/services/itemsApi.js` | الأغراض العامة، `normalizeItem`، وإظهار المعتمد والنشط فقط |
| `src/services/adminApi.js` | طلبات لوحة المشرف |
| `src/lib/i18n.jsx`, `src/locales/` | الترجمة (إنجليزية وعربية) |
| `src/lib/theme.js`, `src/lib/install.js` | الوضع الليلي، والتثبيت كتطبيق |
| `src/index.css` | نظام التصميم: الألوان، الخطوط، الأزرار |
| `public/manifest.json`, `public/sw.js`, `public/icons/` | ملفات التطبيق القابل للتثبيت |

## المسارات المحجوزة لبقية الفريق

هذه المسارات تعرض الآن صفحة مؤقتة. عند دمج صفحتك، استبدل السطر الخاص بها في `src/App.jsx`:

| المسار | صاحبه |
|---|---|
| `/report/lost` | Asma |
| `/report/found` | Chaima |
| `/login`, `/register` | Rafika |
| `/items/:id/claim` | Kamel |

## قواعد يجب أن تتبعها كل صفحة جديدة

### 1. الألوان: استعمل الأصناف التي تتبدّل مع الوضع الليلي

| للنصوص والخلفيات العادية | للأسطح التي لا تتغير |
|---|---|
| `text-ink`, `text-ink-2`, `text-muted`, `text-brand-ink` | `bg-brand-500` (الأحمر) |
| `bg-paper`, `bg-paper-2`, `bg-surface` | `bg-coal-900` (الفحمي) |
| `border-ink/10`, `bg-ink/[0.06]` | `text-white`, `text-brand-300` |

لا تكتب ألواناً ثابتة مثل `text-black` أو `bg-white` في صفحة عادية، وإلا انكسرت في الوضع الليلي.

### 2. الأزرار

```jsx
<button className="btn btn-primary">...</button>   // الفعل الرئيسي (أحمر)
<button className="btn btn-dark">...</button>      // الفعل الثاني (فحمي، أبيض في الوضع الليلي)
<button className="btn btn-ghost">...</button>     // زر بإطار
<button className="btn btn-outline">...</button>   // على خلفية داكنة فقط
```

أضف `data-magnetic` للزر الرئيسي في الصفحة إن أردته ينجذب نحو المؤشر.

### 3. النصوص: لا تكتب نصاً مباشرة داخل JSX

```jsx
import { useI18n } from "../lib/i18n";

const { t } = useI18n();
<h1>{t("myPage.title")}</h1>
```

أضف المفتاح نفسه في `src/locales/en.js` و `src/locales/ar.js`.

### 4. الاتجاه: استعمل الأصناف المنطقية

الموقع يعمل من اليمين إلى اليسار بالعربية. استعمل `ps-` `pe-` `ms-` `me-` `start-` `end-` `text-start` بدل `pl-` `pr-` `ml-` `mr-` `left-` `right-` `text-left`. الأسهم تُقلب بإضافة `rtl:-scale-x-100`.

## استعمال ItemCard

```jsx
<ItemCard item={item} />                                    // شبكة (افتراضي)
<ItemCard item={item} variant="list" />                     // قائمة مع وصف
<ItemCard item={item} variant="compact" />                  // صغير (اقتراحات، إشعارات)
<ItemCard item={item} to={null} onClick={openModal} />      // بدون رابط
<ItemCard item={item} actions={<button>Approve</button>} /> // أزرار (لوحة المشرف، بلاغاتي)
```

`item` يجب أن يمرّ على `normalizeItem` من `src/services/itemsApi.js`.

## بنية بيانات الغرض (للتنسيق مع Chaima و Asma و Kamel)

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "type": "lost | found",
  "category": "electronics | personal | documents | clothing | university | accessories | other",
  "location": "string",
  "event_date": "YYYY-MM-DD",
  "created_at": "ISO date",
  "images": ["url", "..."],
  "moderation_status": "pending | approved | rejected",
  "is_active": true,
  "publisher": { "name": "string", "email": "string", "phone": "string|null" }
}
```

إذا تغيّر اسم حقل، يكفي تعديل دالة `normalizeItem`.

## الـ Endpoints التي تحتاجها هذه الواجهة

| Method | Route | ملاحظة |
|---|---|---|
| GET | `/api/items?status=approved&active=true&q=&category=&type=&limit=8&sort=-created_at` | يرجع `{ "data": [...] }` أو مصفوفة |
| GET | `/api/items/:id` | يرجع `{ "data": {...} }` أو كائناً، و 404 إذا لم يوجد |

الواجهة ترسل لغتها في ترويسة `Accept-Language` (`en` أو `ar`). الأغراض غير المعتمدة أو غير النشطة لا تُعرض حتى لو أرسلها الـ API.

## Git

الفرع: `feature/home-items`. الدمج بطلب سحب نحو `dev`، ولا رفع مباشر إلى `main`.

```bash
git checkout feature/home-items
git pull origin feature/home-items
# ... تعديلات ...
git add .
git commit -m "feat: ..."
git push origin feature/home-items
```

---

FindIt منصة تابعة لنادي CyberNexus العلمي.
