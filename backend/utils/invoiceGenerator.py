from fpdf import FPDF
import datetime

class PDFInvoice(FPDF):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add CJK font if needed, for now using standard fonts
        # self.add_font("NotoSansCJK", fname="/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc")
        # self.set_font("NotoSansCJK", size=10)
        self.company_name = "ProMayoufTech"
        self.company_address = "123 Tech Avenue, Silicon Valley, CA 94000"
        self.company_contact = "contact@promayouftech.com | +1-555-TECH-BIZ"

    def header(self):
        # Logo (Placeholder - if you have a logo image, add it here)
        # self.image("logo.png", 10, 8, 33)
        self.set_font("Arial", "B", 15)
        self.cell(0, 10, self.company_name, 0, 1, "C")
        self.set_font("Arial", "", 9)
        self.cell(0, 5, self.company_address, 0, 1, "C")
        self.cell(0, 5, self.company_contact, 0, 1, "C")
        self.ln(5)
        self.set_font("Arial", "B", 18)
        self.cell(0, 10, "INVOICE", 0, 1, "C")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", 0, 0, "C")
        self.ln(4)
        self.cell(0, 10, "Thank you for your business!", 0, 0, "C")

    def invoice_details(self, invoice_number, order_number, invoice_date, due_date):
        self.set_font("Arial", "B", 10)
        self.cell(40, 7, "Invoice Number:", 0, 0)
        self.set_font("Arial", "", 10)
        self.cell(0, 7, invoice_number, 0, 1)
        
        self.set_font("Arial", "B", 10)
        self.cell(40, 7, "Order Number:", 0, 0)
        self.set_font("Arial", "", 10)
        self.cell(0, 7, order_number, 0, 1)

        self.set_font("Arial", "B", 10)
        self.cell(40, 7, "Invoice Date:", 0, 0)
        self.set_font("Arial", "", 10)
        self.cell(0, 7, invoice_date, 0, 1)

        self.set_font("Arial", "B", 10)
        self.cell(40, 7, "Due Date:", 0, 0)
        self.set_font("Arial", "", 10)
        self.cell(0, 7, due_date, 0, 1)
        self.ln(10)

    def billing_shipping_info(self, billing_address, shipping_address):
        self.set_font("Arial", "B", 11)
        col_width = self.w / 2 - 15 # Adjust for margins
        
        y_before = self.get_y()
        self.multi_cell(col_width, 7, "BILL TO:", 0, "L")
        self.set_font("Arial", "", 10)
        self.multi_cell(col_width, 6, f"{billing_address.get(\'name\', \'N/A\')}\n{billing_address.get(\'email\', \'N/A\')}\n{billing_address.get(\'address\', \'N/A\')}\n{billing_address.get(\'city\', \'N/A\')}, {billing_address.get(\'postalCode\', \'N/A\')}\n{billing_address.get(\'country\', \'N/A\')}", 0, "L")
        y_after_bill = self.get_y()
        
        self.set_xy(col_width + 20, y_before)
        self.set_font("Arial", "B", 11)
        self.multi_cell(col_width, 7, "SHIP TO:", 0, "L")
        self.set_font("Arial", "", 10)
        self.set_xy(col_width + 20, self.get_y())
        self.multi_cell(col_width, 6, f"{shipping_address.get(\'name\', billing_address.get(\'name\', \'N/A\'))}\n{shipping_address.get(\'address\', \'N/A\')}\n{shipping_address.get(\'city\', \'N/A\')}, {shipping_address.get(\'postalCode\', \'N/A\')}\n{shipping_address.get(\'country\', \'N/A\')}", 0, "L")
        y_after_ship = self.get_y()

        self.set_y(max(y_after_bill, y_after_ship) + 5)
        self.ln(5)

    def items_table(self, items):
        self.set_font("Arial", "B", 10)
        self.set_fill_color(200, 220, 255)
        col_widths = [10, 80, 20, 30, 30] # #, Product, Qty, Unit Price, Total
        headers = ["#", "Product Description", "Qty", "Unit Price", "Total"]
        for i, header in enumerate(headers):
            self.cell(col_widths[i], 7, header, 1, 0, "C", 1)
        self.ln()

        self.set_font("Arial", "", 9)
        self.set_fill_color(230, 230, 230)
        fill = False
        item_num = 1
        for item in items:
            self.cell(col_widths[0], 6, str(item_num), "LR", 0, "C", fill)
            self.cell(col_widths[1], 6, item.get("name", "N/A"), "LR", 0, "L", fill)
            self.cell(col_widths[2], 6, str(item.get("qty", 0)), "LR", 0, "C", fill)
            self.cell(col_widths[3], 6, f"${item.get(\'price\', 0):.2f}", "LR", 0, "R", fill)
            self.cell(col_widths[4], 6, f"${item.get(\'qty\', 0) * item.get(\'price\', 0):.2f}", "LR", 0, "R", fill)
            self.ln()
            fill = not fill
            item_num += 1
        self.cell(sum(col_widths), 0, "", "T") # Closing line for table
        self.ln(5)

    def totals_section(self, subtotal, discount_amount, shipping_price, tax_price, total_price, coupon_code=None):
        self.set_font("Arial", "B", 10)
        summary_width = 50
        self.set_x(self.w - summary_width - 20) # Align to right
        self.cell(summary_width, 7, "Subtotal:", 0, 0, "R")
        self.set_font("Arial", "", 10)
        self.cell(20, 7, f"${subtotal:.2f}", 0, 1, "R")

        if discount_amount > 0 and coupon_code:
            self.set_font("Arial", "B", 10)
            self.set_x(self.w - summary_width - 20)
            self.cell(summary_width, 7, f"Discount ({coupon_code}):", 0, 0, "R")
            self.set_font("Arial", "", 10)
            self.cell(20, 7, f"-${discount_amount:.2f}", 0, 1, "R")

        self.set_font("Arial", "B", 10)
        self.set_x(self.w - summary_width - 20)
        self.cell(summary_width, 7, "Shipping:", 0, 0, "R")
        self.set_font("Arial", "", 10)
        self.cell(20, 7, f"${shipping_price:.2f}", 0, 1, "R")

        self.set_font("Arial", "B", 10)
        self.set_x(self.w - summary_width - 20)
        self.cell(summary_width, 7, "Tax:", 0, 0, "R")
        self.set_font("Arial", "", 10)
        self.cell(20, 7, f"${tax_price:.2f}", 0, 1, "R")

        self.set_font("Arial", "B", 12)
        self.set_x(self.w - summary_width - 20)
        self.cell(summary_width, 8, "GRAND TOTAL:", 1, 0, "R")
        self.cell(20, 8, f"${total_price:.2f}", 1, 1, "R")
        self.ln(10)

    def payment_info(self, payment_method, payment_status, transaction_id=None, date_paid=None):
        self.set_font("Arial", "B", 11)
        self.cell(0, 7, "Payment Information", 0, 1, "L")
        self.set_font("Arial", "", 10)
        self.cell(40, 6, "Payment Method:", 0, 0)
        self.cell(0, 6, payment_method, 0, 1)
        self.cell(40, 6, "Payment Status:", 0, 0)
        self.cell(0, 6, payment_status, 0, 1)
        if transaction_id:
            self.cell(40, 6, "Transaction ID:", 0, 0)
            self.cell(0, 6, transaction_id, 0, 1)
        if date_paid:
            self.cell(40, 6, "Date Paid:", 0, 0)
            self.cell(0, 6, date_paid, 0, 1)
        self.ln(5)

