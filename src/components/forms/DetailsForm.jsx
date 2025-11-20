import { RiCheckLine } from '@remixicon/react'
import gsap from 'gsap'
import React, { useEffect } from 'react'
import GreenBoxBtn from '../buttons/GreenBoxBtn'
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

const DetailsForm = ({ user, expandDetailForm, setExpandDetailForm }) => {

    useEffect(() => {
        if (expandDetailForm) {
            gsap.to(".details_form_paren", { height: "auto", paddingTop: "2rem", duration: 0.5, ease: "power2.out" })
        } else {
            gsap.to(".details_form_paren", { height: "0vh", paddingTop: 0, duration: 0.5, ease: "power2.out" })
        }
    }, [expandDetailForm])

    return (
        <>
            <div className="details_form_paren">
                <form action="">
                    <div className="inp_paren text-base">
                        <p className='text-sm '>First Name <span>*</span> </p>
                        <input type="text" placeholder="" defaultValue={user.name} name="" id="" />
                        <p className='input_error_msg text-xs'>Error Message</p>
                        <RiCheckLine className='check_icon' />
                    </div>
                    <div className="inp_paren text-base">
                        <p className='text-sm '> Last Name <span>*</span> </p>
                        <input type="text" placeholder="" defaultValue={user.name} name="" id="" />
                        <p className='input_error_msg text-xs'>Error Message</p>
                        <RiCheckLine className='check_icon' />
                    </div>
                    <div className="inp_paren text-base">
                        <p className='text-sm '>Email <span>*</span> </p>
                        <input type="email" placeholder="" defaultValue={user.email} name="" id="" />
                        <RiCheckLine className='check_icon' />
                    </div>
                    <div className="inp_paren text-base">
                        <p className='text-sm '>Contact <span>*</span> </p>
                        <div className="settings_input">

                            <PhoneInput
                                defaultCountry="in"
                                className="delivery__phone_btn"
                                inputClassName="delivery__input__phone"
                            />
                        </div>
                        <RiCheckLine className='check_icon' />
                    </div>
                    <GreenBoxBtn text='Save' />
                    <button type='button' onClick={() => setExpandDetailForm(false)} className='cancel_form_btn'>
                        <p>
                            Cancel
                        </p>
                    </button>
                </form>
            </div>
        </>
    )
}

export default DetailsForm