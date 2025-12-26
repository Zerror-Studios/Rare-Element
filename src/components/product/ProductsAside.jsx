import React, { useState } from 'react'
import Checkbox from '../ui/Checkbox'
import GreenBoxBtn from '../buttons/GreenBoxBtn'

const filterOptions = [
  {
    label: "Category",
    options: ["Rings", "Earrings", "Necklaces", "Bracelets",]
  },
  {
    label: "color",
    options: ["gold", "rose gold", "silver"]
  },
  {
    label: "price",
    options: ["below ₹2,000", "₹2000 - ₹5,000", "₹5000 - ₹10,000", "above ₹10,000"]
  },
]


const ProductsAside = ({ setOpenFilter }) => {
  const [openSections, setOpenSections] = useState(
    filterOptions.map(() => true)
  );

  const toggle = (index) => {
    setOpenSections((prev) =>
      prev.map((isOpen, i) =>
        i === index ? !isOpen : isOpen
      )
    );
  };


  return (
    <>
      <div className="products_aside_paren ">
        <div className="products_aside_close">
          <img
            onClick={() => setOpenFilter(false)}
            src="/icons/close.svg" alt="loading" />
        </div>
        <div className="filter_boxes_paren">
          {filterOptions.map((item, i) => {
            const isOpen = openSections[i];

            return (
              <div key={i} className="products_aside_box">
                {/* Header */}
                <div
                  className="product_aside_header"
                  onClick={() => toggle(i)}
                >
                  <p className="uppercase bold">{item.label}</p>
                  <p className={`aside_arrow ${isOpen ? "rotate" : ""}`}>
                    ›
                  </p>
                </div>

                {/* Dropdown */}
                <div
                  className={`products_aside_options ${isOpen ? "open" : ""
                    }`}
                >
                  {item.options.map((option, idx) => (
                    <div key={idx} className="products_aside_option">
                      <Checkbox />
                      <p className="text-lg thin">{option}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="filter_apply_btn">
          <GreenBoxBtn title="Apply Filter" />
        </div>
      </div>
    </>
  )
}

export default ProductsAside