from .payments_strategy import PaymentStrategy
from Rappapi.models import InvoiceDetail,PaymentMethod

class CashPaymentStrategy(PaymentStrategy):
    def pay(self, invoice_detail):
        payment = InvoiceDetail(invoice_id = invoice_detail.invoice_id, dish = invoice_detail.dish,
                                quantity = invoice_detail.quantity, method = PaymentMethod.CASH, status = True )
        return payment

