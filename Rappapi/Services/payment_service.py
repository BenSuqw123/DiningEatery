from Rappapi.design_patterns.Factory.payment_factory import PaymentFactory
from Rappapi.models import Invoice
class PaymentService:
    @staticmethod
    def process(invoice_detail, method):
        if not Invoice.objects.filter(invoice_id=invoice_detail.invoice_id).is_paid:
            strategy = PaymentFactory.get_strategy(method)
            result = strategy.pay(invoice_detail)
            Invoice.objects.filter(invoice_id=invoice_detail.invoice_id).is_paid = True
        else:
            raise Exception("This invoice has been paid")
        return result
