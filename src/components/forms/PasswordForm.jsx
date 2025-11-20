import { RiCheckLine } from '@remixicon/react'
import gsap from 'gsap'
import React, { useEffect } from 'react'
import GreenBoxBtn from '../buttons/GreenBoxBtn'

const PasswordForm = ({ user, expandPasswordForm, setExpandPasswordForm }) => {

    useEffect(() => {
        if (expandPasswordForm) {
            gsap.to(".password_form_paren", { height: "auto", paddingTop: "2rem", duration: 0.5, ease: "power2.out" })
        } else {
            gsap.to(".password_form_paren", { height: "0vh", paddingTop: 0, duration: 0.5, ease: "power2.out" })
        }
    }, [expandPasswordForm])

    return (
        <>
            <div className="password_form_paren">
                <form action="">
                    <div className="inp_paren text-base">
                        <p className='text-sm '>Current Password<span>*</span> </p>
                        <input type="text" placeholder="Enter Current Password" name="" id="" />
                        <p className='input_error_msg text-xs'>Error Message</p>
                        <RiCheckLine className='check_icon' />
                    </div>
                    <div className="inp_paren text-base">
                        <p className='text-sm '>New Password <span>*</span> </p>
                        <input type="text" placeholder="Enter New Password" name="" id="" />
                        <p className='input_error_msg text-xs'>Error Message</p>

                        <RiCheckLine className='check_icon' />
                    </div>
                    <GreenBoxBtn text='Save' />

                    <button type='button' onClick={() => setExpandPasswordForm(false)} className='cancel_form_btn'>
                        <p>
                            Cancel
                        </p>
                    </button>
                </form>
            </div>
        </>
    )
}

export default PasswordForm