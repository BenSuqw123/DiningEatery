from .payments_strategy import PaymentStrategy
from ...models import PaymentMethod, InvoiceDetail


class PaypalPaymentStrategy(PaymentStrategy):
    def pay(self, invoice_detail):
        payment = InvoiceDetail(invoice_id=invoice_detail.invoice_id, dish=invoice_detail.dish,
                                quantity=invoice_detail.quantity, method=PaymentMethod.PAYPAL, status=True)
        return payment