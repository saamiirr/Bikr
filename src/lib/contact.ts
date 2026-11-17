// Shop phone / WhatsApp number — change it here only.

/** International format for WhatsApp links: country code 20 (Egypt), no "+" or leading 0. */
export const WHATSAPP_NUMBER = "201101195535";

/** How the number is shown on the site. */
export const PHONE_DISPLAY = "+20 110 119 5535";

/** wa.me link, optionally with a pre-filled message. */
export const whatsappLink = (text?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
