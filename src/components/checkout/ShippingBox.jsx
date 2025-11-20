import { RiCheckLine } from '@remixicon/react'
import React, { useEffect, useRef, useState } from 'react'
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { countriesData } from '../helpers/CountriesData';
import CheckoutInput from './../inputs/CheckoutInput';
import gsap from 'gsap';

const ShippingBox = ({ user }) => {
    const expandFromRef = useRef(null)
    const [selectAddressBox, setSelectAddressBox] = useState(false)
    const [expandForm, setExpandForm] = useState(false)

    useEffect(() => {
        if (!expandFromRef.current) {
            gsap.set(expandFromRef.current, { height: 0 })
        }
        if (expandForm) {
            gsap.to(expandFromRef.current, { height: "auto", duration: 0.5, ease: "ease-in-out" })
        } else {
            gsap.to(expandFromRef.current, { height: 0, duration: 0.5, ease: "ease-in-out" })
        }
    }, [expandForm])


    return (
        <>
            <div className="checkout_user_details">
                <div className="checkout_user_detailsHeader">
                    <p className="checkout_subHeading text-lg uppercase">Shipping Address</p>
                    {
                        !expandForm && (
                            <div onClick={() => setExpandForm(true)} className="settings__link">
                                <p className="underline uppercase text-base"> + Add New Address</p>
                            </div>
                        )
                    }
                    {
                        expandForm && (
                            <div onClick={() => setExpandForm(false)} className="settings__link">
                                <p className="underline uppercase"> Use saved address</p>
                            </div>
                        )
                    }
                </div>
                <div ref={expandFromRef} className="checkout_address_form">

                    {/* First + Last Name */}
                    <div className="checkout_inp_flex">
                        <CheckoutInput placeholder="First Name" />
                        <CheckoutInput placeholder="Last Name" />
                    </div>

                    {/* Phone + Address Type */}
                    <div className="checkout_inp_flex">
                        <div className="checkOut_input">
                            <PhoneInput
                                defaultCountry="in"
                                className="delivery__phone_btn"
                                inputClassName="delivery__input__phone"
                            />
                        </div>

                        <select className="checkOut_input" required defaultValue="">
                            <option value="" disabled hidden className="placeholderOption">
                                Address Type
                            </option>
                            {["Home", "Office", "Other"].map((item, index) => (
                                <option key={index}>{item}</option>
                            ))}
                        </select>
                    </div>

                    {/* City + ZIP */}
                    <div className="checkout_inp_flex">
                        <CheckoutInput placeholder="City" />
                        <CheckoutInput placeholder="ZIP Code" />
                    </div>

                    {/* Country + State */}
                    <div className="checkout_inp_flex">
                        <select className="checkOut_input" required defaultValue="">
                            <option value="" disabled hidden className="placeholderOption">
                                Country/Region
                            </option>
                            {countriesData.map((item, index) => (
                                <option key={index} value={item.name}>
                                    {item.name}
                                </option>
                            ))}
                        </select>

                        <CheckoutInput placeholder="State" />
                    </div>

                    {/* Address lines */}
                    <CheckoutInput placeholder="Address Line" />
                    <CheckoutInput placeholder="Apartment, Suite, etc" />
                </div>

                {/* Saved Address */}
                {
                    !expandForm && (
                        <div className="address_div">
                            <div onClick={() => setSelectAddressBox(!selectAddressBox)} className="address_box text-base">
                                <div
                                    className={`address_box_check_box_div check_box_div center ${selectAddressBox ? "check_box_div_active" : ""
                                        }`}
                                >
                                    {selectAddressBox && <RiCheckLine size={14} />}
                                </div>

                                <p>{user.address.line1}</p>
                                <p>{user.address.line2}</p>
                                <p>{user.address.country}</p>
                            </div>
                        </div>
                    )
                }

            </div>
        </>
    )
}

export default ShippingBox
