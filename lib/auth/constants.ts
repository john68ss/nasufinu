const isProd = process.env.NODE_ENV === "production";

/** __Host- prefix (Secure, Path=/, no Domain) is only possible over HTTPS, so production only. */
export const SESSION_COOKIE = isProd ? "__Host-pearl_session" : "pearl_session";

export const LOGIN_PATH = "/login";
export const HOME_PATH = "/";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
};
