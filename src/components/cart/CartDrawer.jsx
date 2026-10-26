"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { ADD_ITEM_TO_CART, CART_LIST, REMOVE_ITEM_FROM_CART } from "@/graphql";
import { useAuthStore } from "@/store/auth-store";
import { useVisitor } from "@/hooks/useVisitor";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { formatePrice, getCartItemCount } from "@/utils/Util";
import GreenBoxBtn from '@/components/buttons/GreenBoxBtn';
import CartItem from '@/components/cart/CartItem';
import { RiCloseLine } from "@remixicon/react";
import {
  REMOVE_ITEM_OVERRIDES,
  getErrorInfo,
  getErrorMessage,
  isInvalidGuestIdError,
} from "@/utils/errors";
import { CtaEnum, trackCtaClick } from "@/utils/analytics-events";
import { useVariantAvailability } from "@/hooks/useVariantAvailability";
import {
  SOLD_OUT_CHECKOUT_MESSAGE,
  getCartLineStockId,
  hasSoldOutLine,
} from "@/utils/stock-signal";

import WishlistPopup from "./WishlistPopup";

const CartDrawer = ({ isOpen, closeCart, overlayRef }) => {
  const router = useRouter();
  const { visitorId, resetVisitorId, runWithGuestId } = useVisitor();
  const drawerRef = useRef(null);
  // PRD-014 UX-31: focus trap, Escape and inert-while-closed.
  useDialogA11y(drawerRef, isOpen, closeCart);
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

  // PRD-020 FR-12: a fresh stock read when the bag opens. A sold-out line
  // blocks checkout until it is removed; no signal changes nothing, and
  // checkout's own reservation stays the authority.
  const { fresh: freshStock } = useVariantAvailability(
    cart.map(getCartLineStockId),
    { skip: !isOpen },
  );
  const blockedBySoldOut = hasSoldOutLine(cart, freshStock);

  const handleAddItem = async (productId, variantId) => {
    try {
      const input = { productId, variantId: variantId || null, qty: 1 };

      // PRD-014 UX-37: guests re-issue a rejected id once, as on the PDP.
      const { data: response } = isLoggedIn
        ? await addCartItem({ variables: { input } })
        : await runWithGuestId((guestId) =>
          addCartItem({ variables: { input, guestId } }),
        );
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
      toast.error(
        getErrorMessage(err, "Failed to remove item from cart", REMOVE_ITEM_OVERRIDES),
      );
      // COM-32: the bag is out of date (several lines of this product).
      if (getErrorInfo(err).reason === "VARIANT_REQUIRED") await refetch();
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
    if (blockedBySoldOut) {
      toast.error(SOLD_OUT_CHECKOUT_MESSAGE);
      return;
    }
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
    <div
      ref={drawerRef}
      className="cartBag_openBagParent"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart_drawer_title"
      tabIndex={-1}
    >

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
          <h2 id="cart_drawer_title" className="cartBag_bagTitle text-2xl">Cart</h2>
          <p className="cartBag_bagCount text-base"> ({count}) </p>
        </div>
        <button
          type="button"
          onClick={closeCart}
          aria-label="Close cart"
          className="cartBag_menuHeaderClose">
          <RiCloseLine size={14} className='close_icon' aria-hidden="true" />
        </button>
      </div>
      {/* bag scroll */}
      <div data-lenis-prevent className="cartBag_bagScroll">
        {/* PRD-014 UX-37: loading and error are not "no items" */}
        {cartError && !isInvalidGuestIdError(cartError) ? (
          <div className="empty_cart_box" role="alert">
            <p className='text-lg'>{getErrorMessage(cartError, "We couldn't load your bag.")}</p>
            <button type="button" className="cart_retry_btn text-base uppercase" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : loading && !cartResponse ? (
          <div className="empty_cart_box" role="status">
            <p className='text-lg'>Loading your bag…</p>
          </div>
        ) : cart?.length > 0 ? (
          cart.map((item, i) => (
            <CartItem
              key={`cart-product-item-${i}`}
              index={i}
              item={item}
              handleAddItem={handleAddItem}
              handleRemoveItem={handleRemoveItem}
              pricesIncludeTax={pricesIncludeTax}
              onClose={closeCart}
              freshStock={freshStock}
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
          onClick={blockedBySoldOut ? undefined : closeCart}
          className="cartBag_checkoutButton">
          <GreenBoxBtn
            title={"Proceed to Checkout"}
            onClick={navigateCheckout}
            loading={isBtnLoading}
            data-testid="cart-checkout"
            aria-disabled={count === 0 || blockedBySoldOut}
            aria-describedby={blockedBySoldOut ? "cart_sold_out_note" : undefined}
            style={{
              cursor: count === 0 || blockedBySoldOut ? "not-allowed" : "pointer",
            }}
          />
          {blockedBySoldOut && (
            <p id="cart_sold_out_note" className="text-base cart_sold_out_note">
              {SOLD_OUT_CHECKOUT_MESSAGE}
            </p>
          )}
          <p className="text-base  crt_btn_txt"> Free shipping on all orders , with easy returns and fast support—always.</p>
        </div>
      </div>
    </div>
  )
}

export default CartDrawer