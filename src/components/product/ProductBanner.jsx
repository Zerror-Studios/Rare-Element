import React from 'react'

const ProductBanner = () => {
  return (
    <div className="padding">
      <div className="image_banner_paren">
        <div className="image_banner_paren_left">
          <img className='cover' src="/images/productpage/giftsHeroimg.svg" alt="loading" />
        </div>
        <div className="image_banner_paren_right">
          <div className="image_banner_paren_left_txt">
            <h2 className='text-3xl uppercase'>Iconic gifts</h2>
            <p className='text-xl thin'>From everyday classics to statement <br /> creations, our jewellery reflects beauty that <br /> endures beyond trends.</p>
          </div>
          <button>
            <p className='text-lg bold'>Shop Now</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductBanner