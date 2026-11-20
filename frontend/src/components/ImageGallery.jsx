import { useRef, useState } from "react";
import Icon from "./Icon";
import { gsap, useGSAP, motionOK } from "../lib/gsap";
import { useI18n } from "../lib/i18n";

// the arrows sit on the picture: fixed colours in both themes
const navBtn =
  "absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-coal-900 shadow-sm transition duration-200 hover:bg-coal-50 active:scale-95";

/** Main image + clickable thumbnails. Falls back to a placeholder icon if no images. */
export default function ImageGallery({ images = [], alt = "", fallbackIcon = "other" }) {
  const { t, isRTL } = useI18n();
  const [active, setActive] = useState(0);
  const frame = useRef(null);
  const direction = useRef(1); // 1 = forward, -1 = back: the side the next image slides in from

  const index = Math.min(active, Math.max(images.length - 1, 0));

  // Slide + fade the image each time it changes (GSAP, transform + opacity only).
  // "Forward" comes from the end side: the right in English, the left in Arabic.
  useGSAP(
    () => {
      if (!motionOK() || !frame.current) return;
      const side = direction.current * (isRTL ? -1 : 1);
      gsap.fromTo("[data-gallery-image]", { xPercent: 4 * side, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.35, ease: "power2.out" });
    },
    { dependencies: [index], scope: frame }
  );

  if (!images.length) {
    return (
      <div
        className="grid aspect-[4/3] w-full place-items-center rounded-3xl border border-ink/10 bg-paper-2 text-ink/25"
        role="img"
        aria-label={t("gallery.none")}
      >
        <Icon name={fallbackIcon} className="h-24 w-24" strokeWidth={1} />
      </div>
    );
  }

  const show = (next, dir) => {
    direction.current = dir;
    setActive(next);
  };

  return (
    <div className="space-y-3">
      <div ref={frame} className="relative overflow-hidden rounded-3xl border border-ink/10 bg-paper-2">
        <img
          data-gallery-image
          src={images[index]}
          alt={alt}
          width="800"
          height="600"
          className="aspect-[4/3] w-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label={t("gallery.previous")}
              onClick={() => show((index - 1 + images.length) % images.length, -1)}
              className={`${navBtn} start-3`}
            >
              <Icon name="chevron-left" className="h-5 w-5 rtl:-scale-x-100" />
            </button>
            <button
              type="button"
              aria-label={t("gallery.next")}
              onClick={() => show((index + 1) % images.length, 1)}
              className={`${navBtn} end-3`}
            >
              <Icon name="chevron-right" className="h-5 w-5 rtl:-scale-x-100" />
            </button>
            <span dir="ltr" className="absolute bottom-3 end-3 rounded-full bg-coal-900 px-3 py-1 text-xs font-semibold tabular-nums text-white">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-1">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => show(i, i >= index ? 1 : -1)}
              aria-label={t("gallery.show", i + 1)}
              aria-current={i === index}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-paper transition duration-200 ${
                i === index ? "ring-brand-500" : "opacity-70 ring-transparent hover:opacity-100"
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
