import React from "react";
import Link from "next/link";
import { RiArrowRightSLine } from "@remixicon/react";

const AccountBreadcrumb = ({ title }) => {

  return (
    <div className="settings__breadcrumb">
      <Link scroll={false} href={"/account"}>
        <p className="settings__breadcrumb_faded text-sm">Account</p>
      </Link>
      <RiArrowRightSLine size={14} />
      <p className='text-sm'>{title}</p>
    </div>
  )
}

export default AccountBreadcrumb