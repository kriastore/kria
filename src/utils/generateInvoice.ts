import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { resolvePricing } from "@/utils/pricing";
import { orderGstBreakdown } from "@/utils/gst";

export function generateInvoice(order: any) {
  const doc = new jsPDF();
  const generatedAt = new Date();

  // Brand colors
  const darkBrown: [number, number, number] = [45, 45, 45];
  const accent: [number, number, number] = [210, 105, 63];
  const lightBg: [number, number, number] = [243, 237, 228];

  // ===== HEADER / BRAND =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...darkBrown);
  doc.text("KRIA", 14, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...darkBrown);
  doc.text("Vittlraj Krithika", 14, 24);
  doc.text("No 8, Thiruvalluvar Nagar main road, V.G.Rao nagar A sector,", 14, 30);
  doc.text("Katpadi, Vellore, Tamilnadu - 632007", 14, 36);
  doc.text("GSTIN: 33ATPPK2643B1ZZ", 14, 42);
  doc.text("Email: support@kriastore.in", 14, 48);
  doc.text("Phone: +91 98944 14445", 14, 54);

  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(14, 59, 196, 59);

  // ===== INVOICE DETAILS =====
  doc.setFontSize(11);
  doc.setTextColor(...darkBrown);
  doc.text(`Invoice No: KRIA-INV-${order.invoiceNo ?? order.id}`, 14, 69);
  doc.text(`Order ID: KRIA-ORD-${order.id}`, 14, 75);
  doc.text(
    `Order Date: ${order.createdAt?.toDate?.().toLocaleDateString()}`,
    14,
    81
  );
  doc.text(`Payment Method: ${order.paymentMethod ?? "Razorpay"}`, 14, 87);
  doc.text(`Payment Status: ${order.paymentStatus ?? "Paid"}`, 14, 93);

  // ===== BILLING DETAILS =====
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkBrown);
  doc.text("Billed To", 14, 105);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...darkBrown);
  doc.text(`Name: ${order.customer?.name}`, 14, 111);
  doc.text(`Email: ${order.customer?.email}`, 14, 117);
  doc.text(`Phone: ${order.customer?.phone}`, 14, 123);

  doc.text("Shipping Address:", 14, 131);
  doc.text(
    `${order.customer?.address}, ${order.customer?.stateCity ?? ""} - ${order.customer?.pinCode ?? ""}, India`,
    14,
    137
  );

  // ===== CALCULATIONS =====
  const subtotal = order.items.reduce((sum: number, item: any) => {
    const basePrice = resolvePricing({
      Price: item.product?.Price,
      OriginalPrice: item.product?.OriginalPrice,
      DiscountPercent: item.product?.DiscountPercent,
    }).selling;
    const customPrice =
      item.isCustomized && item.customPrice ? item.customPrice : 0;
    return sum + (basePrice + customPrice) * item.Quantity;
  }, 0);

  const shipping = order.shippingCharge ?? 0;
  const discount = order.discountAmount ?? order.discount ?? 0;
  const grandTotal = order.total;

  const gst = orderGstBreakdown(order);

  // ===== ORDER TABLE =====
  autoTable(doc, {
    startY: 149,
    head: [["Item Name", "Qty", "Price", "Total"]],
    body: order.items.map((item: any) => {
      const basePrice = resolvePricing({
        Price: item.product?.Price,
        OriginalPrice: item.product?.OriginalPrice,
        DiscountPercent: item.product?.DiscountPercent,
      }).selling;
      const customPrice =
        item.isCustomized && item.customPrice ? item.customPrice : 0;
      const itemPrice = basePrice + customPrice;
      const itemTotal = itemPrice * item.Quantity;

      return [
        item.product?.ProductName ?? "Product",
        item.Quantity,
        `Rs. ${itemPrice}`,
        `Rs. ${itemTotal}`,
      ];
    }),
    styles: { fontSize: 10, textColor: darkBrown },
    headStyles: {
      fillColor: lightBg,
      textColor: darkBrown,
    },
    alternateRowStyles: { fillColor: [249, 246, 240] },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // ===== PRICE BREAKDOWN (GST split) =====
  let y = finalY + 10;
  doc.setFontSize(11);
  doc.setTextColor(...darkBrown);
  doc.setFont("helvetica", "normal");

  doc.text(`Subtotal: Rs. ${subtotal}`, 14, y);
  y += 6;

  if (discount > 0) {
    doc.text(`Discount: -Rs. ${discount}`, 14, y);
    y += 6;
  }

  doc.text(`Taxable Value: Rs. ${gst.taxableValue}`, 14, y);
  y += 6;
  doc.text(`CGST @ ${gst.cgstRate}%: Rs. ${gst.cgst}`, 14, y);
  y += 6;
  doc.text(`SGST @ ${gst.sgstRate}%: Rs. ${gst.sgst}`, 14, y);
  y += 6;

  doc.text(
    `Shipping: Rs. ${shipping} ${shipping === 0 ? "(Free)" : `(incl. CGST ${gst.shippingCgst} + SGST ${gst.shippingSgst})`}`,
    14,
    y
  );
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total: Rs. ${grandTotal}`, 14, y);

  // ===== DELIVERY INFO =====
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...darkBrown);
  doc.text("Estimated Delivery: 2–4 working days", 14, y);
  y += 6;
  doc.text(
    `Courier Partner: ${order.courierPartner ?? "DTDC"}`,
    14,
    y
  );

  // ===== RETURN POLICY =====
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(...darkBrown);
  doc.text(
    "Easy returns within 14 days of delivery. Product must be unused and in original packaging.",
    14,
    y
  );

  // ===== FOOTER =====
  y += 10;
  doc.text(
    "Thank you for shopping with Kria. For support, WhatsApp us at +91 98944 14445.",
    14,
    y
  );

  // ===== SAVE =====
  doc.save(`KRIA_INVOICE_${order.id}.pdf`);
}
