import React from 'react'

const categoryData = [
    {
        link: "",
        title: "Rings",
        img: "https://www.graff.com/dw/image/v2/BFNT_PRD/on/demandware.static/-/Library-Sites-GraffSharedLibrary/default/dwe66c084f/Homepage%20Images/November_25/Graff-homepage-necklaces-pendants-2-1333x1777px.jpg"
    },
    {
        link: "",
        title: "Bracelets",
        img: "https://www.graff.com/dw/image/v2/BFNT_PRD/on/demandware.static/-/Library-Sites-GraffSharedLibrary/default/dwe87fa35b/files/Shot05_AC_GRAFFFESTIVE_0725_BUTTERFLY_062_RGB%20v2%204x5.jpg"
    },
    {
        link: "",
        title: "earings",
        img: "https://www.graff.com/dw/image/v2/BFNT_PRD/on/demandware.static/-/Library-Sites-GraffSharedLibrary/default/dw3dc5fa94/images/PLP%20HEADERS/RGP707%20%2020250520_MD_GRAFF_SHOT_08_F4.jpg"
    },
    {
        link: "",
        title: "anklets",
        img: "https://www.graff.com/dw/image/v2/BFNT_PRD/on/demandware.static/-/Library-Sites-GraffSharedLibrary/default/dw71d60a51/Homepage%20Images/November_25/Graff-Homepage-high-jewelley-look-2-2000x1125px.jpg"
    },
    {
        link: "",
        title: "Necklace",
        img: "https://www.graff.com/dw/image/v2/BFNT_PRD/on/demandware.static/-/Library-Sites-GraffSharedLibrary/default/dw7d2d73f2/Homepage%20Images/November_25/Graff-homepage-icon-8-1490x995px.jpg"
    },
]
const Category = () => {
    return (
        <>
            <div className="padding">
                <div className="category_header">
                    <p className='text-xl uppercase'>The Essence of Elegance</p>
                </div>
                <div className="home_category_paren">
                    {categoryData.map((item, index) => (
                        <div key={index} className="category_box">
                            <div className="category_box_img_paren">
                                <img src={item.img} alt={item.title} />
                            </div>
                            <p className='text-base uppercase'>{item.title}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

export default Category