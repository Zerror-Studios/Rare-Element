import React, { useEffect, useState } from "react";
import gsap from "gsap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client/react";
import { ADD_ITEM_TO_CART, CART_LIST, REMOVE_ITEM_FROM_CART } from "@/graphql";
import { useAuthStore } from "@/store/auth-store";
import { useVisitor } from "@/hooks/useVisitor";
import { formatePrice, getCartItemCount } from "@/utils/Util";
import GreenBoxBtn from '@/components/buttons/GreenBoxBtn';
import CartItem from '@/components/cart/CartItem';
import { RiCloseLine } from "@remixicon/react";
import { AuthCookies } from "@/utils/AuthCookies";

const CartDrawer = ({ isOpen, closeCart, overlayRef }) => {
  const router = useRouter();
  const token = AuthCookies.get();
  const { visitorId } = useVisitor();
  const { user, isLoggedIn } = useAuthStore((state) => state);

  const [isBtnLoading, setIsBtnLoading] = useState(false);

  const [addCartItem, { loading: itemAddLoader }] =
    useMutation(ADD_ITEM_TO_CART);
  const [removeCartItem, { loading: itemRemoveLoader }] = useMutation(
    REMOVE_ITEM_FROM_CART
  );

  const cartListPayload = isLoggedIn
    ? { token }
    : visitorId
      ? { guestId: visitorId }
      : {};

  const {
    data: cartResponse,
    loading,
    refetch,
  } = useQuery(CART_LIST, {
    skip: !isOpen,
    variables: cartListPayload,
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-first",
  });

  const {
    _id,
    discountedPrice = 0,
    cart = [],
  } = cartResponse?.getCart || {};

  const count = getCartItemCount(cart);

  const handleAddItem = async (productId, variantDetail) => {
    try {
      const { __typename, ...variantWithoutTypename } = variantDetail;
      const payload = {
        input: {
          productId,
          variantDetail: variantWithoutTypename,
          ...(isLoggedIn && token ? { token } : {}),
        },
        ...(!isLoggedIn && visitorId ? { guestId: visitorId } : {}),
      };

      const { data: response } = await addCartItem({ variables: payload });
      const message = response?.addItemToCart;
      if (!message) return;
      toast.success(message || "Item added successfully!");
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to add item in cart");
    }
  };

  const handleRemoveItem = async (
    productId,
    variantDetailId,
    isCompleteRemove = true
  ) => {
    try {
      const input = {
        ...(isLoggedIn && token ? { userId: user?._id } : {}),
        ...(!isLoggedIn && visitorId ? { guestId: visitorId } : {}),
        productId,
        variantDetailId,
        isCompleteRemove,
      };
      const { data: response } = await removeCartItem({ variables: { input } });
      const message = response?.removeItemFromCart;
      if (!message) return;
      toast.success(message || "Item removed successfully!");
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to remove item from cart");
    }
  };

  const navigateCheckout = async () => {
    try {
      setIsBtnLoading(true);
      await router.push(`/checkout/${_id}`);
      closeCart();
    } catch (err) {
      console.error("Navigation failed:", err);
    } finally {
      setIsBtnLoading(false);
    }
  };

  useEffect(() => {
    if (window.innerWidth < 1020) {
      if (isOpen) {
        if (window.lenis) window.lenis.stop();
        const tedv = gsap.timeline();
        tedv.to(".cartBag_openBagParent", {
          right: "0",
          duration: .8,
          ease: "in-out-quint",
        })
          .to(overlayRef.current, {
            opacity: 1,
            duration: 0.5,
          }, "<+=0.1")

      } else {
        if (window.lenis) window.lenis.start();
        const dsc = gsap.timeline();
        dsc.to(".cartBag_openBagParent", {
          right: "-100%",
          duration: .8,
          ease: "in-out-quint",
        })
          .to(overlayRef.current, {
            opacity: 0,
            duration: 0.5,
          }, "<+=0.1")
      }

    } else {
      if (isOpen) {
        if (window.lenis) window.lenis.stop();
        const tedv = gsap.timeline();
        tedv.to(".cartBag_openBagParent", {
          right: "0rem",
          duration: .8,
          ease: "in-out-quint",
        })
          .to(overlayRef.current, {
            opacity: 1,
            duration: 0.5,
          }, "<+=0.1")

      } else {
        if (window.lenis) window.lenis.start();
        const dsc = gsap.timeline();
        dsc.to(".cartBag_openBagParent", {
          right: "-42rem",
          duration: .8,
          ease: "in-out-quint",
        })
          .to(overlayRef.current, {
            opacity: 0,
            duration: 0.5,
          }, "<+=0.1")
      }

    }
  }, [isOpen])

  return (
    <div className="cartBag_openBagParent">
      <div className="cartBag_bagHeader">
        <div className="cartBag_bagHeaderLeft">
          <h2 className="cartBag_bagTitle text-2xl">Cart</h2>
          <p className="cartBag_bagCount text-base"> ({count}) </p>
        </div>
        <div
          onClick={closeCart}
          className="cartBag_menuHeaderClose">
          <RiCloseLine size={14} className='close_icon' />
        </div>
      </div>
      {/* bag scroll */}
      <div data-lenis-prevent className="cartBag_bagScroll">
        {cart?.length > 0 ? (
          cart.map((item, i) => (
            <CartItem
              key={`cart-product-item-${i}`}
              index={i}
              item={item}
              handleAddItem={handleAddItem}
              handleRemoveItem={handleRemoveItem}
              onClose={closeCart}
            />
          ))
        ) : (
          <div className="empty_cart_box">
            <p className='text-lg'>There are currently no items in your bag.</p>
          </div>
        )}
      </div>

      <div className="cartBag_bagFooter">
        <div className="cartBag_totalRow text-2xl">
          <p>Total</p>
          <p>{formatePrice(discountedPrice)}</p>
        </div>
        <div
          onClick={closeCart}
          className="cartBag_checkoutButton">
          <GreenBoxBtn
            title={"Proceed to Checkout"}
            onClick={navigateCheckout}
            loading={isBtnLoading}
          />
          <p className="text-base  crt_btn_txt"> Free shipping on orders above ₹3,000, with easy returns and fast support—always.</p>
        </div>
      </div>
    </div>
  )
}

export default CartDrawer