import { RiCheckLine } from '@remixicon/react'
import Link from 'next/link'
import React, { useState } from 'react'

const EmailBox = ({ user }) => {
    const [acceptEmailOfferBtn, setAcceptEmailOfferBtn] = useState(false)

    return (
        <>
            <div className="checkout_user_details">
                <div className="checkout_user_detailsHeader">
                    <p className="checkout_subHeading text-lg uppercase">Email</p>
                    <Link href="/login">
                        <div className="settings__link">
                            <p className="underline uppercase text-base">Login</p>
                        </div>
                    </Link>
                </div>
                <input type="email" placeholder="" className="checkOut_input" defaultValue={user.email} name="" id="" />
                <div onClick={() => setAcceptEmailOfferBtn(!acceptEmailOfferBtn)} className="cards_inner_content">
                    <div className={`check_box_div center ${acceptEmailOfferBtn ? "check_box_div_active" : ""} `}>
                        {acceptEmailOfferBtn && <RiCheckLine size={14} />}
                    </div>
                    <p>Email me with news and offers</p>
                </div>

                {/* <div className=" text-base">
                                        <p>{user.email}</p>
                                        <p>{user.phone}</p>
                                        <p>{user.name}</p>
                                        <p>{user.dob}</p>
                                    </div> */}

                {/* <div className="checkout_thin_line"></div> */}
            </div>
        </>
    )
}

export default EmailBox