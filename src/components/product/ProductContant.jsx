"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { findVariantByOptions, formatePrice, htmlParser } from "@/utils/Util";
import { useSizeGuideStore } from "@/store/sizeguide-store";
import { useWishlist } from "@/hooks/useWishlist";
import {
  CtaEnum,
  getAnalyticsItemId,
  trackCtaClick,
  trackSelectVariant,
  trackSizeGuideOpen,
} from "@/utils/analytics-events";
import { usePathname } from "next/navigation";

const ProductContant = ({
  data = {},
  finalPrice,
  loading,
  notifyLoading,
  isOutOfStock,
  cartBtn,
  variantMatched, // Receive variantMatched from parent
  setFinalPrice,
  setVariantMatched,
  setCartBtn,
  setAssetsFilter,
  handleAddToCart,
  handleNotifyMe,
  analyticsItemId,
}) => {

  const pathname = usePathname();
  const { isWishlisted: checkWishlisted, toggle, toggling } = useWishlist();
  const isWishlisted = checkWishlisted(data?._id);

  const handleWishlistToggle = async () => {
    if (toggling) return;
    trackCtaClick(CtaEnum.WISHLIST, { itemId: analyticsItemId });
    await toggle(data?._id, variantMatched?._id);
  };
  const [selectedVariants, setSelectedVariants] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null); // "color" | "size" | null
  const [accordionIndex, setAccordionIndex] = useState(null);
  const { openSizeGuide } = useSizeGuideStore((state) => state);

  const [selectionMode, setSelectionMode] = useState(false);
  const options = data?.productOptions || [];
  const selectedCount = Object.keys(selectedVariants).length;
  const allSelected = selectedCount === options.length;

  const assets = data.assets;

  // Initialize default variants and color
  // useEffect(() => {
  //   if (!data?.productOptions?.length) return;
  //   const defaults = {};
  //   data.productOptions.forEach((option) => {
  //     if (option.choices?.length) {
  //       defaults[option.optionName] = option.choices[0].name;
  //     }
  //   });

  //   setSelectedVariants(defaults);
  //   setCartBtn(Object.keys(defaults).length === data.productOptions.length);
  //   updatePriceBasedOnVariant(defaults);
  // }, [data]);

  const toggleDropdown = (type) => {
    setOpenDropdown((prev) => (prev === type ? null : type));
  };

  const handleAccordionToggle = (index) => {
    setAccordionIndex(accordionIndex === index ? null : index);
  };

  const updatePriceBasedOnVariant = (updatedVariants) => {
    const matchingVariant = findVariantByOptions(
      data?.variants,
      Object.values(updatedVariants)
    );

    // No published variant for this combination → the parent shows it as
    // unavailable (Notify me).
    setVariantMatched(matchingVariant || null);
    if (matchingVariant) setFinalPrice(matchingVariant.price || 0);
    return matchingVariant || null;
  };

  const handleVariants = (name, value) => {
    const updated = { ...selectedVariants, [name]: value };
    setSelectedVariants(updated);
    const matched = updatePriceBasedOnVariant(updated);

    const nextIndex = Object.keys(updated).length;
    // PRD-013 select_variant: there are no stock levels here, so "in
    // stock" means a published variant exists for the full selection.
    trackSelectVariant({
      itemId: getAnalyticsItemId(data, matched),
      variantId: matched?._id,
      variantLabel: Object.values(updated).join(" / "),
      inStock: nextIndex === options.length ? !!matched : undefined,
    });
    const nextOption = options[nextIndex];

    // ✅ IMPORTANT: update cart button readiness
    setCartBtn(nextIndex === options.length);

    if (nextOption) {
      setOpenDropdown(nextOption.optionName);
      setSelectionMode(false);
    } else {
      // All selected
      setOpenDropdown(null);
      setSelectionMode(false);
    }
  };



  const clearVariants = () => {
    const hasOptions = options.length > 0;
    setAssetsFilter([]);
    setSelectedVariants({});
    setCartBtn(!hasOptions && data?.variants?.length === 1);
    setVariantMatched(!hasOptions ? data?.variants?.[0] || null : null);
    setOpenDropdown(null);
  };

  useEffect(() => {
    clearVariants();
  }, [pathname]);

  // const accordionData = useMemo(() => {
  //   if (!data) return [];
  //   const descriptionBlock = data.description
  //     ? [
  //       {
  //         title: "Description",
  //         description: (data.description),
  //       },
  //     ]
  //     : [];
  //   const additionalInfoBlocks =
  //     data.additionalInfo?.map((item) => ({
  //       ...item,
  //       description: (item.description),
  //     })) || [];

  //   return [...descriptionBlock, ...additionalInfoBlocks];
  // }, [data]);

  const sizeGuideAsset = useMemo(() => {
    return assets?.find(asset => asset.isSizeGuide === true) || null;
  }, [assets]);

  const handleOpenSizeGuide = () => {
    if (!sizeGuideAsset) return;
    trackCtaClick(CtaEnum.SIZE_GUIDE, { itemId: analyticsItemId });
    trackSizeGuideOpen(analyticsItemId);
    openSizeGuide(sizeGuideAsset);
  };

  const handleNotifyClick = () => {
    trackCtaClick(CtaEnum.NOTIFY_ME, { itemId: analyticsItemId });
    handleNotifyMe();
  };

  const handleMainButtonClick = () => {
    if (loading || isOutOfStock) return;
    trackCtaClick(allSelected ? CtaEnum.ADD_TO_CART : CtaEnum.BUY_NOW, {
      itemId: analyticsItemId,
    });

    // ✅ ALWAYS allow add to cart when all selected
    if (allSelected) {
      handleAddToCart();
      return;
    }

    // Start selection flow
    setSelectionMode(true);

    const nextOption = options[selectedCount];
    if (nextOption) {
      setOpenDropdown(nextOption.optionName);
    }
  };



  const buttonTitle = loading
    ? "Loading..."
    : isOutOfStock
      ? "Unavailable"
      : allSelected
        ? "Add To Cart"
        : selectionMode
          ? "Select Options first"
          : "Buy Now";



  if (!data) return null;
  return (
    <>
      <div className="productDetail_right">
        <div className="productDetail_sticky">
          <div className="productDetail_info">
            <div className="productDetail_info_left">
              {data?.categories?.map((item) => {
                return (
                  <Link prefetch key={item?._id} scroll={false} href={`/${item?.slug || ""}`} >
                    <p className="productDetail_category text-lg">{item?.name || ""}</p>
                  </Link>
                )
              })}
              <h1 className="productDetail_title text-xl ">{data?.name || ""}</h1>
              <div className="prd_desc text-lg primary-font">
                {htmlParser(data?.description)}
              </div>
              <div className="product_price_group">
                <p className="productDetail_price text-2xl ">{formatePrice(finalPrice || 0)}</p>
                {variantMatched?.compareAtPrice > finalPrice && (
                  <p className="line-through text-base">{formatePrice(variantMatched.compareAtPrice)}</p>
                )}
                <p className="inclusive_tax_msg text-xs">(Incl. of all taxes)</p>
              </div>
            </div>
          </div>
          <div className="">
            <div className="productDetail_options">
              <div className="clear_variatns_btn">
                <button type="button" onClick={clearVariants} className="">
                  <p className="uppercase text-xs">
                    Clear Options
                  </p>
                </button>
              </div>
              <div className="productDetail_row">
                {data?.productOptions?.map((item, index) => {
                  const selectOption = selectedVariants[item?.optionName] || item?.optionName;
                  return (
                    <div
                      key={`option-select-${index}`}
                      className={`productDetail_select ${openDropdown === item?.optionName ? "active" : ""}`}
                    >
                      <button className="text-base" onClick={() => toggleDropdown(item?.optionName)}>
                        <p className="productDetail_select_inner_elem capitalize">{selectOption?.replace(/(\d)([a-zA-Z]+)/, "$1 $2")}</p>
                        <Image height={10} width={10}
                          className={`productDetail_quantity_icon productDetail_select_inner_elem_img ${openDropdown === item?.optionName ? "rotate_icon" : ""
                            }`}
                          src="/icons/LongArrowDown.svg"
                          alt=""

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
                      <div className="color_selection">
                        {productOption.choices?.map((choice, j) => {
                          const selected =
                            selectedVariants[productOption.optionName] === choice.name;

                          const hasSelection = Boolean(
                            selectedVariants[productOption.optionName]
                          );

                          const opacity = hasSelection
                            ? selected
                              ? 1
                              : 0.5
                            : 1;
                          return (
                            <div
                              style={{
                                opacity,
                                transition: "opacity 0.25s ease",
                              }}
                              key={`option-value-${j}`}
                              onClick={() => {
                                handleVariants(
                                  productOption.optionName,
                                  choice.name
                                );
                                setAssetsFilter(choice?.assetsId)
                              }}
                              data-testid="pdp-option-choice"
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
                                <>
                                  <div className=" size_div">
                                    <div className=" size_inner center">
                                      <p style={{
                                        textDecoration: selected ? "underline" : "none",
                                      }} className="text-base capitalize ">{choice?.name?.replace(/(\d)([a-zA-Z]+)/, "$1 $2")}</p>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {data?.assets?.some(a => a.isSizeGuide) && (
                        <div className="clear_variatns_btn size_guide_btn">
                          <button type="button" onClick={handleOpenSizeGuide}>
                            <p className="uppercase text-xs">SIZE GUIDE</p>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* <div className="productDetail_quantity text-xl">
            <button className="productDetail_quantity_btn">
              <img className="productDetail_quantity_icon" src="/icons/minus.svg" alt="img" />
            </button>
            <p>1</p>
            <button className="productDetail_quantity_btn">
              <img className="productDetail_quantity_icon" src="/icons/plus.svg" alt="img" />
            </button>
          </div> */}
            </div>
            <div className="productDetail_addtocart">

              {isOutOfStock && (
                <GreenBoxBtn title={notifyLoading ? "Loading..." : "Notify me"} onClick={handleNotifyClick} />
              )}
              <GreenBoxBtn
                loading={loading}
                title={buttonTitle}
                onClick={handleMainButtonClick}
                data-testid="pdp-add-to-cart"
              />

              <div className="productDetail_btn_icon center" onClick={handleWishlistToggle}>
                <div className="icon_pr">
                  <Image
                    className={`short_links_icon_heart ${isWishlisted ? 'hidden' : ''}`}
                    src="/icons/greenHeart.svg"
                    alt="heart"
                    width={24}
                    height={24}
                    priority={false}
                  />
                  <Image
                    className={`short_links_icon_heart_hover ${isWishlisted ? 'show_filled' : ''}`}
                    src="/icons/heartFill.svg"
                    alt="heart filled"
                    width={24}
                    height={24}
                    priority={false}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="additional_info_paren">
            {data?.additionalInfo?.length > 0 && (
              <div className="accordion_container">
                {data?.additionalInfo.map((item, index) => (
                  <div className="accordion_item" key={index}>
                    <button
                      className="accordion_header"
                      onClick={() => handleAccordionToggle(index)}
                    >
                      <p className="text-base accordion_title uppercase bold">
                        {item.title}
                      </p>

                      <Image height={10} width={10}
                        className={`productDetail_quantity_icon ${accordionIndex === index ? "rotated" : ""
                          }`}
                        src="/icons/LongArrowDown.svg"
                        alt=""

                      />
                    </button>

                    <div
                      className={`accordion_content ${accordionIndex === index ? "open" : ""
                        }`}
                    >
                      <div className="accordion_content_desc text-lg primary-font">
                        {htmlParser(item.description)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div >
    </>
  )
}

export default ProductContant