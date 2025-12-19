import React from 'react'

const filterOptions = ["Sort By", "Price: Low to High", "Price: High to Low", "Most Popular", "Top Rated", "Customer Reviews"]
const ProductsFilterHeader = ({ title, desc }) => {

    return (
        <>
            <div className="products_header padding">
                <div className="">
                    <p className="products_subtitle thin text-base uppercase">{desc}</p>
                    <h2 className="products_title text-3xl">{title}</h2>
                </div>
                <div className="filter_btn">
                    <select
                        className="filter_select"
                    >
                        {filterOptions?.map((item, i) => (
                            <option key={i} value={item}>{item}</option>
                        ))}
                    </select>
                </div>

            </div>
        </>
    )
}

export default ProductsFilterHeader