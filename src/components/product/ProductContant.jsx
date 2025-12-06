import React, { useEffect, useState } from "react";
import Link from "next/link";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { formatePrice, htmlParser } from "@/utils/Util";
import { StockStatus } from "@/utils/Constant";

const ProductContant = ({
  data = {},
  finalPrice,
  loading,
  notifyLoading,
  isOutOfStock,
  cartBtn,
  setFinalPrice,
  setVariantMatched,
  setCartBtn,
  handleAddToCart,
  handleNotifyMe,
}) => {
  const [selectedVariants, setSelectedVariants] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null); // "color" | "size" | null
  const [accordionIndex, setAccordionIndex] = useState(null);

  // Initialize default variants and color
  useEffect(() => {
    if (!data?.productOptions?.length) return;
    const defaults = {};
    data.productOptions.forEach((option) => {
      if (option.choices?.length) {
        defaults[option.optionName] = option.choices[0].name;
      }
    });

    setSelectedVariants(defaults);
    setCartBtn(Object.keys(defaults).length === data.productOptions.length);
    updatePriceBasedOnVariant(defaults);
  }, [data]);

  const toggleDropdown = (type) => {
    setOpenDropdown((prev) => (prev === type ? null : type));
  };

  const handleAccordionToggle = (index) => {
    setAccordionIndex(accordionIndex === index ? null : index);
  };

  const updatePriceBasedOnVariant = (updatedVariants) => {
    const selectedValues = Object.values(updatedVariants).sort();

    const matchingVariant = data?.variants?.find((variant) => {
      const options = variant.selectedOptions?.sort();
      return (
        options?.length === selectedValues.length &&
        options.every((val, i) => val === selectedValues[i])
      );
    });

    if (matchingVariant) {
      const variantPrice = matchingVariant.variantPrice || 0;
      const { __typename, _id, ...variantWithoutTypename } = matchingVariant;
      setVariantMatched({ variantDetailId: _id, ...variantWithoutTypename });
      setFinalPrice(variantPrice);
    }
  };

  const handleVariants = (name, value) => {
    const updated = { ...selectedVariants, [name]: value };
    setSelectedVariants(updated);
    setCartBtn(Object.keys(updated).length === data.productOptions?.length);
    updatePriceBasedOnVariant(updated);
  };

  if (!data) return null;
  return (
    <div className="productDetail_right">
      <div className="productDetail_sticky">
        <div className="productDetail_info">
          <div className="productDetail_info_left">
            {data?.categories?.map((item) => {
              return (
                <Link key={item?._id} scroll={false} href={`/${item?.slug || ""}`}>
                  <p className="productDetail_category text-lg">{item?.name || ""}</p>
                </Link>
              )
            })}
            <h2 className="productDetail_title text-xl ">{data?.name || ""}</h2>
            <p className="productDetail_price text-xl ">{formatePrice(finalPrice || 0)}</p>
          </div>
        </div>
        <div className="productDetail_options">
          <div className="productDetail_row">
            {data?.productOptions?.map((item, index) => {
              const selectOption = selectedVariants[item?.optionName];
              return (
                <div
                  key={`option-select-${index}`}
                  className={`productDetail_select ${openDropdown === item?.optionName ? "active" : ""}`}
                >
                  <button className="text-base" onClick={() => toggleDropdown(item?.optionName)}>
                    <p className="productDetail_select_inner_elem capitalize">{selectOption}</p>
                    <img
                      className={`productDetail_quantity_icon productDetail_select_inner_elem_img ${openDropdown === item?.optionName ? "rotate_icon" : ""
                        }`}
                      src="/icons/LongArrowDown.svg"
                      alt="loading"
                    />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Dropdowns */}
          <div className="productDetail_selection_wrapper">
            {data?.productOptions?.map((productOption, i) => {
              return (
                <div key={`option-dropdown-${i}`} className={`productDetail_selction ${openDropdown === productOption?.optionName ? "open" : ""}`}>
                  {productOption?.optionName === "size" && <a href="" className="text-xs underline size_link uppercase">Size guide</a>}
                  <div className="color_selection">
                    {productOption.choices?.map((choice, j) => {
                      const selected = selectedVariants[productOption.optionName] === `${choice.name}`;
                      return (
                        <div
                          key={`option-value-${j}`}
                          onClick={() => {
                            handleVariants(
                              productOption.optionName,
                              choice.name
                            );
                          }}
                          style={{
                            opacity: selected ? 1 : 0.7,
                          }}

                          className="select_color_paren">
                          {productOption?.optionName === "color" ? (
                            <>
                              <div className="color_div">
                                <div className="color_inner" style={{ backgroundColor: choice?.name }}>
                                </div>
                              </div>
                              <p
                                style={{
                                  textDecoration: selected ? "underline" : "none",
                                }} className="text-base capitalize">{choice?.name}</p>
                            </>
                          ) : (
                            <div className="color_div">
                              <div className="color_inner center">
                                <p style={{
                                  textDecoration: selected ? "underline" : "none",
                                }} className="text-base uppercase">{choice?.name}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            })}
          </div>


          {/* <div className="productDetail_quantity text-xl">
            <button className="productDetail_quantity_btn">
              <img className="productDetail_quantity_icon" src="/icons/minus.svg" alt="loading" />
            </button>
            <p>1</p>
            <button className="productDetail_quantity_btn">
              <img className="productDetail_quantity_icon" src="/icons/plus.svg" alt="loading" />
            </button>
          </div> */}
        </div>
        <div className="productDetail_addtocart">
          {isOutOfStock && (
            <GreenBoxBtn title={notifyLoading ? "Loading..." : "Notify me"} onClick={handleNotifyMe} />
          )}
          <GreenBoxBtn
            loading={loading}
            title={loading ? "Loading..." : !cartBtn ? "Select a Size" : isOutOfStock ? StockStatus.OUT_OF_STOCK : "Add To Cart"}
            onClick={handleAddToCart}
          />
          <div className="productDetail_btn_icon center">
            <div className="icon_pr">
              <img className="short_links_icon_heart" src="/icons/greenHeart.svg" alt="loading" />
              <img className="short_links_icon_heart_hover" src="/icons/heartFill.svg" alt="loading" />
            </div>
          </div>
        </div>
        {data?.additionalInfo?.length > 0 && (
          <div className="accordion_container">
            {data?.additionalInfo?.map((item, index) => (
              <div className="accordion_item" key={index}>
                <button
                  className="accordion_header"
                  onClick={() => handleAccordionToggle(index)}
                >
                  <p className="text-sm accordion_title uppercase bold">{item?.title || ""}</p>

                  <img
                    className={`productDetail_quantity_icon ${accordionIndex === index ? "rotated" : ""}`}
                    src="/icons/LongArrowRight.svg"
                    alt="loading"
                  />
                </button>

                <div
                  className={`accordion_content ${accordionIndex === index ? "open" : ""}`}
                >
                  <div className="text-base">{htmlParser(item?.description || "")}</div>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>

    </div >
  )
}

export default ProductContant