def generate_invoice_pdf(order_data, file_path):
    pdf = PDFInvoice()
    pdf.alias_nb_pages()
    pdf.add_page()

    invoice_date_str = datetime.datetime.strptime(order_data.get("paidAt", order_data.get("createdAt", datetime.datetime.now().isoformat()))[:10], "%Y-%m-%d").strftime("%B %d, %Y")
    due_date_str = "Due upon receipt"
    invoice_number = f"INV-{order_data.get(\'_id\', \'N/A\')[-6:]}-{datetime.datetime.now().strftime(\'%Y%m%d\')}"

    pdf.invoice_details(invoice_number, order_data.get("_id", "N/A"), invoice_date_str, due_date_str)

    billing_address = {
        "name": order_data.get("user", {}).get("name", "N/A"),
        "email": order_data.get("user", {}).get("email", "N/A"),
        "address": order_data.get("shippingAddress", {}).get("address", "N/A"),
        "city": order_data.get("shippingAddress", {}).get("city", "N/A"),
        "postalCode": order_data.get("shippingAddress", {}).get("postalCode", "N/A"),
        "country": order_data.get("shippingAddress", {}).get("country", "N/A"),
    }
    shipping_address = order_data.get("shippingAddress", {})
    # If shipping name is not explicitly set, use billing name
    if not shipping_address.get("name") and billing_address.get("name"):
        shipping_address["name"] = billing_address.get("name")
        
    pdf.billing_shipping_info(billing_address, shipping_address)

    pdf.items_table(order_data.get("orderItems", []))

    applied_coupon = order_data.get("appliedCoupon") # Assuming this structure if coupon is applied
    discount_amount = 0
    coupon_code_display = None
    if applied_coupon and applied_coupon.get("discountAmount", 0) > 0:
        discount_amount = applied_coupon.get("discountAmount", 0)
        coupon_code_display = applied_coupon.get("code", "N/A")

    pdf.totals_section(
        order_data.get("itemsPrice", 0),
        discount_amount,
        order_data.get("shippingPrice", 0),
        order_data.get("taxPrice", 0),
        order_data.get("totalPrice", 0),
        coupon_code_display
    )

    payment_result = order_data.get("paymentResult", {})
    pdf.payment_info(
        order_data.get("paymentMethod", "N/A"),
        "PAID" if order_data.get("isPaid") else "UNPAID",
        payment_result.get("id"),
        datetime.datetime.strptime(order_data.get("paidAt", datetime.datetime.now().isoformat())[:10], "%Y-%m-%d").strftime("%B %d, %Y") if order_data.get("isPaid") else None
    )
    
    pdf.output(file_path, "F")

