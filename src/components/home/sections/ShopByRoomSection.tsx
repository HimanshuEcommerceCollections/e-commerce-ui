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
    <section className="shopbyroom-section">
      <div className="shopbyroom-container">
        <h2 className="shopbyroom-heading">Shop By Room</h2>
        <div className="shopbyroom-grid">
          {rooms.map((room, index) => (
            <div className="room-card" key={index}>
              <Image
                src={room.image}
                alt={room.title}
                fill
                style={{ objectFit: 'cover' }}
              />
              <div className="room-card-overlay" />
              <div className="room-card-content">
                <h3 className="room-card-title">{room.title}</h3>
                <p className="room-card-subtext">{room.subtext}</p>
                <button className="room-card-btn">Shop This Room</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
