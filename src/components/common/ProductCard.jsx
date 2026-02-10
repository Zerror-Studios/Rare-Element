import React from "react";
import Image from "next/image";
import { useMutation, useQuery } from "@apollo/client/react";
import { ADD_TO_WISHLIST, REMOVE_FROM_WISHLIST, GET_WISHLIST_ITEMS } from "@/graphql";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

const ProductCard = React.memo(({ productId, name, ribbon, price, assets }) => {
    const router = useRouter();
    const { user } = useAuthStore();
    const userId = user?._id || user?.id;

    // Use centralized query for all wishlist items - Apollo deduplicates simultaneous requests
    const { data: wishlistData } = useQuery(GET_WISHLIST_ITEMS, {
        variables: { userId },
        skip: !userId,
    });

    const wishlistItems = wishlistData?.getWishlistItems?.items || [];
    const wishlistItem = wishlistItems.find(item => item.productId === productId);
    const isWishlisted = !!wishlistItem;
    const wishlistId = wishlistItem?._id;

    // Mutation to add to wishlist with cache update
    const [addToWishlist] = useMutation(ADD_TO_WISHLIST, {
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

    // Mutation to remove from wishlist with cache update
    const [removeFromWishlist] = useMutation(REMOVE_FROM_WISHLIST, {
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

    const handleWishlistToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();

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
                    input: { productId },
                    userId,
                },
            });
        }
    };


    const featuredAsset = assets?.find(a => a.isFeatured === true);
    const hoverAsset = assets?.find(a => a.isHover === true);

    const mainImage =
        featuredAsset && hoverAsset
            ? featuredAsset
            : assets?.[0];

    const hoverImage =
        featuredAsset && hoverAsset
            ? hoverAsset
            : assets?.[1];

    return (
        <div className="shopCard_card">
            {ribbon?.name && (
                <div className="ribbon_btn">
                    <p className="text-xs">{ribbon.name}</p>
                </div>
            )}
            {/* Heart Icons */}
            <div className="heart_icon" onClick={handleWishlistToggle}>
                <div className="icon_pr">
                    <Image
                        className={`short_links_icon_heart invert ${isWishlisted ? 'hidden' : ''}`}
                        src="/icons/heart.svg"
                        alt="heart"
                        width={24}
                        height={24}
                        priority={false}
                        sizes="24px"
                    />
                    <Image
                        className={`short_links_icon_heart_hover ${isWishlisted ? 'show_filled' : ''}`}
                        src="/icons/heartFill.svg"
                        alt="heart filled"
                        width={24}
                        height={24}
                        priority={false}
                        sizes="24px"
                    />
                </div>
            </div>

            {/* Hover Image */}
            <div className="shopCard_hoverImg center">
                <div className="shopCard_img_wrapper_img">
                    <Image
                        className="cover"
                        src={hoverImage?.path || "/green_logo.svg"}
                        alt={hoverImage?.altText || name || "Rare Element Product"}
                        width={600}
                        height={800}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                </div>
            </div>

            {/* Main Image */}
            <div className="shopCard_img_wrapper center">
                <div className="shopCard_img_wrapper_img">
                    <Image
                        className="cover"
                        src={mainImage?.path || "/green_logo.svg"}
                        alt={mainImage?.altText || name || "Rare Element Product"}
                        width={600}
                        height={800}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                </div>
            </div>


            {/* Name + Price */}
            <div className="shopCard_card_info">
                <p className="shopCard_item_name text-base uppercase">
                    {name || ""}
                </p>
                <p className="shopCard_item_price text-lg">{price}</p>
            </div>
        </div>
    );
});

export default ProductCard;
