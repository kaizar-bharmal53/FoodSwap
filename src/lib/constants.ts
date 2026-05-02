/** UAE VAT rate — 5% */
export const TAX_RATE = 0.05;

/** Session cookie name */
export const COOKIE_NAME = "pos_session";

/** Session lifetime: 7 days in seconds */
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

/** JWT issuer + audience binding — both sides must match on verify */
export const JWT_ISSUER = "foodswap";
export const JWT_AUDIENCE = "foodswap";
