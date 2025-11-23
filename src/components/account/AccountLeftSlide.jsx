import Link from 'next/link'
import { useRouter } from 'next/router';
import React from 'react'
import GreenBoxBtn from '../buttons/GreenBoxBtn';

const AccountLeftSlide = () => {
    const router = useRouter();

    return (
        <div>
            <div className="accountLeftSlide">

                <div className="accountLeftSlide_pointsSection text-base">
                    <div>
                        <h2 className="accountLeftSlide_text15 text-xl uppercase">Welcome Sunny</h2>

                        <p className="accountLeftSlide_text15">
                            Member ID: 115513509154682
                        </p>

                    </div>

                    <div>
                        <div className="accountLeftSlide_progressBar">
                            <div style={{ width: "40%" }} className="accountLeftSlide_progressBar_inner"></div>
                        </div>
                        <p className="accountLeftSlide_text15">600 Points to Next Reward Tier</p>
                        <p className="accountLeftSlide_text15 accountLeftSlide_text15_points uppercase">
                            Points <span className="accountLeftSlide_highlight">400/1000</span>
                        </p>
                        <div className="bar_code_img_paren">
                            <img className='bar_code_img' src="/images/Black-barcode-icon.png" alt="" />
                        </div>
                    </div>
                </div>

                <div className="accountLeftSlide_nav">
                    <div className="accountLeftSlide_navItem_hidden">
                        <Link scroll={false} href={"/account"}>
                            <p
                                className={`accountLeftSlide_navLink uppercase text-2xl ${router.pathname === "/account" ? "active" : ""
                                    }`}
                            >
                                orders
                            </p>
                        </Link>
                    </div>

                    <div>
                        <Link scroll={false} href={"/account/wishlist"}>
                            <p
                                className={`accountLeftSlide_navLink uppercase text-2xl ${router.pathname === "/account/wishlist" ? "active" : ""
                                    }`}
                            >
                                Wishlist
                            </p>
                        </Link>
                    </div>


                    <div >
                        <Link scroll={false} href={"/account/offers"}>
                            <p
                                className={`accountLeftSlide_navLink uppercase text-2xl ${router.pathname === "/account/offers" ? "active" : ""
                                    }`}
                            >
                                Rewards & Offers
                            </p>
                        </Link>
                    </div>

                    <div>
                        <Link scroll={false} href={"/account/settings"}>
                            <p
                                className={`accountLeftSlide_navLink uppercase text-2xl ${router.pathname === "/account/settings" ? "active" : ""
                                    }`}
                            >
                                Account settings
                            </p>
                        </Link>
                    </div>
                </div>

                <div className="accountLeftSlide_signoutBtn">
                    <GreenBoxBtn text={"Sign Out"} />
                </div>
            </div>
        </div>
    )
}

export default AccountLeftSlide
