import parse from "html-react-parser";

export const htmlParser = (data = "") => {
  if (!data) return "";
  return parse(data || "");
};

// utils/formatTime.ts
export const formatDateTime = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayName = days[date.getDay()];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);

  return `${dayName}, ${day} ${month}, ${year}`;
};

export const formatePrice = (price) => {
  if (!price) return "0";
  const hasDecimal = price % 1 !== 0;
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasDecimal ? 1 : 0,
    maximumFractionDigits: 2,
  }).format(price);
  return formattedPrice;
};

export const getProductPriceLabel = (variants = [], discountedPrice = 0) => {
  if (!variants || variants.length === 0) {
    return formatePrice(discountedPrice || 0);
  }
  const prices = variants.map((v) => v.variantPrice).filter(Boolean);
  if (prices.length === 0) {
    return formatePrice(discountedPrice || 0);
  }
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  if (minPrice === maxPrice) {
    return formatePrice(minPrice);
  }
  return `Starts from ${formatePrice(minPrice)}`;
};

export const renderVariants = (variant = []) => {
  if (variant.length === 0) return;
  return variant.map((value, idx) => (
    <p key={idx} className="cartBag_itemSize text-xs">{`${idx === 0 ? "Color" : "Size"} - ${value}`}</p>
  ));
};
