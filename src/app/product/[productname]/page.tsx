"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReviewCarousel from "@/components/ReviewCarousel";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useCartSidebar } from "@/context/CartSidebarContext";
import { resolvePricing } from "@/utils/pricing";
import ProductImage from "@/components/ProductImage";
import PriceText from "@/components/PriceText";
import Image from "next/image";

type Product = {
  ID: number;
  Description: string;
  Product: string;
  ProductName?: string;
  Price?: number;
  Material?: string;
  Instructions?: string;
  Care?: string;
  ImageUrl1?: string;
  ImageUrl2?: string;
  ImageUrl3?: string;
  ImageUrl1Medium?: string;
  ImageUrl1Thumb?: string;
  ImageUrl2Medium?: string;
  ImageUrl2Thumb?: string;
  ImageUrl3Medium?: string;
  ImageUrl3Thumb?: string;
  Stock?: number;
  Category?: string;
  StockType?: string;
  IsCustomizable?: boolean;
  CustomizationNote?: string;
  DeliveryTime?: string;
  DiscountPercent?: number;
  OriginalPrice?: number;
  IsFeatured?: boolean;
  Colors?: string[];
  Sizes?: string[];
};

export default function ProductPage() {
  const { productname } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem, removeItem } = useCart();
  const { openCart } = useCartSidebar();
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [careOpen, setCareOpen] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [showAdded, setShowAdded] = useState(false);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productname || !db) return;

      const q = query(
        collection(db!, "inventory"),
        where("ProductName", "==", decodeURIComponent(productname as string))
      );

      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data() as Product;
        setProduct(data);
        const sizes = data.Sizes || [];
        const colors = data.Colors || [];
        setSelectedSize(sizes.length > 0 ? sizes[0] : "");
        setSelectedColor(colors.length > 0 ? colors[0] : "");
      }

      setLoading(false);
    };

    fetchProduct();
  }, [productname]);

  // Fetch cart quantity for this product and size
  useEffect(() => {
    const fetchCartQuantity = async () => {
      if (!user?.email || !db || !product) return;

      // Check if this product uses general stock (no sizes defined) or size-based stock
      const hasProductSizes = (product as any).Sizes && (product as any).Sizes.length > 0;
      const catRaw = (product as any).Category || (product as any).Product || "";
      const catStr = typeof catRaw === 'string' ? catRaw : String(catRaw || '');
      const isGeneralStock = !hasProductSizes || catStr === "Purses" || catStr === "Earrings" ||
                              catStr.toLowerCase().includes("purse") ||
                              catStr.toLowerCase().includes("earring");
      const sizeToUse = isGeneralStock ? "One Size" : (hasProductSizes ? selectedSize : "One Size");

      const cartRef = collection(db!, "Cart");
      const q = query(
        cartRef,
        where("UserMail", "==", user.email),
        where("ID", "==", product.ID),
        where("Size", "==", sizeToUse)
      );

      const snap = await getDocs(q);
      if (!snap.empty) {
        const cartItem = snap.docs[0].data();
        setCartQuantity(cartItem.Quantity || 0);
      } else {
        setCartQuantity(0);
      }
    };

    fetchCartQuantity();
  }, [user?.email, product, selectedSize]);

  // Fetch cross-category recommendations (Style It With)
  useEffect(() => {
    if (!product || !db) return;

    const fetchStyleItWith = async () => {
      // Determine complementary categories based on current product
      const currentCategoryRaw = (product as any).Product ?? (product as any).Category ?? (product as any).ProductName ?? "";
      const currentCategory = typeof currentCategoryRaw === 'string' ? currentCategoryRaw : String(currentCategoryRaw || "");
      let targetCategories: string[] = [];

      // Guard: only call toLowerCase on a string
      const catLower = currentCategory ? currentCategory.toLowerCase() : "";

      // If it's a dress, recommend accessories (purses, earrings)
      if (catLower.includes('dress')) {
        targetCategories = ['Purses', 'Earrings'];
      }
      // If it's an accessory (purse or earring), recommend dresses and other accessories
      else if (catLower.includes('purse')) {
        targetCategories = ['Short Dresses', 'Party Dresses', 'Earrings'];
      }
      else if (catLower.includes('earring')) {
        targetCategories = ['Short Dresses', 'Party Dresses', 'Purses'];
      }
      // For other categories, show a mix of everything except the current category
      else {
        targetCategories = ['Short Dresses', 'Party Dresses', 'Purses', 'Earrings'];
      }

      // Fetch products from target categories in parallel
      const results = await Promise.allSettled(
        targetCategories.map((category) =>
          getDocs(query(collection(db!, "inventory"), where("Product", "==", category)))
        )
      );

      const allRecommendations: Product[] = [];
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          result.value.docs.forEach((d) => allRecommendations.push(d.data() as Product));
        }
      });

      // Shuffle and select 4 random recommendations
      const shuffled = allRecommendations
        .filter((p) => p.ID !== product.ID) // Exclude current product
        .sort(() => 0.5 - Math.random());

      setRelatedProducts(shuffled.slice(0, 4));
    };

    fetchStyleItWith();
  }, [product]);

  // Preload adjacent gallery images
  useEffect(() => {
    if (!product) return;
    const imgs = [
      product.ImageUrl1 || "/placeholder.png",
      product.ImageUrl2,
      product.ImageUrl3,
    ].filter(Boolean) as string[];
    if (imgs.length <= 1) return;
    const preload = (url?: string) => {
      if (!url || url.startsWith("/")) return;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = url;
      document.head.appendChild(link);
    };
    const nextIdx = (imageIndex + 1) % imgs.length;
    const prevIdx = (imageIndex - 1 + imgs.length) % imgs.length;
    preload(imgs[nextIdx]);
    if (nextIdx !== prevIdx) preload(imgs[prevIdx]);
  }, [imageIndex, product]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F9F6F0]">
        <div className="w-8 h-8 border-2 border-[#E0D0B8] border-t-[#D2693F] animate-spin" />
        <p
          className="text-[#6B5A47] tracking-wide"
          style={{ fontFamily: "Tenor Sans", fontSize: "14px" }}
        >
          Loading product...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F6F0]">
        <p
          className="text-[#2D2D2D] font-semibold"
          style={{ fontFamily: "Tenor Sans", fontSize: "18px" }}
        >
          Product not found
        </p>
      </div>
    );
  }

  const images = [
    product.ImageUrl1 || "/placeholder.png",
    product.ImageUrl2,
    product.ImageUrl3,
  ].filter(Boolean) as string[];

  // Check if this product uses general stock (no sizes defined, or Purses/Earrings)
  const currentCategory = (product as any).Category || (product as any).Product || "";
  const hasSizes = (product.Sizes || []).length > 0;
  const isGeneralStockProduct = !hasSizes || currentCategory === "Purses" || currentCategory === "Earrings" ||
                                 currentCategory.toLowerCase().includes("purse") ||
                                 currentCategory.toLowerCase().includes("earring");

  const isMadeToOrder = product.StockType === "made_to_order";

  const pricing = resolvePricing({ Price: product.Price, OriginalPrice: (product as any).OriginalPrice, DiscountPercent: product.DiscountPercent });

  // Get available stock for selected size (accounting for items already in cart)
  const getAvailableStock = () => {
    // Made-to-order products have infinite stock
    if (isMadeToOrder) return Infinity;

    const totalStock = product.Stock !== undefined ? product.Stock : 0;
    return Math.max(0, totalStock - cartQuantity);
  };

  const availableStock = getAvailableStock();

  const handleAddToCart = async (addQty?: number) => {
    const qty = addQty ?? 1;

    // Check stock availability (skip for made-to-order)
    if (!isMadeToOrder) {
      const effectiveStock = availableStock;
      if (effectiveStock === 0) {
        alert(isGeneralStockProduct ? "This item is out of stock" : "This size is out of stock");
        return;
      }

      if (qty > effectiveStock) {
        alert(isGeneralStockProduct
          ? `Only ${effectiveStock} items available`
          : `Only ${effectiveStock} items available in size ${selectedSize}`
        );
        return;
      }
    }

    if (!user?.email || !db) {
      sessionStorage.setItem(
        "postAuthAction",
        JSON.stringify({
          type: "ADD_TO_CART",
          payload: {
            productId: product.ID,
            quantity: qty,
            size: selectedSize,
          },
          redirectTo: "/shop",
        })
      );

      router.push("/sign-in");
      return;
    }

    const cartRef = collection(db!, "Cart");

    // For general stock products, use "One Size" as the size identifier
    const sizeToUse = isGeneralStockProduct ? "One Size" : selectedSize;

    const q = query(
      cartRef,
      where("UserMail", "==", user.email),
      where("ID", "==", product.ID),
      where("Size", "==", sizeToUse)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      const docRef = snap.docs[0].ref;
      const prevQty = snap.docs[0].data().Quantity || 0;

      await updateDoc(docRef, {
        Quantity: prevQty + qty,
        ["Added On"]: serverTimestamp(),
      });
      setCartQuantity(prevQty + qty);
    } else {
      await addDoc(cartRef, {
        ID: product.ID,
        Quantity: qty,
        Size: sizeToUse,
        UserMail: user.email,
        ["Added On"]: serverTimestamp(),
      });
      setCartQuantity(qty);
    }

    for (let i = 0; i < qty; i++) {
      addItem(String(product.ID));
    }

    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 2000);
    openCart();
  };

  const handleRemoveFromCart = async () => {
    if (!user?.email || !db || cartQuantity <= 0) return;

    const cartRef = collection(db!, "Cart");
    const sizeToUse = isGeneralStockProduct ? "One Size" : selectedSize;
    const q = query(
      cartRef,
      where("UserMail", "==", user.email),
      where("ID", "==", product.ID),
      where("Size", "==", sizeToUse)
    );

    const snap = await getDocs(q);
    if (snap.empty) return;

    const docRef = snap.docs[0].ref;
    const prevQty = snap.docs[0].data().Quantity || 0;

    if (prevQty <= 1) {
      await deleteDoc(docRef);
      setCartQuantity(0);
      removeItem(String(product.ID));
    } else {
      await updateDoc(docRef, {
        Quantity: prevQty - 1,
        ["Added On"]: serverTimestamp(),
      });
      setCartQuantity(prevQty - 1);
      removeItem(String(product.ID));
    }
  };

  const handleShare = async () => {
    const link = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: (product as any)?.ProductName || product.Description || "Product",
          url: link,
        });
      } else {
        await navigator.clipboard.writeText(link);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(link);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch (e) {
        alert("Could not copy link. Please copy manually: " + link);
      }
    }
  };

  return (
    <>
      {/* MAIN PRODUCT SECTION */}
      <div className="min-h-screen bg-[#F9F6F0] text-black px-1 sm:px-8 lg:px-12 pt-1 sm:pt-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">
          {/* IMAGE SECTION */}
          <div>
            <div className="relative w-full aspect-square overflow-hidden border border-[#E9E1D2] shadow-[0_2px_16px_rgba(45,32,20,0.06)] bg-white">
                <ProductImage
                  src={images[imageIndex] || "/placeholder.png"}
                  srcMedium={
                    imageIndex === 0 ? product.ImageUrl1Medium :
                    imageIndex === 1 ? product.ImageUrl2Medium :
                    product.ImageUrl3Medium
                  }
                  srcThumb={
                    imageIndex === 0 ? product.ImageUrl1Thumb :
                    imageIndex === 1 ? product.ImageUrl2Thumb :
                    product.ImageUrl3Thumb
                  }
                  size="medium"
                  alt={product.Description}
                  priority
                  className="w-full h-full cursor-zoom-in transition-transform duration-500 hover:scale-[1.03]"
                  onClick={() => setZoomImage(images[imageIndex] || "/placeholder.png")}
                />

            </div>

            {/* THUMBNAIL STRIP */}
            {images.length > 1 && (
              <div className="flex gap-3 mt-4 justify-center">
                {images.map((img, i) => {
                  const thumbUrl = i === 0 ? product.ImageUrl1Thumb : i === 1 ? product.ImageUrl2Thumb : product.ImageUrl3Thumb;
                  const medUrl = i === 0 ? product.ImageUrl1Medium : i === 1 ? product.ImageUrl2Medium : product.ImageUrl3Medium;
                  return (
                    <button
                      key={i}
                      onClick={() => setImageIndex(i)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 overflow-hidden border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D2693F] focus-visible:ring-offset-2 ${
                        i === imageIndex
                          ? "border-[#D2693F] shadow-[0_2px_8px_rgba(210,105,63,0.35)]"
                          : "border-[#E9E1D2] hover:border-[#C5A059] opacity-80 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={thumbUrl || medUrl || img}
                        alt={`Thumbnail ${i + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* DETAILS */}
          <div className="px-2 sm:px-0">
            <div className="flex items-start justify-between mb-2 gap-3">
              <h1
                className="text-[#211A12] leading-tight flex-1"
                style={{
                  fontFamily: 'Tenor Sans',
                  fontWeight: '600',
                  fontSize: '40px',
                  lineHeight: '1.15',
                  letterSpacing: '-0.01em'
                }}
              >
                {(product as any).ProductName ? (product as any).ProductName : product.Description}
              </h1>
              {/* Share button: only visible on mobile */}
              <div className="relative block sm:hidden ml-1 flex-shrink-0">
                <button
                  onClick={handleShare}
                  className="w-10 h-10 bg-[#F3EDE4] hover:bg-[#E0D0B8] active:scale-95 transition-all duration-150 flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ borderRadius: '50%' }}
                  title="Share product"
                >
                  <svg className="w-5 h-5 text-[#2D2D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                {shareCopied && (
                  <div className="absolute top-full mt-2 -right-2 bg-[#2D2D2D] text-white text-xs font-medium px-3 py-1.5 shadow-lg whitespace-nowrap">
                    Link copied
                  </div>
                )}
              </div>
            </div>

            <div className="mt-1">
              <div
                className="text-[#211A12] flex items-baseline flex-wrap gap-x-3"
                style={{
                  fontFamily: 'Tenor Sans',
                  fontWeight: '600',
                  fontSize: '36px'
                }}
              >
                <PriceText amount={pricing.selling} className="text-[#211A12]" />
                {pricing.discount > 0 && (
                  <span className="text-lg text-[#B0A38C] line-through font-normal"><PriceText amount={pricing.original} strikeThrough /></span>
                )}
              </div>
            </div>

            {/* Discount */}
            {pricing.discount > 0 && (
              <p className="inline-block text-xs font-semibold text-[#D2693F] bg-[#FBEDE4] px-2.5 py-1 mt-2 mb-3">
                {pricing.discount}% OFF
              </p>
            )}

            {/* Shipping Time (for made-to-order) */}
            {product.StockType === "made_to_order" && (
              <p className="text-sm text-[#9A6E50] mb-3">
                <Link href="/shipping-policy" className="underline underline-offset-2 decoration-[#9A6E50] hover:text-[#D2693F] transition-colors">Ships</Link> in {product.DeliveryTime || "7-10 days"}
              </p>
            )}

            {/* Customisation Section */}
            {product.IsCustomizable && (
              <div className="mb-4 p-4 bg-white border border-[#E0D0B8] shadow-[0_1px_6px_rgba(45,32,20,0.05)]">
                <div className="flex items-start gap-2.5 mb-0">
                  <svg className="w-5 h-5 text-[#D2693F] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-[#D2693F]">Customisation Available</p>
                    <p className="text-xs text-[#9A6E50] mt-0.5 leading-relaxed">
                      {product.CustomizationNote || "This product can be customised to your preference. Add your requirements in the notes section at checkout."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* COLOUR SELECTOR */}
            {(product.Colors || []).length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm text-[#5C5142]">Colour: <span className="font-semibold text-[#211A12]">{selectedColor}</span></p>
                <div className="flex gap-2 flex-wrap">
                  {product.Colors!.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 border font-semibold transition-all duration-150 text-sm ${
                        selectedColor === color
                          ? "bg-[#D2693F] text-white border-[#D2693F] shadow-[0_2px_6px_rgba(210,105,63,0.3)]"
                          : "bg-white border-[#E0D0B8] text-[#2D2D2D] hover:border-[#C5A059] hover:bg-[#FBF8F2]"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SIZE SELECTOR (dynamic from product data) */}
            {(product.Sizes || []).length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm text-[#5C5142]">Size: <span className="font-semibold text-[#211A12]">{selectedSize}</span></p>
                <div className="flex gap-2 flex-wrap">
                  {product.Sizes!.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border font-semibold transition-all duration-150 text-sm ${
                        selectedSize === size
                          ? "bg-[#D2693F] text-white border-[#D2693F] shadow-[0_2px_6px_rgba(210,105,63,0.3)]"
                          : "bg-white border-[#E0D0B8] text-[#2D2D2D] hover:border-[#C5A059] hover:bg-[#FBF8F2]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ADD TO CART / QUANTITY STEPPER */}
            <div className="mb-5">
              {availableStock === 0 && !isMadeToOrder && (
                <p className="text-sm text-[#C0392B] mb-2 font-medium">
                  {isGeneralStockProduct ? "Out of stock" : `Out of stock in size ${selectedSize}`}
                </p>
              )}
              <div className="relative" style={{ height: '54px', width: '350px', maxWidth: '100%' }}>
                {/* Add to Cart */}
                <button
                  onClick={() => handleAddToCart(1)}
                  disabled={availableStock === 0}
                  className={`absolute inset-0 flex items-center justify-center px-2 transition-all duration-300 ease-in-out ${
                    cartQuantity > 0 ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
                  } ${
                    availableStock === 0
                      ? 'bg-[#E9E1D2] text-[#A79A83] cursor-not-allowed'
                      : 'bg-[#D2693F] hover:bg-[#B85A34] active:scale-[0.99] text-white shadow-[0_3px_10px_rgba(210,105,63,0.35)] hover:shadow-[0_4px_14px_rgba(210,105,63,0.45)]'
                  }`}
                  style={{ fontFamily: 'Tenor Sans', fontWeight: '600', fontSize: '14px', letterSpacing: '0.02em' }}
                >
                  {availableStock === 0 ? 'Sold Out' : 'Add to Cart'}
                </button>

                {/* Quantity stepper */}
                <div className={`flex items-center border border-[#E0D0B8] bg-white overflow-hidden absolute inset-0 transition-all duration-300 ease-in-out ${
                  cartQuantity > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}>
                  <button
                    onClick={handleRemoveFromCart}
                    className="flex items-center justify-center flex-1 text-[#2D2D2D] hover:bg-[#F3EDE4] active:scale-90 transition-all duration-100 disabled:opacity-40 disabled:hover:bg-transparent"
                    disabled={cartQuantity <= 0}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span
                    className="flex items-center justify-center text-[#211A12] select-none"
                    style={{ fontFamily: 'Tenor Sans', fontWeight: '700', fontSize: '20px', minWidth: '60px', textAlign: 'center' }}
                  >
                    {cartQuantity}
                  </span>
                  <button
                    onClick={() => handleAddToCart(1)}
                    className="flex items-center justify-center flex-1 text-[#2D2D2D] hover:bg-[#F3EDE4] active:scale-90 transition-all duration-100 disabled:opacity-40 disabled:hover:bg-transparent"
                    disabled={!isMadeToOrder && availableStock > 0 && cartQuantity >= availableStock}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
              {showAdded && (
                <div className="text-[#2E7D4F] text-sm mt-2">
                  Added to Cart!
                </div>
              )}
            </div>

              {/* Description & Instructions */}
              <div className="mt-6 text-sm text-[#3A3226]">
                <h3 className="font-semibold text-[#211A12] mb-1.5 tracking-wide">Description</h3>
                <p className="text-sm text-[#5C5142] leading-relaxed whitespace-pre-line">{product.Description}</p>

                <h3 className="font-semibold text-[#211A12] mt-4 mb-1.5 tracking-wide">Instructions</h3>
                <p className="text-sm text-[#5C5142] leading-relaxed whitespace-pre-line">{product.Instructions || product.Material || 'No instructions available.'}</p>
              </div>

              {/* Divider */}
              <hr className="border-t border-[#E0D0B8] my-5" />

              {/* CARE Dropdown */}
              <div>
                <button
                  type="button"
                  onClick={() => setCareOpen(!careOpen)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-[#211A12] py-1.5 tracking-wide"
                >
                  <span>CARE</span>
                  <svg className={`w-4 h-4 text-[#9A6E50] transition-transform duration-200 ${careOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {careOpen && (
                  <p className="text-sm text-[#5C5142] leading-relaxed whitespace-pre-line mt-2">{product.Care || 'No care instructions available.'}</p>
                )}
              </div>

              {/* Divider */}
              <hr className="border-t border-[#E0D0B8] my-5" />

              {/* QUESTIONS? Dropdown */}
              <div>
                <button
                  type="button"
                  onClick={() => setQuestionsOpen(!questionsOpen)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-[#211A12] py-1.5 tracking-wide"
                >
                  <span>QUESTIONS?</span>
                  <svg className={`w-4 h-4 text-[#9A6E50] transition-transform duration-200 ${questionsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {questionsOpen && (
                  <p className="text-sm text-[#5C5142] leading-relaxed mt-2">
                    Please reach out to us on <a href="https://wa.me/919894414445" target="_blank" rel="noopener noreferrer" className="underline text-[#D2693F] hover:text-[#B85A34] transition-colors">WhatsApp</a> or email us at <a href="mailto:Kriastore@gmail.com" className="underline text-[#D2693F] hover:text-[#B85A34] transition-colors">Kriastore@gmail.com</a> and we'll be happy to help.
                  </p>
                )}
              </div>

              {/* Divider */}
              <hr className="border-t border-[#E0D0B8] my-5" />

              {/* Social Share — full width, icons + underlined text */}
              <div className="space-y-3">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-[#6B5A47] hover:text-[#D2693F] transition-colors"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  <span className="text-xs underline underline-offset-2">Share on Facebook</span>
                </a>
                <a
                  href={`https://wa.me/?text=${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-[#6B5A47] hover:text-[#D2693F] transition-colors"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span className="text-xs underline underline-offset-2">Share on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-3 text-[#6B5A47] hover:text-[#D2693F] transition-colors"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  <span className="text-xs underline underline-offset-2">{shareCopied ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
                <a
                  href={`mailto:?subject=${typeof window !== 'undefined' ? encodeURIComponent(document.title) : ''}&body=${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}`}
                  className="flex items-center gap-3 text-[#6B5A47] hover:text-[#D2693F] transition-colors"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span className="text-xs underline underline-offset-2">Share via Email</span>
                </a>
              </div>

              <div className="space-y-3 mt-5 pt-5 border-t border-[#E0D0B8]">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 bg-[#F3EDE4] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#D2693F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span
                    className="text-[#3A3226]"
                    style={{
                      fontFamily: 'Tenor Sans',
                      fontWeight: '400',
                      fontSize: '13px'
                    }}
                  >
                    PAN India Shipping
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 bg-[#F3EDE4] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#D2693F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-7V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <span
                    className="text-[#3A3226]"
                    style={{
                      fontFamily: 'Tenor Sans',
                      fontWeight: '400',
                      fontSize: '13px'
                    }}
                  >
                    Secure payment processing through Razorpay
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* STYLE IT WITH */}
      {relatedProducts.length > 0 && (
        <div className="relative z-10 bg-white text-black pl-8 pr-8 sm:pl-16 sm:pr-16 lg:pl-32 lg:pr-32 pt-0 pb-12 -mt-16">
          <hr className="border-t border-[#E9E1D2] mb-6" />
          <h2
            className="text-[#211A12] mb-5"
            style={{ fontFamily: 'Tenor Sans', fontWeight: '600', fontSize: '26px' }}
          >
            Style It With
          </h2>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
            {relatedProducts.map((rp) => (
              <div key={rp.ID} className="flex-shrink-0 w-1/2 sm:w-auto snap-start text-black transition px-1">
                <button
                  type="button"
                  onClick={() => router.push(`/product/${encodeURIComponent((rp as any).ProductName || rp.Description)}`)}
                  className="cursor-pointer block w-full overflow-hidden border border-[#EFE9DC] shadow-[0_1px_8px_rgba(45,32,20,0.05)] hover:shadow-[0_6px_18px_rgba(45,32,20,0.12)] hover:-translate-y-0.5 transition-all duration-300"
                  aria-label={`View ${(rp as any).ProductName || rp.Description}`}
                >
                  <ProductImage
                    src={rp.ImageUrl1}
                    srcMedium={(rp as any).ImageUrl1Medium}
                    srcThumb={(rp as any).ImageUrl1Thumb}
                    size="thumb"
                    alt={(rp as any).ProductName || rp.Description}
                    className="h-36 sm:h-44 lg:h-52 mb-0 self-start w-full"
                  />
                </button>

                <div className="flex flex-col items-start mt-2.5">
                  <p className="text-sm font-medium text-[#2D2D2D] leading-snug">{(rp as any).ProductName || rp.Description}</p>
                  <PriceText amount={resolvePricing({ Price: rp.Price, OriginalPrice: (rp as any).OriginalPrice, DiscountPercent: rp.DiscountPercent }).selling} className="font-bold text-base text-[#211A12] mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showSizeChart && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setShowSizeChart(false)}
        >
          <div
            className="relative bg-white shadow-2xl max-w-2xl w-full p-5"
            onClick={(e) => e.stopPropagation()} // prevents closing when clicking image
          >
            {/* Close button */}
            <button
              onClick={() => setShowSizeChart(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-[#F3EDE4] hover:bg-[#E0D0B8] text-[#2D2D2D] text-lg font-bold transition-colors"
            >
              ✕
            </button>

            <img
              src="/printrove-size-chart.jpg"
              alt="Printrove Size Chart"
              loading="lazy"
              decoding="async"
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white text-2xl font-bold z-10 transition-colors"
            >
              ✕
            </button>

            <img
              src={zoomImage}
              alt="Zoomed product"
              className="w-full max-h-[90vh] object-contain cursor-zoom-out"
            />
          </div>
        </div>
      )}

      {/* <ReviewCarousel /> removed as per request */}
    </>
  );
}