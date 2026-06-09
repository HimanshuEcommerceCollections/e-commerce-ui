import Image from 'next/image';

interface TestimonialCardProps {
  review: string;
  name: string;
}

export default function TestimonialCard({ review, name }: TestimonialCardProps) {
  return (
    <div className="testimonial-card">
      <div className="testimonial-stars">
        {[...Array(5)].map((_, i) => (
          <Image
            key={i}
            src="/flashsale/star.png"
            alt="Star"
            width={19}
            height={19}
          />
        ))}
      </div>
      <p className="testimonial-review">{review}</p>
      <div className="testimonial-footer">
        <span className="testimonial-name">{name}</span>
        <div className="testimonial-verified">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 7L5.5 10L11.5 4" stroke="#111827" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="testimonial-verified-text">Verified Purchase</span>
        </div>
      </div>
    </div>
  );
}
