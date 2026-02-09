import React, { memo } from 'react';
import Image from 'next/image';

const RouteLoader = ({ isLoading }) => {
  return (
    <div
      className={`routeloader_parent center ${isLoading ? "is-visible" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="loader_img">
        <Image
          src="/green_logo.svg"
          alt="Logo"
          width={500}
          height={500}
          priority
        />
      </div>
    </div>
  );
};

export default memo(RouteLoader);
