import React, { useState, useEffect, useMemo } from 'react'
import Checkbox from '../ui/Checkbox'
import GreenBoxBtn from '../buttons/GreenBoxBtn'

const ProductsAside = ({ setOpenFilter, categories = [], filterOptions = { minPrice: 0, maxPrice: 0, attributes: [] }, onApply }) => {
  const [openSections, setOpenSections] = useState({
    category: true,
    attributes: true,
    price: true
  });

  // Generate price ranges dynamically from min/max
  const priceRanges = useMemo(() => {
    const { minPrice, maxPrice } = filterOptions;
    if (!minPrice && !maxPrice) return [];

    const range = maxPrice - minPrice;
    const step = Math.ceil(range / 4); // Create 4 ranges

    return [
      { label: `under ₹${minPrice + step}`, min: minPrice, max: minPrice + step },
      { label: `₹${minPrice + step} - ₹${minPrice + step * 2}`, min: minPrice + step, max: minPrice + step * 2 },
      { label: `₹${minPrice + step * 2} - ₹${minPrice + step * 3}`, min: minPrice + step * 2, max: minPrice + step * 3 },
      { label: `above ₹${minPrice + step * 3}`, min: minPrice + step * 3, max: null }
    ];
  }, [filterOptions]);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState({}); // { key: [values] }
  const [selectedPrices, setSelectedPrices] = useState([]);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleAttributeChange = (key, value) => {
    setSelectedAttributes(prev => {
      const current = prev[key] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];

      if (updated.length === 0) {
        const { [key]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: updated };
    });
  };

  const handlePriceChange = (index) => {
    setSelectedPrices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleApply = () => {
    // Calculate global min/max price
    let minPrice = undefined;
    let maxPrice = undefined;

    if (selectedPrices.length > 0) {
      const selectedOptions = selectedPrices.map(i => priceRanges[i]);
      const mins = selectedOptions.map(o => o.min);
      const maxs = selectedOptions.map(o => o.max);

      minPrice = Math.min(...mins);
      // If any option has null max (infinite), maxPrice is undefined (or null)
      if (maxs.includes(null)) {
        maxPrice = undefined;
      } else {
        maxPrice = Math.max(...maxs);
      }
    }

    // Convert selectedAttributes object to array format
    const attributesArray = Object.entries(selectedAttributes)
      .filter(([key, values]) => values.length > 0)
      .map(([key, values]) => ({ key, values }));

    const filters = {
      categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
      attributes: attributesArray.length > 0 ? attributesArray : undefined,
      minPrice,
      maxPrice
    };

    onApply(filters);
    setOpenFilter(false); // Close sidebar on apply mobile
  };

  return (
    <>
      <div className="products_aside_paren ">
        <div className="products_aside_close">
          <img
            onClick={() => setOpenFilter(false)}
            src="/icons/close.svg" alt="loading" title='close icon' />
        </div>
        <div className="filter_boxes_paren">

          {/* Category Filter */}
          <div className="products_aside_box">
            <div className="product_aside_header" onClick={() => toggleSection('category')}>
              <p className="uppercase bold">Category</p>
              <p className={`aside_arrow ${openSections.category ? "rotate" : ""}`}>›</p>
            </div>
            <div className={`products_aside_options ${openSections.category ? "open" : ""}`}>
              {categories.map((cat, idx) => (
                <div key={cat._id || idx} className="products_aside_option">
                  <Checkbox
                    checked={selectedCategories.includes(cat._id)}
                    onChange={() => handleCategoryChange(cat._id)}
                  />
                  <p className="text-lg thin">{cat.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Attribute Filters */}
          {filterOptions.attributes && filterOptions.attributes.map((attr, idx) => (
            <div key={idx} className="products_aside_box">
              <div className="product_aside_header" onClick={() => toggleSection(`attr_${idx}`)}>
                <p className="uppercase bold">{attr.key}</p>
                <p className={`aside_arrow ${openSections[`attr_${idx}`] !== false ? "rotate" : ""}`}>›</p>
              </div>
              <div className={`products_aside_options ${openSections[`attr_${idx}`] !== false ? "open" : ""}`}>
                {attr.values.map((value, vIdx) => (
                  <div key={vIdx} className="products_aside_option">
                    <Checkbox
                      checked={(selectedAttributes[attr.key] || []).includes(value)}
                      onChange={() => handleAttributeChange(attr.key, value)}
                    />
                    <p className="text-lg thin capitalize">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Price Filter */}
          {priceRanges.length > 0 && (
            <div className="products_aside_box">
              <div className="product_aside_header" onClick={() => toggleSection('price')}>
                <p className="uppercase bold">Price</p>
                <p className={`aside_arrow ${openSections.price ? "rotate" : ""}`}>›</p>
              </div>
              <div className={`products_aside_options ${openSections.price ? "open" : ""}`}>
                {priceRanges.map((option, idx) => (
                  <div key={idx} className="products_aside_option">
                    <Checkbox
                      checked={selectedPrices.includes(idx)}
                      onChange={() => handlePriceChange(idx)}
                    />
                    <p className="text-lg thin">{option.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
        <div className="filter_apply_btn">
          <GreenBoxBtn title="Apply Filter" onClick={handleApply} />
        </div>
      </div>
    </>
  )
}

export default ProductsAside