if __name__ == "__main__":
    # This is a sample order_data structure. In a real scenario, this would come from your database.
    sample_order = {
        "_id": "60c72b2f9b1e8a001c8e4d8b",
        "user": {"name": "John Doe", "email": "john.doe@example.com"},
        "orderItems": [
            {"name": "Men\s Classic Suit - Navy, 40R", "qty": 1, "price": 299.99},
            {"name": "Leather Oxford Shoes - Black, Size 10", "qty": 1, "price": 120.50},
            {"name": "Silk Tie - Red Polka Dot", "qty": 2, "price": 25.00}
        ],
        "shippingAddress": {
            "address": "123 Main St", "city": "Anytown", "postalCode": "12345", "country": "USA"
        },
        "paymentMethod": "Stripe",
        "paymentResult": {"id": "pi_1Jt...", "status": "succeeded"},
        "itemsPrice": 470.49,
        "taxPrice": 38.81,
        "shippingPrice": 15.00,
        "totalPrice": 524.30,
        "isPaid": True,
        "paidAt": "2025-05-13T12:30:00.000Z",
        "createdAt": "2025-05-13T12:00:00.000Z",
        "appliedCoupon": {"code": "SUMMER10", "discountAmount": 47.05} # Example
    }
    output_filename = f"/home/ubuntu/invoice_{sample_order['_id']}.pdf"
    generate_invoice_pdf(sample_order, output_filename)
    print(f"Invoice generated: {output_filename}")

