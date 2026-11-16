/**
 * Desktop + mobile images (backend PRD-045 D6, FR-7)
 *
 * The banner and lookbook cover pairs read with or without the PRD-045
 * fields, fall back to the desktop image (then `imgsrc`), and turn a focal
 * point into `object-position`.
 *
 * Keep in sync with the other storefront's `test/responsive-image.test.mjs`
 * (`src/utils/responsive-image.util.js` there).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

const {
  getCategoryBanner,
  getLookbookCover,
  toHeroImageStyle,
  toObjectPosition,
  toObjectViewBox,
} =
  await import("@/utils/responsive-image");

const ref = (url, extra = {}) => ({
  mediaId: "m1",
  url,
  width: 2400,
  height: 1270,
  alt: null,
  focalPoint: null,
  ...extra,
});

describe("getCategoryBanner", () => {
  it("uses the legacy imgsrc on an API without banner", () => {
    const { desktop, mobile } = getCategoryBanner({ imgsrc: "https://cdn/a.jpg" });
    assert.equal(desktop.src, "https://cdn/a.jpg");
    assert.equal(mobile, null);
  });

  it("pairs desktop and mobile, with each focal point", () => {
    const { desktop, mobile } = getCategoryBanner({
      imgsrc: "https://cdn/old.jpg",
      banner: {
        desktop: ref("https://cdn/d.jpg", { alt: "Rings", focalPoint: { x: 0.25, y: 0.5 } }),
        mobile: ref("https://cdn/m.jpg", { width: 1080, height: 1150, focalPoint: { x: 0.5, y: 0.1 } }),
      },
    });
    assert.equal(desktop.src, "https://cdn/d.jpg");
    assert.equal(desktop.alt, "Rings");
    assert.equal(desktop.objectPosition, "25% 50%");
    assert.equal(mobile.src, "https://cdn/m.jpg");
    assert.equal(mobile.width, 1080);
    assert.equal(mobile.objectPosition, "50% 10%");
  });

  it("shows the desktop image everywhere without a mobile one", () => {
    const pair = getCategoryBanner({ banner: { desktop: ref("https://cdn/d.jpg"), mobile: null } });
    assert.equal(pair.desktop.src, "https://cdn/d.jpg");
    assert.equal(pair.mobile, null);
    const same = getCategoryBanner({
      banner: { desktop: ref("https://cdn/d.jpg"), mobile: ref("https://cdn/d.jpg") },
    });
    assert.equal(same.mobile, null);
  });

  it("falls back to the image copy's url and answers nothing without an image", () => {
    const pair = getCategoryBanner({ banner: { desktop: { url: "", image: { url: "https://cdn/c.jpg" } } } });
    assert.equal(pair.desktop.src, "https://cdn/c.jpg");
    assert.deepEqual(getCategoryBanner({ imgsrc: "" }), { desktop: null, mobile: null });
    assert.deepEqual(getCategoryBanner(null), { desktop: null, mobile: null });
  });
});

describe("getLookbookCover", () => {
  const cover = {
    type: "IMAGE",
    url: "https://cdn/cover.jpg",
    alt: "Spring",
    width: 2400,
    height: 1350,
    focalX: 0.3,
    focalY: 0.7,
    mobile: { url: "https://cdn/cover-own-mobile.jpg", width: 900, height: 1200 },
  };

  it("prefers coverMobile, then the cover's own mobile image", () => {
    const withCoverMobile = getLookbookCover({
      cover,
      coverMobile: { url: "https://cdn/cm.jpg", width: 1080, height: 1350, focalX: 0.5, focalY: 0.2 },
    });
    assert.equal(withCoverMobile.desktop.objectPosition, "30% 70%");
    assert.equal(withCoverMobile.mobile.src, "https://cdn/cm.jpg");
    assert.equal(withCoverMobile.mobile.objectPosition, "50% 20%");
    assert.equal(getLookbookCover({ cover }).mobile.src, "https://cdn/cover-own-mobile.jpg");
    assert.equal(getLookbookCover({ cover: { ...cover, mobile: null } }).mobile, null);
  });
});

describe("toObjectPosition", () => {
  it("clamps to 0–1 and ignores a missing point", () => {
    assert.equal(toObjectPosition({ x: 1.5, y: -1 }), "100% 0%");
    assert.equal(toObjectPosition({ x: 0.333, y: 0.5 }), "33.3% 50%");
    assert.equal(toObjectPosition({ x: null, y: 0.5 }), undefined);
    assert.equal(toObjectPosition(undefined), undefined);
  });
});

describe("crop (PRD-045 D5)", () => {
  const crop = { x: 0.1, y: 0.2, width: 0.5, height: 0.6 };

  it("turns a crop into an object-view-box inset", () => {
    assert.equal(toObjectViewBox(crop), "inset(20% 40% 20% 10%)");
    assert.equal(toObjectViewBox({ x: 0, y: 0, width: 1, height: 1 }), undefined);
    assert.equal(toObjectViewBox({ x: 0.8, y: 0, width: 0.5, height: 1 }), undefined);
    assert.equal(toObjectViewBox(null), undefined);
  });

  it("centres the whole image on the crop, and the focal point inside it", () => {
    const { desktop } = getCategoryBanner({ banner: { desktop: ref("https://cdn/d.jpg", { crop }) } });
    assert.equal(desktop.objectViewBox, "inset(20% 40% 20% 10%)");
    assert.equal(desktop.objectPosition, "35% 50%");
    assert.equal(desktop.viewPosition, "50% 50%");
    const focused = getCategoryBanner({
      banner: { desktop: ref("https://cdn/d.jpg", { crop, focalPoint: { x: 0.35, y: 0.8 } }) },
    });
    assert.equal(focused.desktop.objectPosition, "35% 80%");
    assert.equal(focused.desktop.viewPosition, "50% 100%");
  });

  it("writes the mobile variables so a desktop crop never reaches the phone image", () => {
    const { desktop, mobile } = getCategoryBanner({
      banner: {
        desktop: ref("https://cdn/d.jpg", { crop }),
        mobile: ref("https://cdn/m.jpg"),
      },
    });
    const style = toHeroImageStyle(desktop, mobile);
    assert.equal(style["--hero-view-desktop"], "inset(20% 40% 20% 10%)");
    assert.equal(style["--hero-view-mobile"], "none");
    assert.equal(style["--hero-pos-mobile"], "center");
    assert.equal(toHeroImageStyle({ src: "a" }, null), undefined);
  });
});
