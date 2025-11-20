import React from 'react'

const GreenBoxBtn = ({text}) => {
    return (
        <button className="green_box_btn ">
            <p className='text-base uppercase'>{text}</p>
        </button>
    )
}

export default GreenBoxBtn