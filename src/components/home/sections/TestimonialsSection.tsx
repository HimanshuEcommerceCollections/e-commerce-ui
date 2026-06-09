import TestimonialCard from '../cards/TestimonialCard';

const testimonials = [
  {
    review: 'Absolutely love shopping here! Fast shipping and great quality products. Will definitely order again.',
    name: 'Sarah Johnson',
  },
  {
    review: 'Best online shopping experience ever. Customer service is outstanding and prices are unbeatable.',
    name: 'Michael Chen',
  },
  {
    review: 'The product selection is amazing and everything arrives perfectly packaged. Highly recommend!',
    name: 'Emma Williams',
  },
];

const stats = [
  { number: '5M+', label: 'Happy Customers' },
  { number: '1M+', label: 'Product Reviews' },
  { number: '98%', label: 'Satisfaction Rate' },
];

export default function TestimonialsSection() {
  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <h2 className="testimonials-heading">What Our Customers Say</h2>
        <div className="testimonials-grid">
          {testimonials.map((item, index) => (
            <TestimonialCard key={index} review={item.review} name={item.name} />
          ))}
        </div>
        <div className="testimonials-stats">
          {stats.map((stat, index) => (
            <div className="testimonials-stat-item" key={index}>
              <p className="testimonials-stat-number">{stat.number}</p>
              <p className="testimonials-stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
