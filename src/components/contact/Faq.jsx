import React, { useRef, useState } from 'react'

const Faqs = [
    {
        id: 1,
        title: "What materials do you use in your jewellery?",
        desc: [
            "Our pieces are crafted using high-quality materials including 925 sterling silver.",
            "We use 18k gold plating and ethically sourced natural gemstones.",
            "Each design is tested for durability and long-term shine retention.",
            "Every piece meets strict quality standards before it reaches you."
        ]
    },
    {
        id: 2,
        title: "How do I care for my jewellery?",
        desc: [
            "Store your jewellery in a dry pouch when not in use to maintain shine.",
            "Avoid exposure to perfumes, lotions, or other chemicals.",
            "Clean gently with a soft microfiber cloth after each wear.",
            "These simple steps help your piece remain radiant for years."
        ]
    },
    {
        id: 3,
        title: "Do you offer custom or personalized designs?",
        desc: [
            "Yes, we offer curated customization options for select collections.",
            "Options include engraving and personalized gemstone choices.",
            "Our design specialists help you create a meaningful piece.",
            "Custom orders may require additional processing time."
        ]
    },
    {
        id: 4,
        title: "What is your return and exchange policy?",
        desc: [
            "We provide easy returns and exchanges on unworn products.",
            "Items must include original packaging and authenticity certificates.",
            "Customized or used pieces cannot be returned for safety reasons.",
            "Our support team will guide you through the entire process."
        ]
    },
    {
        id: 5,
        title: "How long does shipping usually take?",
        desc: [
            "Orders are processed within 24–48 business hours.",
            "Standard delivery typically takes 3–7 working days.",
            "Tracking details are shared once your order is dispatched.",
            "Express delivery options may be available at checkout."
        ]
    },
];



const Faq = () => {

    const [openId, setOpenId] = useState(null);
    const contentRefs = useRef({});

    const toggleFAQ = (id) => {
        setOpenId((prev) => (prev === id ? null : id));
    };

    return (
        <div className='faq_paren'>
            <div className="faq_header">
                <h2 className=' text-3xl font-semibold'>FAQs</h2>
                <p className='text-base uppercase'> Here are some frequently asked questions </p>
            </div>

            <div className="faq_paren_inner">
                <div className="faq_drop_paren">
                    {Faqs.map((faq) => (
                        <div className={`faq_drop ${openId === faq.id ? "open" : ""}`} key={faq.id}>
                            <div className="faq_drop_title"
                                onClick={() => toggleFAQ(faq.id)}
                            >
                                <h2 className='text-xl'>{faq.title}</h2>
                                <img className={`faq_drop_close ${openId === faq.id ? "open" : ""}`} src="/icons/close.svg" alt="loading" />
                            </div>
                            <div
                                className="faq_drop_desc"
                                ref={(el) => (contentRefs.current[faq.id] = el)}
                                style={{
                                    height:
                                        openId === faq.id
                                            ? `${contentRefs.current[faq.id]?.scrollHeight}px`
                                            : "0px",
                                }}
                            >
                                {faq.desc.map((desc, index) => (
                                    <p key={index} className='text-lg'> • {desc}</p>
                                ))}
                                <p className='hidden'>hidden txt</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Faq