from Rappapi.design_patterns.Strategy.cash_strategy import CashPaymentStrategy
from Rappapi.design_patterns.Strategy.paypal_strategy import PaypalPaymentStrategy
from Rappapi.design_patterns.Strategy.momo_strategy import MomoPaymentStrategy
from Rappapi.design_patterns.Strategy.zalopay_strategy import ZaloPaymentStrategy
from Rappapi.design_patterns.Strategy.stripe_strategy import StripePaymentStrategy
from Rappapi.models import PaymentMethod

class PaymentFactory:
    @staticmethod
    def get_strategy(method):
        if method == PaymentMethod.CASH:
            return CashPaymentStrategy()
        elif method == PaymentMethod.MOMO:
            return MomoPaymentStrategy()
        elif method == PaymentMethod.ZALOPAY:
            return ZaloPaymentStrategy()
        elif method == PaymentMethod.STRIPE:
            return StripePaymentStrategy()
        elif method == PaymentMethod.PAYPAL:
            return PaypalPaymentStrategy()
        else:
            raise Exception('Invalid payment method')
