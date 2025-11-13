import Link from 'next/link'
import React from 'react'

const categoryData = [
    {
        link: "",
        title: "Rings",
        img: "/images/homepage/category/rings.svg"
    },
    {
        link: "",
        title: "earings",
        img: "/images/homepage/category/earings.svg"
    },
    {
        link: "",
        title: "Necklace",
        img: "/images/homepage/category/necklace.svg"
    },
    {
        link: "",
        title: "Bracelets",
        img: "/images/homepage/category/bracelets.svg"
    },
    {
        link: "",
        title: "anklets",
        img: "/images/homepage/category/anklets.svg"
    },
]
const Category = () => {
    return (
        <>
            <div className="padding">
                <div className="category_header">
                    <p className='text-base uppercase thin'>The Essence of Elegance</p>
                </div>
                <div className="home_category_paren scroller_none">
                    <div className="home_category_inner scroller_none">
                        {categoryData.map((item, index) => (
                            <Link scroll={false} key={index} href="/products">
                                <div className="category_box">
                                    <div className="category_box_img_paren">
                                        <img src={item.img} className='category_box_img' alt={item.title} />
                                    </div>
                                    <p className='text-sm bold uppercase'>{item.title}</p>
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