const brands = [
  'Apple',
  'Samsung',
  'Sony',
  'Nike',
  'Adidas',
  "Levi's",
  'Dyson',
  'KitchenAid',
  'LG',
  'Bose',
  'HP',
  'Dell',
];

export default function PopularBrandsSection() {
  return (
    <section className="brands-section">
      <div className="brands-container">
        <h2 className="brands-heading">Popular Brands</h2>
        <div className="brands-grid">
          {brands.map((brand, index) => (
            <div className="brand-card" key={index}>
              <span className="brand-card-name">{brand}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
