import CheckoutClient from './checkout-client'
import { redirect } from 'next/navigation'

export const metadata = {
  title: "Checkout – Complete Your Nahara Jewellery Purchase",
  description: "Secure checkout for purchasing fine jewellery from Nahara. Fast delivery, trusted payments.",
  keywords: ["Nahara checkout", "jewellery checkout", "secure payment"],
  robots: "noindex, nofollow",
};

export default async function Page({ params }) {
  const { id } = await params;

  const isValidMongoId = /^[a-f\d]{24}$/i.test(id);

  if (!isValidMongoId) {
    redirect('/');
  }

  return <CheckoutClient />;
}
