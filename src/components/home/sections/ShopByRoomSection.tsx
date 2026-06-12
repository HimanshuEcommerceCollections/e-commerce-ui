import Image from 'next/image';

const rooms = [
  {
    image: '/shoproomimages/Image (Living Room).png',
    title: 'Living Room',
    subtext: 'Modern comfort meets style',
  },
  {
    image: '/shoproomimages/Image (Bedroom).png',
    title: 'Bedroom',
    subtext: 'Your personal sanctuary',
  },
  {
    image: '/shoproomimages/Image (Kitchen).png',
    title: 'Kitchen',
    subtext: 'Cook with confidence',
  },
  {
    image: '/shoproomimages/Image (Workspace).png',
    title: 'Workspace',
    subtext: 'Productivity perfected',
  },
  {
    image: '/shoproomimages/Image (Outdoor Space).png',
    title: 'Outdoor Space',
    subtext: 'Embrace the outdoors',
  },
  {
    image: '/shoproomimages/Image (Kids Room).png',
    title: 'Kids Room',
    subtext: 'Play and grow',
  },
];

export default function ShopByRoomSection() {
  return (
    <section className="flex w-full flex-col items-center bg-white py-12 max-md:py-6">
      <div className="mx-auto flex w-full max-w-[1384px] flex-col items-start px-12 max-md:px-4">
        <h2 className="mb-[38px] text-[36px] font-bold leading-[43px] text-[#0F172A] [font-family:'Inter',sans-serif] max-md:text-[26px] max-md:leading-[32px]">Shop By Room</h2>
        <div className="grid w-full grid-cols-3 gap-[29px] max-lg:grid-cols-2 max-sm:grid-cols-1">
          {rooms.map((room, index) => (
            <div className="relative h-[461px] overflow-hidden rounded-[29px] max-md:h-[360px]" key={index}>
              <Image
                src={room.image}
                alt={room.title}
                fill
                style={{ objectFit: 'cover' }}
              />
              <div className="absolute left-0 top-0 z-[1] h-full w-full bg-[linear-gradient(0deg,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.3)_50%,rgba(0,0,0,0)_100%)]" />
              <div className="absolute bottom-0 left-0 z-[2] flex w-full flex-col items-start p-[38px] max-md:p-6">
                <h3 className="m-0 text-[29px] font-bold leading-[38px] text-white [font-family:'Inter',sans-serif]">{room.title}</h3>
                <p className="mb-[19px] mt-[10px] text-[19px] font-normal leading-[29px] text-white/80 [font-family:'Inter',sans-serif]">{room.subtext}</p>
                <button className="inline-flex cursor-pointer items-center justify-center rounded-full border-none bg-white px-[25px] py-[14px] text-[17px] font-semibold leading-6 text-[#0F172A] [font-family:'Inter',sans-serif]">Shop This Room</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
