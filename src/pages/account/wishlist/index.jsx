import React from 'react';
import AccountLeftSlide from '@/components/account/AccountLeftSlide';
import Link from 'next/link';
import { RiArrowRightSLine } from '@remixicon/react';
import ShopCard from '@/components/common/ShopCard';
import { ProductsData } from '@/utils/ProductsData';

const Wishlist = () => {
    return (
        <div>
            <div className="account_wrapper">
                <div className="settings__left">
                    <AccountLeftSlide />
                </div>
                <div className="settings__breadcrumb">
                    <Link href={"/account"}>
                        <p className="settings__breadcrumb_faded text-sm">Account</p>
                    </Link>
                    <RiArrowRightSLine size={14} />
                    <p className='text-sm'>Wishlist</p>
                </div>

                <div className="settings__content">
                    <h2 className="settings__title text-xl">My Wishlist</h2>

                    <div className="wishlist_box">
                        {ProductsData?.map((item, idx) => (
                            <Link key={idx} href={`/products/${item.slug}`} className='wishlist_card'>
                                <ShopCard item={item} />
                            </Link>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Wishlist;
