import type { Metadata } from 'next';
import SellerProfileClient from './SellerProfileClient';

export const metadata: Metadata = {
  title: 'Complete Your Seller Profile — ShopHub',
  description: 'Add your business details and banking information to activate your ShopHub seller account.',
};

export default function SellerProfilePage() {
  return <SellerProfileClient />;
}
