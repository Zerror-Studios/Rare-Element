"use client";

import React, { useEffect, useState } from "react";
import gsap from "gsap";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { ADD_ITEM_TO_CART, CART_LIST, REMOVE_ITEM_FROM_CART } from "@/graphql";
import { useAuthStore } from "@/store/auth-store";
import { useVisitor } from "@/hooks/useVisitor";
import { formatePrice, getCartItemCount } from "@/utils/Util";
import GreenBoxBtn from '@/components/buttons/GreenBoxBtn';
import CartItem from '@/components/cart/CartItem';
import { RiCloseLine } from "@remixicon/react";
import { getErrorMessage, isInvalidGuestIdError } from "@/utils/errors";
import { CtaEnum, trackCtaClick } from "@/utils/analytics-events";

import WishlistPopup from "./WishlistPopup";

const CartDrawer = ({ isOpen, closeCart, overlayRef }) => {
  const router = useRouter();
  const { visitorId, resetVisitorId } = useVisitor();
  const { isLoggedIn } = useAuthStore((state) => state);
  // The owner is the logged-in customer (token) or the guest id (SF-3).
  const guestVariables = !isLoggedIn && visitorId ? { guestId: visitorId } : {};
  const initialState = {
    popupActive: false,
    isBtnLoading: false,
    itemToSave: null,
  };

  const reducer = (state, action) => {
    switch (action.type) {
      case "SET_POPUP_ACTIVE":
        return { ...state, popupActive: action.payload };
      case "SET_BTN_LOADING":
        return { ...state, isBtnLoading: action.payload };
      case "SET_ITEM_TO_SAVE":
        return { ...state, itemToSave: action.payload };
      case "OPEN_WISHLIST_POPUP":
        return { ...state, popupActive: true, itemToSave: action.payload };
      case "CLOSE_WISHLIST_POPUP":
        return { ...state, popupActive: false, itemToSave: null };
      default:
        return state;
    }
  };

  const [state, dispatch] = React.useReducer(reducer, initialState);
  const { popupActive, isBtnLoading, itemToSave } = state;

  const [addCartItem, { loading: itemAddLoader }] =
    useMutation(ADD_ITEM_TO_CART);
  const [removeCartItem, { loading: itemRemoveLoader }] = useMutation(
    REMOVE_ITEM_FROM_CART
  );

  const cartListPayload = guestVariables;

  const {
    data: cartResponse,
    loading,
    error: cartError,
    refetch,
  } = useQuery(CART_LIST, {
    skip: !isOpen || (!isLoggedIn && !visitorId),
    variables: cartListPayload,
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-first",
  });

  // A rejected guest id (R2-C2) has no cart: drop it; the next add issues
  // a new one.
  useEffect(() => {
    if (!isLoggedIn && isInvalidGuestIdError(cartError)) resetVisitorId();
  }, [cartError, isLoggedIn, resetVisitorId]);

  const handleGuestError = (err) => {
    if (!isLoggedIn && isInvalidGuestIdError(err)) resetVisitorId();
  };

  const {
    _id,
    discountedPrice = 0,
    cart = [],
    pricesIncludeTax = false,
  } = cartResponse?.getCart || {};

  const count = getCartItemCount(cart);

  const handleAddItem = async (productId, variantId) => {
    try {
      const payload = {
        input: { productId, variantId: variantId || null, qty: 1 },
        ...guestVariables,
      };

      const { data: response } = await addCartItem({ variables: payload });
      if (!response?.addItemToCart) return;
      toast.success("Item added successfully!");
      await refetch();
    } catch (err) {
      console.error(err);
      handleGuestError(err);
      toast.error(getErrorMessage(err, "Failed to add item in cart"));
    }
  };

  const performRemoveItem = async (
    productId,
    variantId,
    isCompleteRemove = true
  ) => {
    try {
      const input = {
        ...guestVariables,
        productId,
        variantId: variantId || null,
        isCompleteRemove,
      };
      const { data: response } = await removeCartItem({ variables: { input } });
      if (!response?.removeItemFromCart) return;
      toast.success("Item removed successfully!");
      await refetch();
    } catch (err) {
      handleGuestError(err);
      toast.error(getErrorMessage(err, "Failed to remove item from cart"));
    }
  };

  const handleRemoveItem = async (
    productId,
    variantId,
    isCompleteRemove = true
  ) => {
    if (isCompleteRemove) {
      const item = cart.find(
        (i) =>
          i.productId === productId &&
          (i.variantId || null) === (variantId || null)
      );
      dispatch({ type: "OPEN_WISHLIST_POPUP", payload: item });
      return;
    }
    await performRemoveItem(productId, variantId, isCompleteRemove);
  };

  const navigateCheckout = async () => {
    if (count <= 0) return;
    trackCtaClick(CtaEnum.CHECKOUT);
    try {
      dispatch({ type: "SET_BTN_LOADING", payload: true });
      // Checkout is customer-only; the guest bag is merged at login.
      if (!isLoggedIn) {
        toast.info("Please log in to check out.");
        await router.push(`/login?next=${encodeURIComponent(`/checkout/${_id}`)}`);
      } else {
        await router.push(`/checkout/${_id}`);
      }
      closeCart();
    } catch (err) {
      console.error("Navigation failed:", err);
    } finally {
      dispatch({ type: "SET_BTN_LOADING", payload: false });
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

      {popupActive && (
        <WishlistPopup
          item={itemToSave}
          popupActive={popupActive}
          setPopupActive={(val) =>
            dispatch({ type: "SET_POPUP_ACTIVE", payload: val })
          }
          handleAddItem={handleAddItem}
          handleRemoveItem={performRemoveItem}
          onClose={closeCart}
        />
      )}

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
              pricesIncludeTax={pricesIncludeTax}
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
            style={{
              cursor: count === 0 ? "not-allowed" : "pointer",
            }}
          />
          <p className="text-base  crt_btn_txt"> Free shipping on all orders , with easy returns and fast support—always.</p>
        </div>
      </div>
    </div>
  )
}

export default CartDrawer