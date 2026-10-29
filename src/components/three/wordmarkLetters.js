/*
 * Letters of the footer wordmark that are drawn in 3D, measured in em and
 * shared by the CSS slots (Wordmark.jsx) and the scenes (models.js). x runs from
 * the left edge of the letter slot, y up from the baseline. Figures match
 * Archivo at 125% width and weight 800.
 */

/* The "I": a CSS stem 0.203em wide, starting 0.085em in, cap height 0.688em,
   with a 3D flag flying from it. */
export const FLAG_LETTER = {
  width: 0.68,
  capHeight: 0.688,
  stemLeft: 0.085,
  stemRight: 0.288,
  margin: 0.05,
};

/* The "O": a football exactly as tall as the letter, overshoot included
   (-0.012em to 0.7em). Its slot is narrower than Archivo's wide O, so the
   letters either side keep their rhythm. */
export const BALL_LETTER = {
  width: 0.82,
  bottom: -0.012,
  diameter: 0.712,
  margin: 0.05,
};
