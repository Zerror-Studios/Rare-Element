import gsap from 'gsap'
import React, { useEffect } from 'react'
import GreenBoxBtn from '../buttons/GreenBoxBtn'

const SubscriptionForm = ({ user, expandSubscribeForm, setExpandSubscribeForm }) => {

    useEffect(() => {
        if (expandSubscribeForm) {
            gsap.to(".subscription_form_paren", { height: "auto", paddingTop: "2rem", duration: 0.5, ease: "power2.out" })
        } else {
            gsap.to(".subscription_form_paren", { height: "0vh", paddingTop: 0, duration: 0.5, ease: "power2.out" })
        }
    }, [expandSubscribeForm])
    return (
        <>
            <div className="subscription_form_paren">
                <div className="subscription_div">
                    <p> Newsletter</p>
                    <div className="subscription_btn_paren">

                        {
                            user.subscriptions.newsletter === "Subscribed" ?
                                <button className='subscribe_btn'>
                                    <p className='text-xs'>
                                        Remove
                                    </p>
                                </button>
                                :
                                <button className='unSubscribe_btn'>
                                    <p className='text-xs'>
                                        Add
                                    </p>
                                </button>
                        }
                    </div>
                </div>
                <div className="subscription_div">
                    <p> Direct Mail Marketing</p>
                    <div className="subscription_btn_paren">

                        {
                            user.subscriptions.directMail === "Subscribed" ?
                                <button className='subscribe_btn'>
                                    <p className='text-xs'>
                                        remove
                                    </p>
                                </button>
                                :
                                <button className='unSubscribe_btn'>
                                    <p className='text-xs'>
                                        add
                                    </p>
                                </button>
                        }
                    </div>
                </div>

                <GreenBoxBtn text='Save' />

                <button onClick={() => setExpandSubscribeForm(false)} className='cancel_form_btn'>
                    <p>
                        Cancel
                    </p>
                </button>
            </div>
        </>
    )
}

export default SubscriptionForm