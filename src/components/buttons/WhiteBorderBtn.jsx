import React from 'react'

const WhiteBorderBtn = ({ text }) => {
    return (
        // Always inside a link (Hero): a <button> in an <a> is two nested
        // targets, so this is the link's look, not a second control.
        <span className='white_border_button'>
            <span className='text-base'>{text}</span>
        </span>
    )
}

export default WhiteBorderBtn