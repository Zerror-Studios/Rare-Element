import { RiCheckLine } from '@remixicon/react'
import React, { useState } from 'react'
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { countriesData } from '../helpers/CountriesData';
import CheckoutInput from '../inputs/CheckoutInput';

const BillingBox = ({ user }) => {
    const [sameShippingBillingBtn, setSameShippingBillingBtn] = useState(false)

    return (
        <>
            <div className="checkout_user_details">

                <p className="checkout_subHeading text-lg uppercase">Billing Address</p>

                {/* Same as shipping */}
                <div
                    onClick={() => setSameShippingBillingBtn(!sameShippingBillingBtn)}
                    className="cards_inner_content"
                >
                    <div
                        className={`check_box_div center ${sameShippingBillingBtn ? "check_box_div_active" : ""
                            }`}
                    >
                        {sameShippingBillingBtn && <RiCheckLine size={14} />}
                    </div>
                    <p>Use shipping address as billing address</p>
                </div>

                {/* Form */}
                <div className="checkout_address_form">

                    {/* First/Last */}
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
                                <option value={item} key={`address-${index}`}>
                                    {item}
                                </option>
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
                            {countriesData?.map((item, index) => (
                                <option value={item?.name || ""} key={`country-${index}`}>
                                    {item?.name || ""}
                                </option>
                            ))}
                        </select>

                        <CheckoutInput placeholder="State" />
                    </div>

                    {/* Address Lines */}
                    <CheckoutInput placeholder="Address Line" />
                    <CheckoutInput placeholder="Apartment, Suite, etc" />

                </div>
            </div>
        </>
    )
}

export default BillingBox

