import WishlistClient from './wishlist-client'

export const metadata = {
  title: "Your Wishlist | Saved Jewellery Designs – Nahara",
  description: "View all your favourite saved jewellery pieces. Keep track of rings, earrings, necklaces and more that you love.",
  keywords: ["wishlist", "saved jewellery", "Nahara wishlist", "favourite jewellery"],
  robots: "index,follow",
};

export default function Page() {
  return <WishlistClient />;
}
