// English strings. Keep the same keys in ar.js.
export default {
  skip: "Skip to content",
  brand: { tagline: "lost it ? find it !" },

  nav: {
    home: "Home",
    browse: "Browse Items",
    reportLost: "Report Lost",
    reportFound: "Report Found",
    login: "Login",
    register: "Register",
    main: "Main navigation",
    homeAria: "FindIt home",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menu: "Menu",
    by: "by",
    ownerLine: "A platform by",
    club: "scientific club",
  },

  theme: { toLight: "Switch to light mode", toDark: "Switch to dark mode" },
  lang: { label: "العربية", short: "ع", aria: "عرض الموقع بالعربية" },

  hero: {
    aria: "Lost something? Let’s Find It!",
    line1: "Lost something?",
    line2: "Let’s",
    line2Accent: "Find It!",
    intro:
      "Lost your student card in the library or found a phone in the amphitheatre? FindIt connects students who lose things with those who find them — quickly and safely.",
  },

  search: {
    label: "Search items",
    placeholder: "Search for a phone, keys, student card…",
    prefix: "Search for",
    words: ["a phone", "your keys", "a student card", "a backpack", "a calculator", "a watch"],
    button: "Search",
  },

  marquee: ["Phones", "Keys", "Student cards", "Backpacks", "Wallets", "Calculators", "Watches", "Glasses", "Chargers", "Notebooks"],

  steps: {
    aria: "How it works",
    eyebrow: "How it works",
    title: "Three steps to get it back",
    subtitle: "From the moment it goes missing to the moment it is in your hands again.",
    report: { title: "Report", text: "Describe what you lost or found, add a photo and where it happened." },
    match: { title: "Match", text: "Search approved reports by keyword, category or place on campus." },
    reunite: { title: "Reunite", text: "Contact the publisher and meet in a public place to hand the item back." },
  },

  categoriesSection: { eyebrow: "Categories", title: "Browse by category", subtitle: "Narrow your search in one click." },
  latest: {
    eyebrow: "Notice board",
    title: "Latest items",
    subtitle: "Recently approved lost and found reports.",
    viewAll: "View all",
    emptyTitle: "No items published yet",
    emptyText: "Be the first to report a lost or found item.",
  },

  categories: {
    electronics: { label: "Electronics", description: "Phones, laptops, chargers, earbuds" },
    personal: { label: "Personal Items", description: "Wallets, keys, bags, glasses" },
    documents: { label: "Documents", description: "Student cards, IDs, papers" },
    clothing: { label: "Clothing", description: "Jackets, scarves, caps" },
    university: { label: "University Items", description: "Books, notebooks, USB keys" },
    accessories: { label: "Accessories", description: "Watches, jewelry, bottles" },
    other: { label: "Other", description: "Anything else" },
  },
  items: (n) => `${n} ${n === 1 ? "item" : "items"}`,

  types: { lost: "Lost", found: "Found", all: "All" },

  browse: {
    eyebrow: "Browse items",
    allItems: "All items",
    results: (n) => (n === 1 ? "result" : "results"),
    loading: "Loading…",
    typeLabel: "Lost or found",
    categoryLabel: "Category",
    allCategories: "All categories",
    clear: "Clear filters",
    emptyTitle: "No matching items",
    emptyText: "Try another keyword or category.",
  },

  details: {
    loading: "Loading item…",
    notFound: "This item doesn’t exist or is no longer available.",
    back: "Back to items",
    crumbHome: "Home",
    crumbItems: "Items",
    breadcrumb: "Breadcrumb",
    published: "Published",
    category: "Category",
    location: "Location",
    dateLost: "Date lost",
    dateFound: "Date found",
    publishedOn: "Published on",
    description: "Description",
    noDescription: "No description provided.",
    contact: "Contact publisher",
    publisher: "Publisher",
    tip: "Tip: meet in a public place on campus and ask for a detail only the owner would know.",
    claim: "This is mine – Claim item",
    claimNote: "You’ll be asked to log in and prove ownership.",
  },

  gallery: { previous: "Previous image", next: "Next image", show: (n) => `Show image ${n}`, none: "No image" },

  states: {
    loading: "Loading…",
    errorTitle: "Couldn’t load data",
    retry: "Try again",
    network: "Can’t reach the server. Check your connection and try again.",
    notFound: "Item not found",
    server: (status) => `Server error (${status})`,
    generic: "Something went wrong.",
  },

  footer: {
    tagline: "Lost it?",
    taglineAccent: "Find it!",
    about: "Lost it? Find it! The lost & found platform of our university.",
    platform: "Platform",
    categories: "Categories",
    help: "Need help?",
    helpText: "Found something valuable? You can also drop it at the student affairs office.",
    ownedBy: "Owned & developed by",
    club: "Scientific club",
    motto: ["Ambition", "Discipline", "Passion"],
    rights: (year) => `© ${year} FindIt · CyberNexus scientific club. All rights reserved.`,
    project: "University project",
    logoAlt: "CyberNexus logo",
  },

  install: {
    aria: "Install FindIt as an app",
    tooltip: "Install the app",
    cta: "Install the app",
    title: "Install FindIt",
    subtitle: "One tap from your home screen. No app store needed.",
    now: "Install now",
    installing: "Installing…",
    close: "Close",
    owner: "A CyberNexus scientific club platform",
    ios: {
      title: "Install on iPhone or iPad",
      steps: [
        "Tap the Share button in Safari’s toolbar.",
        "Choose “Add to Home Screen”.",
        "Tap “Add”. FindIt now opens like any other app.",
      ],
    },
    android: {
      title: "Install on Android",
      steps: [
        "Open the browser menu (the three dots).",
        "Choose “Install app” or “Add to Home screen”.",
        "Confirm. FindIt appears among your apps.",
      ],
    },
    desktop: {
      title: "Install on this computer",
      steps: [
        "Look for the install icon at the end of the address bar.",
        "Click it, or open the browser menu and choose “Install FindIt”.",
        "FindIt opens in its own window, with a shortcut on your desktop.",
      ],
    },
  },

  placeholder: {
    claim: "Claim item",
    reportLost: "Report a lost item",
    reportFound: "Report a found item",
    login: "Login",
    register: "Register",
    notFound: "Page not found",
    badge: "Under construction",
    text: "This page is under construction.",
    back: "Back to home",
  },
};
