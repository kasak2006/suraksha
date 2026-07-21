import createMiddleware from "next-intl/middleware";
import { routing } from "./lib/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip api routes, Next internals and files with extensions (assets)
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
