import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import GreenBoxBtn from "@/components/buttons/GreenBoxBtn";
import { formatePrice, htmlParser } from "@/utils/Util";
import { StockStatus } from "@/utils/Constant";
import { useSizeGuideStore } from "@/store/sizeguide-store";
import { useMutation, useQuery } from "@apollo/client/react";
import { ADD_TO_WISHLIST, GET_WISHLIST_ITEMS, REMOVE_FROM_WISHLIST } from "@/graphql";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

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
}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?._id || user?.id;
  // Centralized wishlist query
  const { data: wishlistData } = useQuery(GET_WISHLIST_ITEMS, {
    variables: { userId },
    skip: !userId
  });

  const wishlistItems = wishlistData?.getWishlistItems?.items || [];

  // Check if current product (and variant, if selected) is in wishlist
  const wishlistItem = wishlistItems.find(item =>
    item.productId === data?._id &&
    (variantMatched?.variantDetailId ? item.variantId === variantMatched.variantDetailId : true)
  );

  const isWishlisted = !!wishlistItem;
  const wishlistId = wishlistItem?._id;

  // Mutations with cache updates
  const [addToWishlist, { loading: addLoading }] = useMutation(ADD_TO_WISHLIST, {
    update(cache, { data: { addToWishlist: newItem } }) {
      const existing = cache.readQuery({
        query: GET_WISHLIST_ITEMS,
        variables: { userId }
      });
      if (existing && newItem) {
        cache.writeQuery({
          query: GET_WISHLIST_ITEMS,
          variables: { userId },
          data: {
            getWishlistItems: {
              ...existing.getWishlistItems,
              items: [...existing.getWishlistItems.items, newItem],
              totalCount: existing.getWishlistItems.totalCount + 1
            }
          }
        });
      }
    },
    onCompleted: () => toast.success("Added to wishlist"),
    onError: (err) => toast.error(err.message),
  });

  const [removeFromWishlist, { loading: removeLoading }] = useMutation(REMOVE_FROM_WISHLIST, {
    update(cache) {
      const existing = cache.readQuery({
        query: GET_WISHLIST_ITEMS,
        variables: { userId }
      });
      if (existing) {
        cache.writeQuery({
          query: GET_WISHLIST_ITEMS,
          variables: { userId },
          data: {
            getWishlistItems: {
              ...existing.getWishlistItems,
              items: existing.getWishlistItems.items.filter(item => item._id !== wishlistId),
              totalCount: Math.max(0, existing.getWishlistItems.totalCount - 1)
            }
          }
        });
      }
    },
    onCompleted: () => toast.success("Removed from wishlist"),
    onError: (err) => toast.error(err.message),
  });

  const handleWishlistToggle = async () => {
    if (!userId) {
      toast.info("Please login to add to wishlist");
      router.push("/login");
      return;
    }

    if (isWishlisted) {
      if (wishlistId) {
        await removeFromWishlist({ variables: { wishlistId, userId } });
      } else {
        toast.error("Could not find wishlist item ID");
      }
    } else {
      await addToWishlist({
        variables: {
          input: {
            productId: data?._id,
            ...(variantMatched?.variantDetailId ? { variantId: variantMatched.variantDetailId } : {})
          },
          userId,
        },
      });
    }
  };
  const [selectedVariants, setSelectedVariants] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null); // "color" | "size" | null
  const [accordionIndex, setAccordionIndex] = useState(null);
  const { openSizeGuide } = useSizeGuideStore((state) => state);
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
    setOpenDropdown(null);
  };

  const clearVariants = () => {
    setAssetsFilter([]);
    setSelectedVariants({});
    setCartBtn(false);
    setOpenDropdown(null);
  };

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
    openSizeGuide(sizeGuideAsset);
  };

  if (!data) return null;
  return (
    <>
      <div className="productDetail_right">
        <div className="productDetail_sticky">
          <div className="productDetail_info">
            <div className="productDetail_info_left">
              {data?.categories?.map((item) => {
                return (
                  <Link prefetch key={item?._id} scroll={false} href={`/${item?.slug || ""}`} title={item?.name || ""}>
                    <p className="productDetail_category text-lg">{item?.name || ""}</p>
                  </Link>
                )
              })}
              <h1 className="productDetail_title text-xl ">{data?.name || ""}</h1>
              <div className="prd_desc text-lg primary-font">
                {htmlParser(data?.description)}
              </div>
              <p className="productDetail_price text-2xl ">{formatePrice(finalPrice || 0)}</p>
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
                        <img
                          className={`productDetail_quantity_icon productDetail_select_inner_elem_img ${openDropdown === item?.optionName ? "rotate_icon" : ""
                            }`}
                          src="/icons/LongArrowDown.svg"
                          alt="loading"
                          title="Dropdown"
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
                          const selected = selectedVariants[productOption.optionName] === `${choice.name}`;
                          return (
                            <div
                              key={`option-value-${j}`}
                              onClick={() => {
                                handleVariants(
                                  productOption.optionName,
                                  choice.name
                                );
                                setAssetsFilter(choice?.assetsId)
                              }}
                              style={{
                                opacity: selected ? 1 : 0.5,
                              }}

                              className="select_color_paren">
                              {productOption?.optionName === "color" ? (
                                <>
                                  <div
                                    style={{
                                      borderColor: selected ? "#174d38" : "#a5a5a5",
                                    }} className="color_div">
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
                                  <div style={{
                                    borderColor: selected ? "#174d38" : "#a5a5a5",
                                  }} className=" size_div">
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
                title={loading ? "Loading..." : !cartBtn ? "Select Options" : isOutOfStock ? StockStatus.OUT_OF_STOCK : "Add To Cart"}
                onClick={handleAddToCart}
              />
              <div className="productDetail_btn_icon center" onClick={handleWishlistToggle}>
                <div className="icon_pr">
                  <Image
                    className={`short_links_icon_heart ${isWishlisted ? 'hidden' : ''}`}
                    src="/icons/greenHeart.svg"
                    alt="heart"
                    title="Wishlist"
                    width={24}
                    height={24}
                    priority={false}
                  />
                  <Image
                    className={`short_links_icon_heart_hover ${isWishlisted ? 'show_filled' : ''}`}
                    src="/icons/heartFill.svg"
                    alt="heart filled"
                    title="Wishlist"
                    width={24}
                    height={24}
                    priority={false}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="additional_info_paren">
            {data?.additionalInfo.length > 0 && (
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

                      <img
                        className={`productDetail_quantity_icon ${accordionIndex === index ? "rotated" : ""
                          }`}
                        src="/icons/LongArrowDown.svg"
                        alt="loading"
                        title="Dropdown"
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