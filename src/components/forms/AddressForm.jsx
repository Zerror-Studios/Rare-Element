import { RiCheckLine } from '@remixicon/react'
import gsap from 'gsap'
import React, { useEffect } from 'react'
import GreenBoxBtn from '../buttons/GreenBoxBtn'

const AddressForm = ({ user, expandAddressForm, setExpandAddressForm }) => {

    useEffect(() => {
        if (expandAddressForm) {
            gsap.to(".address_form_paren", { height: "auto", paddingTop: "2rem", duration: 0.5, ease: "power2.out" })
        } else {
            gsap.to(".address_form_paren", { height: "0vh", paddingTop: 0, duration: 0.5, ease: "power2.out" })
        }
    }, [expandAddressForm])

    return (
        <>
            <div className="address_form_paren">
                <form action="">
                    <div className="inp_paren text-base">
                        <p className='text-sm '>Address Line <span>*</span> </p>
                        <input type="text" placeholder="" defaultValue={user.address.line1} name="" id="" />
                        <p className='input_error_msg text-xs'>Error Message</p>
                        <RiCheckLine className='check_icon' />
                    </div>
                    <div className="inp_paren text-base">
                        <p className='text-sm '>City <span>*</span> </p>
                        <input type="text" placeholder="" defaultValue={user.address.line2} name="" id="" />
                        <RiCheckLine className='check_icon' />
                    </div>
                    <div className="inp_paren text-base">
                        <p className='text-sm '>State  <span>*</span> </p>
                        <input type="text" placeholder="" defaultValue={user.address.country} name="" id="" />
                        <RiCheckLine className='check_icon' />
                    </div>
                    <div className="inp_paren text-base">
                        <p className='text-sm '>Area Pincode <span>*</span> </p>
                        <input type="text" placeholder="" defaultValue={user.address.country} name="" id="" />
                        <RiCheckLine className='check_icon' />
                    </div>
                    <div className="inp_paren text-base">
                        <p className='text-sm '>Country <span>*</span> </p>
                        <input type="text" placeholder="" defaultValue={user.address.country} name="" id="" />
                        <RiCheckLine className='check_icon' />
                    </div>
                    <GreenBoxBtn text='Save' />

                    <button type='button' onClick={() => setExpandAddressForm(false)} className='cancel_form_btn'>
                        <p>
                            Cancel
                        </p>
                    </button>
                </form>
            </div>
        </>
    )
}

export default AddressForm