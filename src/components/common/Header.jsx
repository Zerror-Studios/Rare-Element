import Link from 'next/link'
import React from 'react'

const navLinks = [
    {
        title: "rings",
        link: "/rings"
    },
    {
        title: "earings",
        link: "/earings"
    },
    {
        title: "necklaces",
        link: "/necklaces"
    },
    {
        title: "bracelets",
        link: "/bracelets"
    },
    {
        title: "anklets",
        link: "/anklets"
    },
]
const Header = () => {
    return (
        <>
            <div className="header padding">
                <div className="">
                    <Link href="/">
                        <img src="/logo.svg" alt="" />
                    </Link>
                </div>
                <div className="nav_links">
                    {
                        navLinks.map((item, index) => (
                            <Link href={item.link} key={index}>
                                <p className='text-base'>{item.title}</p>
                            </Link>
                        ))
                    }
                </div>
                <div className="short_links">
                    <Link href="/">
                        <img src="/icons/heart.svg" alt="" />
                    </Link>
                    <Link href="/">
                        <img src="/icons/cart.svg" alt="" />
                    </Link>
                    <Link href="/">
                        <img src="/icons/profile.svg" alt="" />
                    </Link>
                </div>
            </div>
        </>
    )
}

export default Header