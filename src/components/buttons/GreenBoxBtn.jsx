import React from "react";
import { useRouter } from "next/router";
import Loader from "../checkout/Loader";

const GreenBoxBtn = ({ title, href, onClick, loading = false, type = "submit" }) => {
    const router = useRouter();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (href) {
            router.push(href);
        }
    };
    return (
        <button className="green_box_btn" type={type}
            onClick={handleClick}
            disabled={loading}>
            {loading ? (
                <div className="spinner_loader"></div>
            ) : (
                <p className='text-base uppercase'>{title}</p>
            )}

        </button>
    )
}

export default GreenBoxBtn