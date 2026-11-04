import ReviewsClient from "./reviews-client";

export const metadata = {
  title: "My Reviews – Nahara",
  description: "Your Nahara product reviews, and the purchases you can still review.",
  robots: "noindex,nofollow",
};

export default function Page() {
  return <ReviewsClient />;
}
