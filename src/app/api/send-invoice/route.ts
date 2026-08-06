import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { orderGstBreakdown } from "@/utils/gst";

function resolveSellingPrice(item: any): number {
  const price = item.product?.Price || 0;
  const originalPrice = item.product?.OriginalPrice;
  const discountPercent = item.product?.DiscountPercent;

  if (discountPercent && discountPercent > 0 && originalPrice) {
    return Math.round(originalPrice * (1 - discountPercent / 100));
  }
  if (originalPrice && originalPrice < price) {
    return originalPrice;
  }
  return price;
}

async function generatePdfBuffer(order: any): Promise<Buffer> {
  const doc = new jsPDF();

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
  const orderId = order.id || order.orderId || "";
  const invoiceNo = order.invoiceNo || orderId;

  const createdAtDate =
    order.createdAt?.toDate?.() ??
    (order.createdAt ? new Date(order.createdAt) : new Date());

  doc.setFontSize(11);
  doc.setTextColor(...darkBrown);
  doc.text(`Invoice No: KRIA-INV-${invoiceNo}`, 14, 69);
  doc.text(`Order ID: KRIA-ORD-${orderId}`, 14, 75);
  doc.text(
    `Order Date: ${createdAtDate.toLocaleDateString()}`,
    14,
    81,
  );
  doc.text(`Payment Method: ${order.paymentMethod ?? "Razorpay"}`, 14, 87);
  doc.text(`Payment Status: ${order.paymentStatus ?? "Paid"}`, 14, 93);

  // ===== BILLING DETAILS =====
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkBrown);
  doc.text("Billed To", 14, 105);

  const customer = order.customer || {};
  const stateCity = customer.stateCity ?? "";
  const pinCode = customer.pinCode ?? "";

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...darkBrown);
  doc.text(`Name: ${customer.name ?? ""}`, 14, 111);
  doc.text(`Email: ${customer.email ?? ""}`, 14, 117);
  doc.text(`Phone: ${customer.phone ?? ""}`, 14, 123);

  doc.text("Shipping Address:", 14, 131);
  doc.text(
    `${customer.address ?? ""}, ${stateCity} - ${pinCode}, India`,
    14,
    137,
  );

  // ===== CALCULATIONS =====
  const items = order.items || [];
  const subtotal = items.reduce((sum: number, item: any) => {
    const basePrice = resolveSellingPrice(item);
    const customPrice =
      item.isCustomized && item.customPrice ? item.customPrice : 0;
    return sum + (basePrice + customPrice) * (item.Quantity || 0);
  }, 0);

  const shipping = order.shippingCharge ?? 0;
  const discount = order.discountAmount ?? order.discount ?? 0;
  const grandTotal = order.total ?? subtotal - discount + shipping;

  const gst = orderGstBreakdown(order);

  // ===== ORDER TABLE =====
  autoTable(doc, {
    startY: 149,
    head: [["Item Name", "Qty", "Price", "Total"]],
    body: items.map((item: any) => {
      const basePrice = resolveSellingPrice(item);
      const customPrice =
        item.isCustomized && item.customPrice ? item.customPrice : 0;
      const itemPrice = basePrice + customPrice;
      const qty = item.Quantity || 0;
      const itemTotal = itemPrice * qty;

      return [
        item.product?.ProductName ?? "Product",
        qty,
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

  const finalY = (doc as any).lastAutoTable?.finalY || 150;

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

  // ===== FOOTER =====
  y += 12;
  doc.text("Thank you for shopping with KRIA.", 14, y);
  y += 6;
  doc.text("Keep supporting India handmade products.", 14, y);
  y += 6;
  doc.text("For support, WhatsApp us at +91 9894414445", 14, y);

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order, orderId, sendTo } = body || {};

    const recipient = sendTo || order?.customer?.email;
    if (!recipient) return NextResponse.json({ error: "No recipient" }, { status: 400 });

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    if (!user || !pass) return NextResponse.json({ error: "Email not configured" }, { status: 500 });

    const transportOptions: any = {
      host: "smtpout.secureserver.net",
      port: 465,
      secure: true,
      auth: { user, pass },
    };

    const transporter = nodemailer.createTransport(transportOptions);

    const data = { ...order, orderId };
    const pdfBuffer = await generatePdfBuffer(data);

    const senderName = process.env.SENDER_NAME || "Kria";

    const items = order?.items || [];
    const subtotal = items.reduce((sum: number, it: any) => {
      const basePrice = resolveSellingPrice(it);
      const customPrice = it.isCustomized && it.customPrice ? it.customPrice : 0;
      return sum + (basePrice + customPrice) * (it.Quantity || 0);
    }, 0);
    const shipping = order.shippingCharge ?? 0;
    const discount = order.discountAmount ?? order.discount ?? 0;
    const grandTotal = order.total ?? subtotal - discount + shipping;
    const gst = orderGstBreakdown(order);

    const plainItems = items
      .map((it: any) => {
        const name = it.product?.ProductName || it.product?.Description || it.product?.Product || "Product";
        const basePrice = resolveSellingPrice(it);
        const customPrice = it.isCustomized && it.customPrice ? it.customPrice : 0;
        const itemPrice = basePrice + customPrice;
        const qty = it.Quantity || 0;
        const lineTotal = itemPrice * qty;
        return `${name} | Qty: ${qty} | Price: Rs. ${itemPrice} | Total: Rs. ${lineTotal}`;
      })
      .join("\n");

    await transporter.sendMail({
      from: `${senderName} <${user}>`,
      to: recipient,
      subject: `Your Kria Order ${orderId || order?.id}`,
      text:
        `Thank you for shopping with Kria.\n\n` +
        `Order: ${orderId || order?.id}\n\n` +
        `Items (Name | Qty | Price | Total):\n${plainItems}\n\n` +
        `Subtotal: Rs. ${subtotal}\n` +
        (discount > 0 ? `Discount: -Rs. ${discount}\n` : "") +
        `Taxable Value: Rs. ${gst.taxableValue}\n` +
        `CGST @ ${gst.cgstRate}%: Rs. ${gst.cgst}\n` +
        `SGST @ ${gst.sgstRate}%: Rs. ${gst.sgst}\n` +
        `Shipping: Rs. ${shipping}${shipping === 0 ? " (Free)" : ` (incl. CGST ${gst.shippingCgst} + SGST ${gst.shippingSgst})`}\n` +
        `Grand Total: Rs. ${grandTotal}\n\n` +
        `Your invoice is attached as a PDF.`,
      html:
        `<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #2D2D2D;">` +
        `<div style="background:#F3EDE4;padding:16px;border-radius:0;border:1px solid #E0D0B8;border-bottom:0;">` +
        `<h2 style="margin:0;color:#2D2D2D;font-family:'Tenor Sans',serif;">Thank you for your order</h2>` +
        `<p style="margin:4px 0 0 0;color:#9A6E50;">Kria</p>` +
        `</div>` +
        `<div style="border:1px solid #E0D0B8;border-top:0;padding:16px;border-radius:0;background:#F9F6F0;">` +
        `<p style="margin-top:0;">Order <strong>#${orderId || order?.id}</strong> has been received.</p>` +
        `<p style="margin-bottom:8px;"><strong>Order summary</strong></p>` +
        `<table style="border-collapse:collapse;width:100%;font-size:13px;background:#ffffff;border:1px solid #E0D0B8;">` +
        `<thead>` +
        `<tr style="background:#F3EDE4;color:#2D2D2D;">` +
        `<th style="padding:8px 6px;text-align:left;border-bottom:1px solid #E0D0B8;">Item</th>` +
        `<th style="padding:8px 6px;text-align:center;border-bottom:1px solid #E0D0B8;">Qty</th>` +
        `<th style="padding:8px 6px;text-align:right;border-bottom:1px solid #E0D0B8;">Price</th>` +
        `<th style="padding:8px 6px;text-align:right;border-bottom:1px solid #E0D0B8;">Total</th>` +
        `</tr>` +
        `</thead>` +
        `<tbody>` +
        `${
          items.length
            ? items
                .map((it: any, index: number) => {
                  const name = it.product?.ProductName || it.product?.Description || it.product?.Product || "Product";
                  const basePrice = resolveSellingPrice(it);
                  const customPrice = it.isCustomized && it.customPrice ? it.customPrice : 0;
                  const itemPrice = basePrice + customPrice;
                  const qty = it.Quantity || 0;
                  const lineTotal = itemPrice * qty;
                  const rowBg = index % 2 === 0 ? "#F9F6F0" : "#ffffff";
                  return (
                    `<tr style="background:${rowBg};">` +
                    `<td style="padding:8px 6px;border-bottom:1px solid #E0D0B8;">${name}</td>` +
                    `<td style="padding:8px 6px;text-align:center;border-bottom:1px solid #E0D0B8;">${qty}</td>` +
                    `<td style="padding:8px 6px;text-align:right;border-bottom:1px solid #E0D0B8;">Rs. ${itemPrice}</td>` +
                    `<td style="padding:8px 6px;text-align:right;border-bottom:1px solid #E0D0B8;">Rs. ${lineTotal}</td>` +
                    `</tr>`
                  );
                })
                .join("")
            : `<tr><td colspan="4" style="padding:8px 6px;text-align:center;color:#9A6E50;">(No items found)</td></tr>`
        }` +
        `</tbody>` +
        `</table>` +
        `<p style="margin-top:12px;">` +
        `Subtotal: <strong>Rs. ${subtotal}</strong><br/>` +
        (discount > 0
          ? `Discount: <strong>-Rs. ${discount}</strong><br/>`
          : "") +
        `Taxable Value: <strong>Rs. ${gst.taxableValue}</strong><br/>` +
        `CGST @ ${gst.cgstRate}%: <strong>Rs. ${gst.cgst}</strong><br/>` +
        `SGST @ ${gst.sgstRate}%: <strong>Rs. ${gst.sgst}</strong><br/>` +
        `Shipping: <strong>Rs. ${shipping}${shipping === 0 ? " (Free)" : ` (incl. CGST ${gst.shippingCgst} + SGST ${gst.shippingSgst})`}</strong><br/>` +
        `Grand Total: <strong>Rs. ${grandTotal}</strong>` +
        `</p>` +
        `<p style="margin-top:12px;">Your invoice PDF is attached to this email.</p>` +
        `<p style="margin-top:12px;font-size:12px;color:#9A6E50;">If you have any questions, just reply to this email.</p>` +
        `</div>` +
        `</div>`,
      attachments: [
        { filename: `KRIA_INVOICE_${orderId || order?.id}.pdf`, content: pdfBuffer },
      ],
    });

    // Send notification to support
    const supportEmail = process.env.SUPPORT_EMAIL || "support@kriastore.in";
    await transporter.sendMail({
      from: `${senderName} <${user}>`,
      to: supportEmail,
      subject: `New Order Received - ${orderId || order?.id}`,
      text:
        `New order placed.\n\n` +
        `Order: ${orderId || order?.id}\n` +
        `Customer: ${order?.customer?.name || ""}\n` +
        `Email: ${recipient}\n` +
        `Phone: ${order?.customer?.phone || ""}\n` +
        `Address: ${order?.customer?.address || ""}, ${order?.customer?.stateCity || ""} ${order?.customer?.pinCode || ""}\n\n` +
        `Items:\n${plainItems}\n\n` +
        `Grand Total: Rs. ${grandTotal}\n`,
      html:
        `<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #2D2D2D;">` +
        `<div style="background:#F3EDE4;padding:16px;border-radius:0;border:1px solid #E0D0B8;border-bottom:0;">` +
        `<h2 style="margin:0;color:#2D2D2D;font-family:'Tenor Sans',serif;">New Order Received</h2>` +
        `<p style="margin:4px 0 0 0;color:#9A6E50;">Order #${orderId || order?.id}</p>` +
        `</div>` +
        `<div style="border:1px solid #E0D0B8;border-top:0;padding:16px;border-radius:0;background:#F9F6F0;">` +
        `<p><strong>Customer:</strong> ${order?.customer?.name || ""}</p>` +
        `<p><strong>Email:</strong> ${recipient}</p>` +
        `<p><strong>Phone:</strong> ${order?.customer?.phone || ""}</p>` +
        `<p><strong>Address:</strong> ${order?.customer?.address || ""}, ${order?.customer?.stateCity || ""} ${order?.customer?.pinCode || ""}</p>` +
        `<h3 style="margin-top:16px;">Order Summary</h3>` +
        `<table style="border-collapse:collapse;width:100%;font-size:13px;background:#ffffff;border:1px solid #E0D0B8;">` +
        `<thead><tr style="background:#F3EDE4;">` +
        `<th style="padding:8px 6px;text-align:left;border-bottom:1px solid #E0D0B8;">Item</th>` +
        `<th style="padding:8px 6px;text-align:center;border-bottom:1px solid #E0D0B8;">Qty</th>` +
        `<th style="padding:8px 6px;text-align:right;border-bottom:1px solid #E0D0B8;">Total</th>` +
        `</tr></thead><tbody>${
          items.length
            ? items.map((it: any, index: number) => {
                const name = it.product?.ProductName || it.product?.Description || it.product?.Product || "Product";
                const basePrice = resolveSellingPrice(it);
                const customPrice = it.isCustomized && it.customPrice ? it.customPrice : 0;
                const itemPrice = basePrice + customPrice;
                const qty = it.Quantity || 0;
                const lineTotal = itemPrice * qty;
                return `<tr style="background:${index % 2 === 0 ? "#F9F6F0" : "#ffffff"};"><td style="padding:8px 6px;border-bottom:1px solid #E0D0B8;">${name}</td><td style="padding:8px 6px;text-align:center;border-bottom:1px solid #E0D0B8;">${qty}</td><td style="padding:8px 6px;text-align:right;border-bottom:1px solid #E0D0B8;">Rs. ${lineTotal}</td></tr>`;
              }).join("")
            : `<tr><td colspan="3" style="padding:8px 6px;text-align:center;">(No items)</td></tr>`
        }</tbody></table>` +
        `<p style="margin-top:12px;"><strong>Grand Total: Rs. ${grandTotal}</strong></p>` +
        `</div></div>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("send-invoice error:", err);
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}
