import React from "react";

const ProductCardSkeleton = () => {
  return (
    <div className="shopCard_card skeleton_card">

        <div className="heart_icon">
          <div className="skeleton_circle skeleton_animate"></div>
        </div>
        
        <div className="shopCard_img_wrapper  center">
          <div className="skeleton_box main_img_skeleton skeleton_animate"></div>
        </div>

        {/* <div className="shopCard_card_info skeleton_animate skeleton_info"> */}
            <div className="text_skeleton skeleton_animate name_skeleton"></div>
        {/* </div> */}
        
      </div>
  );
};

export default ProductCardSkeleton;
