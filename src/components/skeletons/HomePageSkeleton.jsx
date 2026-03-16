import Image from 'next/image'
import React from 'react'
import CategoryPageSkeleton from './CategoryPageSkeleton'

const HomePageSkeleton = () => {
    return (
        <div>
            <div className="dummy_hero_div skeleton_animate" />

            <div className="padding category_paren">
                <div className="category_header">
                    <p className='text-base uppercase thin'>Shop by Category</p>
                </div>
                <div className="home_category_paren scroller_none">
                    <div className="home_category_inner scroller_none">
                        {[1, 2, 3, 4].map((item, index) => (
                            <div key={index} className="category_box">
                                <div className="category_box_img_paren skeleton_animate"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* <CategoryPageSkeleton /> */}
        </div>
    )
}

export default HomePageSkeleton