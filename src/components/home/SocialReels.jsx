import React from 'react'

const SocialReels = () => {
    return (
        <>
            <div className="featured_header">
                <p className="featured_subtitle text-xl">Crafted for Every Moment</p>
                <h2 className="featured_title text-6xl">Featured Collections</h2>
            </div>
            <div className="socialCard_section padding">
                {[1, 2, 3, 4].map((item, i) => (
                    <div key={i} className="socialCard_box">
                        <div className="socialCard_image_wrapper">
                            <img
                                className="socialCard_image"
                                src="https://www.apm.mc/cdn/shop/files/APM-Monaco-Yellow-Gold_1d0e9e3c-d18b-4a57-a69e-619b4d22dcd2.jpg?v=1756696686&width=600"
                                alt="Bespoke Jewellery Design"
                            />
                        </div>

                        <h2 className="socialCard_title text-3xl uppercase">Bespoke Jewellery Design</h2>
                        <p className="socialCard_description text-base">
                            Exclusively to reflect your personality and timeless elegance.
                        </p>
                    </div>
                ))}
            </div>

        </>
    )
}

export default SocialReels