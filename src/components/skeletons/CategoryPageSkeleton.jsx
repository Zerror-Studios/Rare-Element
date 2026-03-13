import React from 'react'
import ProductCardSkeleton from './ProductCardSkeleton'

const CategoryPageSkeleton = () => {
    return (
        <>
            <div >
                <div className="products_hero-section category_skeleton skeleton_animate">
                </div>
                <div className="category_products_header skeleton_animate">
                    <p className="products_subtitle thin text-base hidden uppercase">Crafted for Every Moment</p>
                    <h1 className="products_title text-3xl hidden"></h1>
                </div>
                <div className="padding">
                    <div className="allproducts_paren categories_paren ">
                        {[1, 2, 3, 4, 5, 6,7,8].map((item, index) => (<ProductCardSkeleton key={index} />))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default CategoryPageSkeleton