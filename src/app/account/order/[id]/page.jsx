import OrderDetailClient from './order-detail-client'

export const metadata = {
  title: "Your Orders | Track & Manage Purchases – Nahara",
  description: "View and track all your Nahara jewellery orders in one place. Check order status, shipping updates, invoices, and more.",
  keywords: ["Nahara orders", "track order", "order history", "jewellery orders"],
  robots: "noindex,nofollow",
};

export default function Page() {
  return <OrderDetailClient />;
}
