import React, { useEffect, useRef, useState } from 'react'

const filterOptions = ["Sort By", "Price: Low to High", "Price: High to Low", "Most Popular", "Top Rated", "Customer Reviews"]
const ProductsFilterHeader = ({ title, desc }) => {

    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(filterOptions[0] || "Select");
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <>
            <div className="products_header padding">
                <div className="products_header_left center">
                    <p className="products_subtitle thin text-base uppercase">{desc}</p>
                    <h2 className="products_title text-3xl">{title}</h2>
                </div>
                <div className="filter_btn" ref={dropdownRef}>
                    {/* Selected */}
                    <button
                        type="button"
                        className="filter_select"
                        onClick={() => setOpen(!open)}
                    >
                        <p>{selected}</p>
                        <p className={`arrow ${open ? "rotate" : ""}`}>›</p>
                    </button>

                    {/* Dropdown */}
                    <div className={`filter_dropdown ${open ? "open" : ""}`}>
                        {filterOptions.map((item, i) => (
                            <div
                                key={i}
                                className={`filter_option ${selected === item ? "active" : ""
                                    }`}
                                onClick={() => {
                                    setSelected(item);
                                    setOpen(false);
                                }}
                            >
                                <p>
                                {item}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </>
    )
}

export default ProductsFilterHeader