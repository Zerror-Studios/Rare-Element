import React from 'react'

const Hero = () => {
    return (
        <>
            <div className="info_header center">
                <p className='text-sm'> Free Shipping on orders above ₹3,000 </p>
            </div>
            <div className="home_hero">
                <div className="home_hero_inner">
                    <h2 className='text-6xl'>The Aurora Collection</h2>
                    <button className='green_button'><p className='text-xl'>Discover</p></button>
                </div>
            </div>
        </>
    )
}

export default Hero