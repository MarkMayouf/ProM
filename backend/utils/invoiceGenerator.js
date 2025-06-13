import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const companyName = "ProMayoufTech";
const companyAddress = "123 Tech Avenue, Silicon Valley, CA 94000";
const companyContact = "contact@promayouftech.com | +1-555-TECH-BIZ";

function generateInvoicePDF(orderData, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Header
    doc.fontSize(18).font("Helvetica-Bold").text(companyName, { align: "center" });
    doc.fontSize(9).font("Helvetica").text(companyAddress, { align: "center" });
    doc.text(companyContact, { align: "center" });
    doc.moveDown(1.5);
    doc.fontSize(20).font("Helvetica-Bold").text("INVOICE", { align: "center" });
    doc.moveDown(1.5);

    // Invoice Details
    const invoiceDateStr = new Date(orderData.paidAt || orderData.createdAt || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const dueDateStr = "Due upon receipt";
    const invoiceNumber = `INV-${orderData._id.toString().slice(-6)}-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}`;

    doc.fontSize(10).font("Helvetica-Bold");
    doc.text(`Invoice Number: `, { continued: true }).font("Helvetica").text(invoiceNumber);
    doc.font("Helvetica-Bold").text(`Order Number: `, { continued: true }).font("Helvetica").text(orderData._id.toString());
    doc.font("Helvetica-Bold").text(`Invoice Date: `, { continued: true }).font("Helvetica").text(invoiceDateStr);
    doc.font("Helvetica-Bold").text(`Due Date: `, { continued: true }).font("Helvetica").text(dueDateStr);
    doc.moveDown(1.5);

    // Billing and Shipping Addresses
    const customerName = orderData.user?.name || "N/A";
    const customerEmail = orderData.user?.email || "N/A";
    const billAddr = orderData.shippingAddress;
    const shipAddr = orderData.shippingAddress; // Assuming same for this e-commerce context

    const addressX = 50;
    const addressWidth = 250;
    let currentY = doc.y;

    doc.fontSize(11).font("Helvetica-Bold").text("BILL TO:", addressX, currentY);
    doc.font("Helvetica").fontSize(10);
    doc.text(customerName, addressX, currentY + 15);
    doc.text(customerEmail, addressX, currentY + 30);
    doc.text(`${billAddr.address || "N/A"}`, addressX, currentY + 45);
    doc.text(`${billAddr.city || "N/A"}, ${billAddr.postalCode || "N/A"}`, addressX, currentY + 60);
    doc.text(`${billAddr.country || "N/A"}`, addressX, currentY + 75);

    doc.fontSize(11).font("Helvetica-Bold").text("SHIP TO:", addressX + addressWidth + 20, currentY);
    doc.font("Helvetica").fontSize(10);
    doc.text(shipAddr.name || customerName, addressX + addressWidth + 20, currentY + 15); // Use shipping name if available
    doc.text(`${shipAddr.address || "N/A"}`, addressX + addressWidth + 20, currentY + 30);
    doc.text(`${shipAddr.city || "N/A"}, ${shipAddr.postalCode || "N/A"}`, addressX + addressWidth + 20, currentY + 45);
    doc.text(`${shipAddr.country || "N/A"}`, addressX + addressWidth + 20, currentY + 60);
    
    doc.y = Math.max(doc.y, currentY + 90); // Ensure y is past the addresses
    doc.moveDown(2);

    // Items Table
    const tableTop = doc.y;
    const itemCodeX = 50;
    const descriptionX = 80;
    const quantityX = 350;
    const priceX = 400;
    const totalX = 480;

    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("#", itemCodeX, tableTop);
    doc.text("Product Description", descriptionX, tableTop);
    doc.text("Qty", quantityX, tableTop, { width: 40, align: "right" });
    doc.text("Unit Price", priceX, tableTop, { width: 60, align: "right" });
    doc.text("Total", totalX, tableTop, { width: 70, align: "right" });
    doc.moveDown(0.5);
    // Draw header line
    doc.moveTo(itemCodeX - 5, doc.y).lineTo(totalX + 70 + 5, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(9);
    let i = 0;
    for (const item of orderData.orderItems) {
        const y = doc.y;
        const itemNumber = i + 1;
        doc.text(itemNumber.toString(), itemCodeX, y, { width: 20, align: "left"});
        doc.text(item.name, descriptionX, y, { width: 260 });
        doc.text(item.qty.toString(), quantityX, y, { width: 40, align: "right" });
        doc.text(`$${parseFloat(item.price).toFixed(2)}`, priceX, y, { width: 60, align: "right" });
        doc.text(`$${(parseFloat(item.qty) * parseFloat(item.price)).toFixed(2)}`, totalX, y, { width: 70, align: "right" });
        i++;
        doc.moveDown(0.5);
        if (doc.y > 700 && i < orderData.orderItems.length) { // Manual page break if content is too long
            doc.addPage();
            doc.y = 50; // Reset Y for new page
        }
    }
    // Draw footer line for table
    doc.moveTo(itemCodeX - 5, doc.y).lineTo(totalX + 70 + 5, doc.y).stroke();
    doc.moveDown(1.5);

    // Totals Section
    const totalsX = 380;
    const valueX = 480;
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Subtotal:", totalsX, doc.y, { width: 90, align: "right" });
    doc.font("Helvetica").text(`$${parseFloat(orderData.itemsPrice).toFixed(2)}`, valueX, doc.y, { width: 70, align: "right" });
    doc.moveDown(0.5);

    if (orderData.appliedCoupon && orderData.appliedCoupon.discountAmount > 0) {
        doc.font("Helvetica-Bold");
        doc.text(`Discount (${orderData.appliedCoupon.code}):`, totalsX, doc.y, { width: 90, align: "right" });
        doc.font("Helvetica").text(`-$${parseFloat(orderData.appliedCoupon.discountAmount).toFixed(2)}`, valueX, doc.y, { width: 70, align: "right" });
        doc.moveDown(0.5);
    }

    doc.font("Helvetica-Bold");
    doc.text("Shipping:", totalsX, doc.y, { width: 90, align: "right" });
    doc.font("Helvetica").text(`$${parseFloat(orderData.shippingPrice).toFixed(2)}`, valueX, doc.y, { width: 70, align: "right" });
    doc.moveDown(0.5);

    doc.font("Helvetica-Bold");
    doc.text("Tax:", totalsX, doc.y, { width: 90, align: "right" });
    doc.font("Helvetica").text(`$${parseFloat(orderData.taxPrice).toFixed(2)}`, valueX, doc.y, { width: 70, align: "right" });
    doc.moveDown(0.5);

    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("GRAND TOTAL:", totalsX, doc.y, { width: 90, align: "right" });
    doc.text(`$${parseFloat(orderData.totalPrice).toFixed(2)}`, valueX, doc.y, { width: 70, align: "right" });
    doc.moveDown(2);

    // Payment Information
    doc.font("Helvetica-Bold").fontSize(11).text("Payment Information", 50, doc.y);
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(10);
    doc.text(`Payment Method: ${orderData.paymentMethod}`, 50, doc.y);
    doc.text(`Payment Status: ${orderData.isPaid ? "PAID" : "UNPAID"}`, 50, doc.y + 15);
    if (orderData.paymentResult && orderData.paymentResult.id) {
        doc.text(`Transaction ID: ${orderData.paymentResult.id}`, 50, doc.y + 30);
    }
    if (orderData.isPaid && orderData.paidAt) {
        doc.text(`Date Paid: ${new Date(orderData.paidAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 50, doc.y + 45);
    }
    doc.moveDown(2);

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).font("Helvetica-Oblique").text(`Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 40, { align: "center" });
        doc.text("Thank you for your business!", 50, doc.page.height - 30, { align: "center" });
    }

    doc.end();

    writeStream.on("finish", () => {
      resolve(filePath);
    });

    writeStream.on("error", (err) => {
      console.error("Error writing PDF:", err);
      reject(err);
    });
  });
}

