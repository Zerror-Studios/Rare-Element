import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";

// PRD-014 UX-36: the site's own status layout (plain CSS, no Tailwind).
export default function NotFound() {
  return (
    <div className="status_section center">
      <div className="status_section_inner">
        <h1 className="text-3xl">Page not found</h1>
        <p className="text-base">
          The page you are looking for does not exist or has moved.
        </p>
        <div className="w-full">
          <GreenBoxBtn type="button" title="Return home" href="/" />
        </div>
      </div>
    </div>
  );
}
