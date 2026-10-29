/* Single source of truth for Diwali pricing. Original catalogue prices stay unchanged. */
const DIWALI_SALE = true;
const DIWALI_DISCOUNT = 50; // percent

globalThis.ECHO_DIWALI_CONFIG = Object.freeze({ DIWALI_SALE, DIWALI_DISCOUNT });
