import React from 'react'
import ProductsAside from '../product/ProductsAside'
import ProductCardSkeleton from './ProductCardSkeleton'

const AllProductsPageSkeleton = () => {
    return (
        <>
            <div className="products_header">
                <p className="products_subtitle thin text-base uppercase">Crafted for Every Moment</p>
                <h2 className="products_title text-3xl">Explore  Products</h2>
            </div>

            <div className=" products_layout_paren padding ">
                <div className="hidden">
                    <ProductsAside />
                </div>
                <div className="allproducts_paren_warp">
                    <div className="allproducts_paren ">
                        {[1, 2, 3, 4, 5, 6,7,8].map((item, index) => (<ProductCardSkeleton key={index} />))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default AllProductsPageSkeleton