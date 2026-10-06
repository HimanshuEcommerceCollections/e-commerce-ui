// Help center contact form and seller applications (designs 10 and 11).

export interface SupportMessageRequest {
  name: string;
  email: string;
  topic: string;
  orderNumber?: string;
  /** 10–1,500 characters. */
  message: string;
}

export interface SellerApplicationRequest {
  fullName: string;
  email: string;
  phone: string;
  categories: string[];
  products: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  consent: true;
}
