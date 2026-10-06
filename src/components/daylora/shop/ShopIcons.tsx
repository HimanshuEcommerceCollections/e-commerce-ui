/**
 * Icons the listing and product pages need beyond the shared sprite
 * (product types and the size chart), from designs 02/03.
 */
const S = { stroke: "currentColor", fill: "none", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function ShopIconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="i-pants" viewBox="0 0 24 24"><path {...S} d="M7 3h10l1.5 18h-4.2L12 9.5 9.7 21H5.5z" /><path {...S} d="M7 6.5h10" /></symbol>
      <symbol id="i-dress" viewBox="0 0 24 24"><path {...S} d="M9 3l-.5 4.5L6 21h12L15.5 7.5 15 3" /><path {...S} d="M9 3c.7 1.2 1.7 1.8 3 1.8S14.3 4.2 15 3M8.5 8h7" /></symbol>
      <symbol id="i-hoodie" viewBox="0 0 24 24"><path {...S} d="M9 4.5C9 3 10.3 2.5 12 2.5s3 .5 3 2l4.5 2.5L21 18h-3.5V21h-11v-3H3l1.5-11z" /><path {...S} d="M9 4.5c0 2 1.3 3.5 3 3.5s3-1.5 3-3.5M10.5 8v3M13.5 8v3M8.5 16h7" /></symbol>
      <symbol id="i-jacket" viewBox="0 0 24 24"><path {...S} d="M9 3L4 6l-1 14h4l1-8v9h8v-9l1 8h4L20 6l-5-3-3 4z" /><path {...S} d="M12 7v14" /></symbol>
      <symbol id="i-ruler" viewBox="0 0 24 24"><path {...S} d="M3 16.5L16.5 3 21 7.5 7.5 21z" /><path {...S} d="M7 12.5l1.8 1.8M9.8 9.7l2.6 2.6M12.6 6.9l1.8 1.8" /></symbol>
    </svg>
  );
}
