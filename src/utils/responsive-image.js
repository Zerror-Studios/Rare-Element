/**
 * Desktop + mobile images (backend PRD-045 D6, FR-7)
 *
 * The collection banner (`Category.banner`, an `ImageRef` pair) and the
 * lookbook cover (`coverMobile`, else the cover's own `mobile`) as one
 * `{ desktop, mobile }` pair for `ResponsiveHeroImage`:
 * - `mobile` is null when there is none (or it is the desktop file), and
 *   the desktop image then shows at every width;
 * - the category falls back to the deprecated `imgsrc` when the API has no
 *   `banner` (a kit or backend older than PRD-045);
 * - a focal point (0–1) becomes a CSS `object-position`;
 * - a crop (fractions of the image) becomes a CSS `object-view-box`, so
 *   only the cropped part fills the hero. Browsers without
 *   `object-view-box` (Safari and Firefox today) centre the whole image on
 *   the crop instead (`toHeroImageStyle`, the store's CSS).
 *
 * Every field is read defensively: the page works with or without them.
 * Pure functions, no imports, so `node:test` loads them directly.
 *
 * Keep in sync with `storefronts/deveshe-dreams/src/utils/responsive-image.util.js`.
 */

// ─── Constants ────────────────────────────────────────────────────────────

/** Below this width the mobile image shows (the store's 750 px breakpoint). */
export const MOBILE_IMAGE_MEDIA = "(max-width: 749.98px)";

// ─── Helpers ──────────────────────────────────────────────────────────────

const isFraction = (value) =>
  typeof value === "number" && Number.isFinite(value);

const toPercent = (value) =>
  `${Math.round(Math.min(Math.max(value, 0), 1) * 10000) / 100}%`;

/** `{ x, y }` (0–1) as `"x% y%"`, or undefined without a usable point. */
export const toObjectPosition = (point) =>
  isFraction(point?.x) && isFraction(point?.y)
    ? `${toPercent(point.x)} ${toPercent(point.y)}`
    : undefined;

const toSize = (value) =>
  typeof value === "number" && value > 0 ? value : null;

const isCrop = (crop) =>
  [crop?.x, crop?.y, crop?.width, crop?.height].every(isFraction) &&
  crop.width > 0 &&
  crop.height > 0 &&
  crop.x >= 0 &&
  crop.y >= 0 &&
  crop.x + crop.width <= 1.0001 &&
  crop.y + crop.height <= 1.0001 &&
  (crop.width < 1 || crop.height < 1);

const toInsetPercent = (value) => toPercent(Math.max(value, 0));

/** A crop as `inset(top right bottom left)` for `object-view-box`. */
export const toObjectViewBox = (crop) =>
  isCrop(crop)
    ? `inset(${toInsetPercent(crop.y)} ${toInsetPercent(
        1 - crop.x - crop.width,
      )} ${toInsetPercent(1 - crop.y - crop.height)} ${toInsetPercent(crop.x)})`
    : undefined;

/** The focal point inside the crop (as `object-position` of the cropped view). */
const toViewPosition = (point, crop) =>
  isFraction(point?.x) && isFraction(point?.y)
    ? toObjectPosition({
        x: (point.x - crop.x) / crop.width,
        y: (point.y - crop.y) / crop.height,
      })
    : "50% 50%";

const toImage = ({ src, width, height, alt, focalPoint, crop }) => {
  if (!src) return null;
  const cropped = isCrop(crop);
  return {
    src,
    width: toSize(width),
    height: toSize(height),
    alt: alt || null,
    // Without object-view-box the whole image shows: centre it on the
    // focal point, else on the crop.
    objectPosition:
      toObjectPosition(focalPoint) ||
      (cropped
        ? toObjectPosition({
            x: crop.x + crop.width / 2,
            y: crop.y + crop.height / 2,
          })
        : undefined),
    objectViewBox: cropped ? toObjectViewBox(crop) : undefined,
    viewPosition: cropped ? toViewPosition(focalPoint, crop) : undefined,
  };
};

const fromImageRef = (ref) =>
  ref
    ? toImage({
        src: ref.url || ref.image?.url,
        width: ref.width ?? ref.image?.width,
        height: ref.height ?? ref.image?.height,
        alt: ref.alt,
        focalPoint: ref.focalPoint,
        crop: ref.crop,
      })
    : null;

const toPair = (desktop, mobile) => {
  if (!desktop) return { desktop: mobile || null, mobile: null };
  return {
    desktop,
    mobile: mobile && mobile.src !== desktop.src ? mobile : null,
  };
};

// ─── Styles ───────────────────────────────────────────────────────────────

/**
 * The CSS variables the store's `.responsive_hero_img` rule reads, per
 * breakpoint: `--hero-pos-*` (object-position of the whole image),
 * `--hero-view-*` (object-view-box, `none` without a crop) and
 * `--hero-viewpos-*` (object-position inside the crop). The mobile set is
 * written whenever there is a mobile image, so a desktop crop never leaks
 * onto it. Undefined when there is nothing to set.
 */
export const toHeroImageStyle = (desktop, mobile = null) => {
  const style = {};
  const put = (name, value) => {
    if (value) style[name] = value;
  };
  const hasCrop = Boolean(desktop?.objectViewBox || mobile?.objectViewBox);
  put("--hero-pos-desktop", desktop?.objectPosition);
  if (hasCrop) {
    put("--hero-view-desktop", desktop?.objectViewBox || "none");
    put("--hero-viewpos-desktop", desktop?.viewPosition);
  }
  if (mobile) {
    put("--hero-pos-mobile", mobile.objectPosition || "center");
    if (hasCrop) {
      put("--hero-view-mobile", mobile.objectViewBox || "none");
      put("--hero-viewpos-mobile", mobile.viewPosition || "center");
    }
  }
  return Object.keys(style).length ? style : undefined;
};

// ─── Pairs ────────────────────────────────────────────────────────────────

/** A collection's banner: `banner.desktop` (else `imgsrc`) and `banner.mobile`. */
export const getCategoryBanner = (category) => {
  const desktop =
    fromImageRef(category?.banner?.desktop) ||
    toImage({ src: category?.imgsrc });
  return toPair(desktop, fromImageRef(category?.banner?.mobile));
};

/** A lookbook's cover: `cover` and `coverMobile` (else the cover's `mobile`). */
export const getLookbookCover = (lookbook) => {
  const cover = lookbook?.cover;
  const focalPoint = { x: cover?.focalX, y: cover?.focalY };
  const desktop = toImage({
    src: cover?.url,
    width: cover?.width,
    height: cover?.height,
    alt: cover?.alt,
    focalPoint,
  });
  const coverMobile = lookbook?.coverMobile;
  const mobile = coverMobile?.url
    ? toImage({
        src: coverMobile.url,
        width: coverMobile.width,
        height: coverMobile.height,
        alt: coverMobile.alt,
        focalPoint: { x: coverMobile.focalX, y: coverMobile.focalY },
      })
    : toImage({
        src: cover?.mobile?.url,
        width: cover?.mobile?.width,
        height: cover?.mobile?.height,
        alt: cover?.alt,
        focalPoint,
      });
  return toPair(desktop, mobile);
};
