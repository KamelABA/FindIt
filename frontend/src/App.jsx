import { useEffect } from "react";
import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AmbientBackground from "./components/AmbientBackground";
import Home from "./pages/Home";
import ItemDetails from "./pages/ItemDetails";
import BrowseItems from "./pages/BrowseItems";
import Placeholder from "./pages/Placeholder";
import { useI18n } from "./lib/i18n";
import { useButtonEffects } from "./lib/buttonEffects";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Layout() {
  const { lang } = useI18n();
  useButtonEffects(); // ripple + magnetic buttons, site-wide

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <AmbientBackground />
      <ScrollToTop />
      <Navbar />
      {/* key = language: the page is rebuilt on a language switch so every text animation replays cleanly */}
      <main key={lang} className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="items" element={<BrowseItems />} />
        <Route path="items/:id" element={<ItemDetails />} />
        {/* Routes owned by other team members – replace when their pages are merged */}
        <Route path="items/:id/claim" element={<Placeholder titleKey="placeholder.claim" />} />
        <Route path="report/lost" element={<Placeholder titleKey="placeholder.reportLost" />} />
        <Route path="report/found" element={<Placeholder titleKey="placeholder.reportFound" />} />
        <Route path="login" element={<Placeholder titleKey="placeholder.login" />} />
        <Route path="register" element={<Placeholder titleKey="placeholder.register" />} />
        <Route path="*" element={<Placeholder titleKey="placeholder.notFound" />} />
      </Route>
    </Routes>
  );
}
