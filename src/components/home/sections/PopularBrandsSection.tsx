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
    <section className="flex w-full flex-col items-center bg-white py-12 max-md:py-6">
      <div className="mx-auto flex w-full max-w-[1384px] flex-col items-start px-12 max-md:px-4">
        <h2 className="mb-[38px] w-full text-center text-[36px] font-bold leading-[43px] text-[#0F172A] [font-family:'Inter',sans-serif] max-md:text-[26px] max-md:leading-[32px]">Popular Brands</h2>
        <div className="grid w-full grid-cols-6 gap-[29px] max-lg:grid-cols-3 max-md:gap-4 max-sm:grid-cols-2">
          {brands.map((brand, index) => (
            <div className="flex h-[115px] items-center justify-center rounded-[19px] bg-[#F8FAFC]" key={index}>
              <span className="text-center text-[24px] font-semibold leading-[34px] text-[#6B7280] [font-family:'Inter',sans-serif]">{brand}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
