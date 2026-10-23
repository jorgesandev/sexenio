import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { strings } from "@/lib/strings";

export default function NotFound() {
  return (
    <div className="px-4 py-16 lg:px-6">
      <p className="eyebrow">{strings.notFound.eyebrow}</p>
      <h1 className="page-title mt-2">{strings.notFound.title}</h1>
      <p className="mt-4 text-sm leading-6 text-muted">
        {strings.notFound.body}
      </p>
      <Link href={ROUTES.explorar} className="btn btn-primary mt-6">
        {strings.notFound.action}
      </Link>
    </div>
  );
}
