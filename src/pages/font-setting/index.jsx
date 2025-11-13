import Link from 'next/link'
import React from 'react'

const categoryData = [
    {
        link: "",
        title: "Rings",
        img: "https://www.buccellati.com/media/wysiwyg/Widget_Macri_Capri.jpg"
    },
    {
        link: "",
        title: "earings",
        img: "https://www.buccellati.com/media/wysiwyg/Category_Boxes_Macri.jpg"
    },
    {
        link: "",
        title: "Necklace",
        img: "https://www.buccellati.com/media/wysiwyg/Category_Boxes_Macri_Classica_copia.jpg"
    },
    {
        link: "",
        title: "Bracelets",
        img: "https://www.buccellati.com/media/wysiwyg/Category_Boxes_Macri_AB_copia.jpg"
    },
    {
        link: "",
        title: "anklets",
        img: "https://www.buccellati.com/media/wysiwyg/Category_Boxes_Macri_Giglio_copia.jpg"
    },
]
const Category = () => {
    return (
        <>
            <div className="padding">
                <div className="category_header">
                    <h5 style={{ fontSize: ".7vw" }} className=' uppercase'>1. The Essence of Elegance</h5>
                    <h4 style={{ fontSize: ".9vw" }} className=' uppercase'> The Essence of Elegance</h4>
                </div>
                <div className="home_category_paren scroller_none">
                    <div className="home_category_inner scroller_none">
                        {categoryData.map((item, index) => (
                            <Link scroll={false} key={index} href="/products">
                                <div className="category_box">
                                    <div className="category_box_img_paren">
                                        <img src={item.img} className='category_box_img' alt={item.title} />
                                    </div>
                                    <h6 style={{ fontSize: ".7vw" }} className=' uppercase'>{item.title}</h6>
                                </div>
                            </Link>
                        ))}
                    </div>  
                </div>
            </div>
            <div className="padding">
                <div className="category_header">
                    <h5 style={{ fontSize: ".8vw" }} className=' uppercase'>2. The Essence of Elegance</h5>
                    <h4 style={{ fontSize: "1vw" }} className=' uppercase'>The Essence of Elegance</h4>
                </div>
                <div className="home_category_paren scroller_none">
                    <div className="home_category_inner scroller_none">
                        {categoryData.map((item, index) => (
                            <Link scroll={false} key={index} href="/products">
                                <div className="category_box">
                                    <div className="category_box_img_paren">
                                        <img src={item.img} className='category_box_img' alt={item.title} />
                                    </div>
                                    <h6 style={{ fontSize: ".8vw" }} className=' uppercase'>{item.title}</h6>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <div className="padding">
                <div className="category_header">
                    <h5 style={{ fontSize: ".9vw" }} className=' uppercase'>3. The Essence of Elegance</h5>
                    <h4 style={{ fontSize: "1.1vw" }} className=' uppercase'> The Essence of Elegance</h4>
                </div>
                <div className="home_category_paren scroller_none">
                    <div className="home_category_inner scroller_none">
                        {categoryData.map((item, index) => (
                            <Link scroll={false} key={index} href="/products">
                                <div className="category_box">
                                    <div className="category_box_img_paren">
                                        <img src={item.img} className='category_box_img' alt={item.title} />
                                    </div>
                                    <h6 style={{ fontSize: ".9vw" }} className=' uppercase'>{item.title}</h6>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <div className="padding">
                <div className="category_header">
                    <h5 style={{ fontSize: "1vw" }} className=' uppercase'>4. The Essence of Elegance</h5>
                    <h4 style={{ fontSize: "1.2vw" }} className=' uppercase'> The Essence of Elegance</h4>
                </div>
                <div className="home_category_paren scroller_none">
                    <div className="home_category_inner scroller_none">
                        {categoryData.map((item, index) => (
                            <Link scroll={false} key={index} href="/products">
                                <div className="category_box">
                                    <div className="category_box_img_paren">
                                        <img src={item.img} className='category_box_img' alt={item.title} />
                                    </div>
                                    <h6 style={{ fontSize: "1vw" }} className=' uppercase'>{item.title}</h6>
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