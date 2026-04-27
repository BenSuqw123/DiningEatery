from .payments_strategy import PaymentStrategy
from ...models import PaymentMethod, Payment

class ZaloPaymentStrategy(PaymentStrategy):
    def pay(self, amount, invoice_id):
        payment = Payment(invoice_id=invoice_id, amount=amount, method=PaymentMethod.STRIPE)
        return payment