export { generateInvoicePDF };

// Example Usage (for testing - remove or comment out in production)
/*
if (process.argv[1].endsWith('invoiceGenerator.js')) { // Check if script is run directly
    const sampleOrder = {
        _id: "60c72b2f9b1e8a001c8e4d8b",
        user: { name: "John Doe", email: "john.doe@example.com" },
        orderItems: [
            { name: "Men's Classic Suit - Navy, 40R", qty: 1, price: 299.99 },
            { name: "Leather Oxford Shoes - Black, Size 10", qty: 1, price: 120.50 },
            { name: "Silk Tie - Red Polka Dot", qty: 2, price: 25.00 }
        ],
        shippingAddress: {
            address: "123 Main St", city: "Anytown", postalCode: "12345", country: "USA", name: "John Doe Receiver"
        },
        paymentMethod: "Stripe",
        paymentResult: { id: "pi_1Jt...", status: "succeeded" },
        itemsPrice: 470.49,
        taxPrice: 38.81,
        shippingPrice: 15.00,
        totalPrice: 524.30,
        isPaid: true,
        paidAt: "2025-05-13T12:30:00.000Z",
        createdAt: "2025-05-13T12:00:00.000Z",
        appliedCoupon: { code: "SUMMER10", discountAmount: 47.05 }
    };
    const testFilePath = path.join(process.cwd(), `invoice_test_${sampleOrder._id}.pdf`);
    generateInvoicePDF(sampleOrder, testFilePath)
        .then(p => console.log(`Test invoice generated: ${p}`))
        .catch(e => console.error("Test invoice generation failed:", e));
}
*/

