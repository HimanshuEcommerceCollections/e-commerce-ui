import Image from "next/image";

export interface ProductCardData {
  badge: string;
  brand: string;
  name: string;
  rating: number;
  reviews: string;
  price: string;
  original: string;
  imgGradient: string;
  shipping?: string;
  variant?: "flash" | "trending";
}

export default function ProductCard({
  badge,
  brand,
  name,
  reviews,
  price,
  original,
  imgGradient,
  shipping,
  variant = "flash",
}: ProductCardData) {
  /* Trending variant: taller card to fit shipping + larger button */
  const cardHeight = variant === "trending" ? "h-[296px]" : "h-[264px]";

  return (
    <div className={`relative w-[243px] ${cardHeight} bg-white border-[0.5px] border-[#E2E8F0] shadow-[0px_4px_12px_rgba(0,0,0,0.07)] rounded-[10px] overflow-hidden flex-shrink-0`}>

      {/* img-fd: 243×152 gradient image area */}
      <div className="absolute top-0 left-0 w-[243px] h-[152px] rounded-t-[10px] overflow-hidden" style={{ background: imgGradient }} />

      {/* fd-db: 56×20 red discount badge, left:8 top:8 */}
      <div className="absolute top-[8px] left-[8px] w-[56px] h-[20px] bg-[#DC2626] rounded-[4px] flex items-center justify-center text-[10px] font-bold leading-[12px] text-white">{badge}</div>

      {/* fd-wi: 22×22 wishlist heart, left:213 top:8 */}
      <div className="absolute top-[8px] left-[213px] w-[22px] h-[22px] flex items-center justify-center">
        <Image src="/flashicons/fd-wi4.png" alt="Wishlist" width={16} height={16} />
      </div>

      {/* fd-b: brand name, left:10 top:160 */}
      <p className="absolute top-[160px] left-[10px] text-[10px] font-medium leading-[12px] text-[#2563EB]">{brand}</p>

      {/* fd-n: product name, left:10 top:174 */}
      <p className="absolute top-[174px] left-[10px] w-[223px] text-[13px] font-semibold leading-[18px] text-[#0F172A] line-clamp-1">{name}</p>

      {/* fd-st: 5 stars + review count row, top:199 left:10 */}
      <div className="absolute top-[199px] left-[10px] flex items-center gap-[2px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Image
            key={i}
            src="/flashicons/fd-st4-3.png"
            alt=""
            width={12}
            height={12}
            className="w-[12px] h-[12px] flex-shrink-0"
          />
        ))}
      </div>

      {/* fd-rc: review count, left:82 top:200 */}
      <span className="absolute top-[200px] left-[82px] text-[11px] font-normal leading-[13px] text-[#94A3B8]">({reviews})</span>

      {/* fd-p: price, left:10 top:218 */}
      <span className="absolute top-[218px] left-[10px] text-[17px] font-bold leading-[21px] text-[#0F172A]">{price}</span>

      {/* fd-o: original price struck, left:56 top:222 */}
      <span className="absolute top-[222px] left-[56px] text-[12px] font-normal leading-[15px] line-through text-[#DC2626]">{original}</span>

      {/* Shipping label for trending variant */}
      {variant === "trending" && shipping && (
        <p className="absolute top-[236px] left-[10px] text-[11px] font-medium leading-[13px] text-[#16A34A] flex items-center gap-[4px]">✓ {shipping}</p>
      )}

      {/* fd-acb: 223×18 Add to Cart button, left:10 top:240 */}
      {variant === "flash" ? (
        <button className="absolute top-[240px] left-[10px] w-[223px] h-[18px] bg-[#2563EB] rounded-[6px] flex items-center justify-center text-[11px] font-semibold leading-[13px] text-white">Add to Cart</button>
      ) : (
        <button className="absolute top-[252px] left-[10px] w-[223px] h-[34px] bg-[#2563EB] rounded-[8px] flex items-center justify-center text-[13px] font-semibold text-white">Add to Cart</button>
      )}

    </div>
  );
}
