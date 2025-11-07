import React from 'react'

const FeaturedCollection = () => {
    return (
        <>
            <div className="featured_collections_section ">
                <div className="featured_header">
                    <p className="featured_subtitle text-xl">Crafted for Every Moment</p>
                    <h2 className="featured_title text-6xl">Featured Collections</h2>
                </div>

                <div className="featured_scroll">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((item, i) => (
                        <div key={i} className="featured_card">
                            <div className="featured_img_wrapper">
                                <img
                                    src="https://minas-designs.com/wp-content/uploads/2025/02/WING-B-min1-2048x2048.jpg"
                                    alt=""
                                />
                            </div>
                            <div className="featured_card_info">
                                <div>
                                    <p className="featured_item_name text-base uppercase">Earings</p>
                                    <p className="featured_item_price text-sm">Rs. 1,000</p>
                                </div>
                                <img className='invert' src="/icons/heart.svg" alt="" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </>
    )
}

export default FeaturedCollection