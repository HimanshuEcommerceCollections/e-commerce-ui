import type { Metadata } from 'next';
import SellerSignupClient from './SellerSignupClient';

export const metadata: Metadata = {
  title: 'Seller Signup — ShopHub Seller Center',
  description: 'Join 50,000+ sellers on ShopHub. Zero upfront cost, start listing in minutes.',
};

export default function SellerSignupPage() {
  return <SellerSignupClient />;
}
