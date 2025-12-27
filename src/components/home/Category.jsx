import React from 'react';
import Link from 'next/link';

const Category = ({ data }) => {
    return (
        <>
            <div className="padding category_paren">
                <div className="category_header">
                    <p className='text-base uppercase thin'>Shop by Category</p>
                </div>
                <div className="home_category_paren scroller_none">
                    <div className="home_category_inner scroller_none">
                        {data?.map((item, index) => (
                            <Link prefetch scroll={false} key={index} href={`${item?.link}`}>
                                <div className="category_box">
                                    <div className="category_box_img_paren">
                                        <img src={item?.image} className='category_box_img' alt={item?.title || ""} />
                                    </div>
                                    <p className='text-sm bold uppercase'>{item?.title || ""}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Category