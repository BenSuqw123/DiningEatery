from Rappapi.firebase import update_firebase_table
from Rappapi.models import TableStatus
from .payments_strategy import PaymentStrategy
from Rappapi.models import PaymentMethod

class MomoPaymentStrategy(PaymentStrategy):
    def pay(self, invoice, table,transaction_id):
        invoice.method = PaymentMethod.MOMO
        invoice.is_paid = True
        invoice.transaction_id = transaction_id
        invoice.save()

        return invoice
