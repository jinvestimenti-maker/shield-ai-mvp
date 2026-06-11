const PRESERVE_INSTRUCTION =
  "CRITICAL: Preserve exactly the product's logo, label/packaging text, and shape/silhouette as they appear in the original photo. Do not redraw, distort, recolor, warp, or replace the logo, label, or product shape in any way.";

export const AD_STYLES = {
  floating: {
    label: "Floating Product",
    description:
      "Fotografia pubblicitaria da studio, prodotto fluttuante con vortice interno, splash congelati e ghiaccio, stile still-life realistico",
    prompt: `High-end commercial advertising photography for beverages, international campaign style. The product floats at the center of a vertical composition, slightly tilted for a sense of dynamism. Inside the product, the liquid is in motion: an elegant, natural, physically believable vortex. Around the product, photorealistic high-speed water splashes frozen by studio flash, with sharp droplets catching the light. 2-3 crystal-clear ice cubes suspended in mid-air. Realistic condensation on the product's surface. Lighting: studio setup with a side softbox and a backlight/rim light for contrast, dark background with a subtle gradient, a soft reflection of the product on the surface below. Shot on an 85mm lens at f/8, everything in sharp focus, advertising still-life quality, cool cinematic color grading. The image must look like a real photograph taken in a studio, NOT a digital render.
ABSOLUTELY FORBIDDEN: halo or glow around the product, glowing outlines, sparkling particles, magic dust, fantasy effects, oversaturation, video-game look.
PRESERVE identically: the logo, label, text, colors, and exact shape of the product from the original photo.`
  },
  minimal: {
    label: "Minimal",
    description: "Sfondo chiaro pulito, ombre morbide, elegante",
    prompt: `Turn this product photo into a premium advertising image. Place the product on a clean, light, minimal background (soft white or light neutral tones) with soft, natural shadows beneath it. Keep the composition elegant, airy, and uncluttered, with subtle soft studio lighting. ${PRESERVE_INSTRUCTION} Output a polished, high-resolution advertising image.`
  },
  social: {
    label: "Social Lifestyle",
    description: "Contesto lifestyle, luce naturale, colori vivaci",
    prompt: `Turn this product photo into a vibrant social media advertising image. Place the product in a realistic lifestyle context (e.g. on a table, in someone's hands, or in an everyday setting) with natural daylight and bright, vivid colors. The scene should feel candid and aspirational, suited for an Instagram post. ${PRESERVE_INSTRUCTION} Output a polished, high-resolution advertising image.`
  }
};

export const AD_STYLE_KEYS = Object.keys(AD_STYLES);

export function isValidAdStyle(style) {
  return AD_STYLE_KEYS.includes(style);
}
