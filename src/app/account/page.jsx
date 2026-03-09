import AccountClient from './account-client';

export const metadata = {
  title: "My Account – Nahara Jewellery",
  description: "Manage your Nahara account, track orders, update details, and view your wishlist.",
  keywords: ["Nahara account", "order tracking", "jewellery account"],
  robots: "noindex, nofollow",
};

export default function Page() {
  return <AccountClient />;
}
