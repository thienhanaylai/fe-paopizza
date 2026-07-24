import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatVND } from "./formatVND";

export interface InvoiceItem {
  name: string;
  size?: string;
  crust?: string;
  quantity: number;
  price: number;
  note?: string;
  isCombo?: boolean;
  comboSelections?: { name: string; size: string; crust?: string }[];
}

export interface InvoiceData {
  orderId: string;
  orderType: "dine_in" | "carry_out" | "delivery";
  tableNumber?: string;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  deliveryFee: number;
  discountAmount?: number;
  promotionCode?: string;
  total: number;
  cashReceived?: number;
  change?: number;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  employeeName?: string;
  note?: string;
}

function buildInvoiceHTML(data: InvoiceData): string {
  const now = new Date();
  const dateStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")} ${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`;

  const orderTypeLabel = data.orderType === "dine_in" ? "Tại chỗ" : data.orderType === "carry_out" ? "Mang đi" : "Giao hàng";

  const itemsHTML = data.items
    .map(item => {
      const comboBadge = item.isCombo
        ? '<span style="background:#f97316;color:#fff;font-size:9px;padding:1px 4px;border-radius:3px;margin-left:2px;">COMBO</span>'
        : "";

      const selectionsHTML =
        item.comboSelections && item.comboSelections.length > 0
          ? item.comboSelections
              .map(
                sel =>
                  `<div style="color:#888;font-size:10px;padding-left:8px;">+ ${sel.name} - ${sel.size}${sel.crust ? ` (${sel.crust})` : ""}</div>`,
              )
              .join("")
          : "";

      const noteHTML = item.note ? `<div style="color:#888;font-size:10px;padding-left:8px;">Ghi chú: ${item.note}</div>` : "";

      const itemName = `${item.name}${item.size ? ` - ${item.size}` : ""}${item.crust ? ` (${item.crust})` : ""}`;

      return `
        <div style="padding:3px 0;border-bottom:1px dotted #ddd;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div style="flex:1;font-size:11px;">
              ${itemName}${comboBadge}
              ${selectionsHTML}
              ${noteHTML}
            </div>
            <div style="text-align:right;font-size:11px;white-space:nowrap;margin-left:8px;">
              <span style="color:#666;">x${item.quantity}</span>
              <span style="margin-left:6px;">${formatVND(item.price * item.quantity)}</span>
            </div>
          </div>
          <div style="font-size:9px;color:#999;">${formatVND(item.price)} / món</div>
        </div>
      `;
    })
    .join("");

  const storeInfoHTML = data.storeName ? `<div style="font-size:10px;text-align:center;">${data.storeName}</div>` : "";
  const storeAddrHTML = data.storeAddress
    ? `<div style="font-size:9px;text-align:center;color:#555;">${data.storeAddress}</div>`
    : "";
  const storePhoneHTML = data.storePhone
    ? `<div style="font-size:9px;text-align:center;color:#555;">ĐT: ${data.storePhone}</div>`
    : "";

  const tableHTML = data.tableNumber
    ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Bàn:</span><span>${data.tableNumber}</span></div>`
    : "";

  const customerHTML = data.customerName
    ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Khách hàng:</span><span>${data.customerName}</span></div>`
    : "";
  const phoneHTML = data.customerPhone
    ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>ĐT:</span><span>${data.customerPhone}</span></div>`
    : "";
  const addressHTML =
    data.orderType === "delivery" && data.customerAddress
      ? `<div style="font-size:11px;"><span>Địa chỉ:</span> ${data.customerAddress}</div>`
      : "";
  const employeeHTML = data.employeeName
    ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Nhân viên:</span><span>${data.employeeName}</span></div>`
    : "";

  const deliveryFeeHTML =
    data.deliveryFee > 0
      ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Phí giao hàng:</span><span>${formatVND(data.deliveryFee)}</span></div>`
      : data.orderType === "delivery"
        ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Phí giao hàng:</span><span style="color:#16a34a;">Miễn phí</span></div>`
        : "";

  const discountHTML =
    data.discountAmount && data.discountAmount > 0
      ? `<div style="display:flex;justify-content:space-between;font-size:11px;color:#dc2626;"><span>Giảm giá${data.promotionCode ? ` (${data.promotionCode})` : ""}:</span><span>-${formatVND(data.discountAmount)}</span></div>`
      : "";

  const cashHTML =
    data.cashReceived && data.cashReceived > 0
      ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Tiền khách đưa:</span><span>${formatVND(data.cashReceived)}</span></div>`
      : "";
  const changeHTML =
    data.change !== undefined && data.change > 0
      ? `<div style="display:flex;justify-content:space-between;font-size:11px;color:#16a34a;"><span>Tiền thừa:</span><span>${formatVND(data.change)}</span></div>`
      : "";
  const noteOrderHTML = data.note
    ? `<div style="font-size:10px;color:#888;text-align:center;margin-top:4px;">Ghi chú: ${data.note}</div>`
    : "";

  return `
    <div style="width:300px;font-family:Arial,Helvetica,sans-serif;background:#fff;color:#000;padding:12px;">
      <!-- Header -->
      <div style="text-align:center;margin-bottom:8px;">
        <div style="font-size:20px;font-weight:bold;letter-spacing:2px;">PAOPIZZA</div>
        <div style="font-size:10px;color:#f97316;">Pizza &amp; More</div>
        ${storeInfoHTML}
        ${storeAddrHTML}
        ${storePhoneHTML}
      </div>

      <div style="border-top:1px dashed #000;margin:6px 0;"></div>

      <!-- Order Info -->
      <div style="margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:bold;">
          <span>Số đơn: ${data.orderId}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span>Loại đơn:</span><span>${orderTypeLabel}</span>
        </div>
        ${tableHTML}
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span>Ngày:</span><span>${dateStr}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span>Thanh toán:</span><span>${data.paymentMethod}</span>
        </div>
        ${customerHTML}
        ${phoneHTML}
        ${addressHTML}
        ${employeeHTML}
      </div>

      ${noteOrderHTML}

      <div style="border-top:1px dashed #000;margin:6px 0;"></div>

      <!-- Items -->
      <div style="margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:bold;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:4px;">
          <span>Món</span><span>Thành tiền</span>
        </div>
        ${itemsHTML}
      </div>

      <div style="border-top:1px dashed #000;margin:6px 0;"></div>

      <!-- Totals -->
      <div style="margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span>Tạm tính:</span><span>${formatVND(data.subtotal)}</span>
        </div>
        ${deliveryFeeHTML}
        ${discountHTML}
        <div style="border-top:1px solid #000;margin:4px 0;padding-top:4px;display:flex;justify-content:space-between;font-size:14px;font-weight:bold;">
          <span>TỔNG CỘNG:</span><span>${formatVND(data.total)}</span>
        </div>
        ${cashHTML}
        ${changeHTML}
      </div>

      <div style="border-top:1px dashed #000;margin:6px 0;"></div>

      <!-- Footer -->
      <div style="text-align:center;font-size:11px;">
        <div style="font-weight:bold;margin-bottom:2px;">Cảm ơn quý khách!</div>
        <div style="margin-bottom:4px;">Hẹn gặp lại!</div>
        <div style="font-size:9px;color:#888;">PaoPizza - Pizza &amp; More</div>
        <div style="font-size:9px;color:#888;">Hotline: 1900 1234</div>
      </div>
    </div>
  `;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<void> {
  // Create a temporary container
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.innerHTML = buildInvoiceHTML(data);
  document.body.appendChild(container);

  try {
    const invoiceElement = container.firstElementChild as HTMLElement;
    if (!invoiceElement) throw new Error("Invoice element not found");

    // Capture the invoice HTML as canvas
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // Calculate PDF dimensions
    const imgWidth = 80; // 80mm receipt width
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageHeight = 297; // A4 height in mm
    let heightLeft = imgHeight;
    let position = 0;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [imgWidth, Math.min(imgHeight + 5, pageHeight)],
    });

    const imgData = canvas.toDataURL("image/png");

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage([imgWidth, pageHeight]);
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    const filename = `PaoPizza_Invoice_${data.orderId}.pdf`;
    pdf.save(filename);
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}
