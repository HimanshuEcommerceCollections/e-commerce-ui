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
  return (
    <div className={`product-card${variant === "trending" ? " product-card--trending" : ""}`}>

      {/* img-fd: 243×152 gradient image area */}
      <div className="product-card-img" style={{ background: imgGradient }} />

      {/* fd-db: 56×20 red discount badge, left:8 top:8 */}
      <div className="product-card-badge">{badge}</div>

      {/* fd-wi: 22×22 wishlist heart, left:213 top:8 */}
      <div className="product-card-wishlist">
        <Image src="/flashicons/fd-wi4.png" alt="Wishlist" width={16} height={16} />
      </div>

      {/* fd-b: brand name, left:10 top:160 */}
      <p className="product-card-brand">{brand}</p>

      {/* fd-n: product name, left:10 top:174 */}
      <p className="product-card-name">{name}</p>

      {/* fd-st: 5 stars + review count row, top:199 left:10 */}
      <div className="product-card-stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <Image
            key={i}
            src="/flashicons/fd-st4-3.png"
            alt=""
            width={12}
            height={12}
            className="product-card-star"
          />
        ))}
      </div>

      {/* fd-rc: review count, left:82 top:200 */}
      <span className="product-card-reviews">({reviews})</span>

      {/* fd-p: price, left:10 top:218 */}
      <span className="product-card-price">{price}</span>

      {/* fd-o: original price struck, left:56 top:222 */}
      <span className="product-card-original">{original}</span>

      {/* Shipping label for trending variant */}
      {variant === "trending" && shipping && (
        <p className="product-card-shipping">✓ {shipping}</p>
      )}

      {/* fd-acb: 223×18 Add to Cart button, left:10 top:240 */}
      {variant === "flash" ? (
        <button className="product-card-atc-btn">Add to Cart</button>
      ) : (
        <button className="product-card-atc-btn-lg">Add to Cart</button>
      )}

    </div>
  );
}
