from Rappapi.design_patterns.Strategy.cash_strategy import CashPaymentStrategy
from Rappapi.design_patterns.Strategy.paypal_strategy import PaypalPaymentStrategy
from Rappapi.design_patterns.Strategy.momo_strategy import MomoPaymentStrategy
from Rappapi.design_patterns.Strategy.zalopay_strategy import ZaloPaymentStrategy
from Rappapi.design_patterns.Strategy.stripe_strategy import StripePaymentStrategy


class PaymentFactory:
    @staticmethod
    def get_strategy(method):
        if method == "CASH":
            return CashPaymentStrategy()
        elif method == "MOMO":
            return MomoPaymentStrategy()
        elif method == "ZALOPAY":
            return ZaloPaymentStrategy()
        elif method == "STRIPE":
            return StripePaymentStrategy()
        elif method == "PAYPAL":
            return PaypalPaymentStrategy()
        else:
            raise Exception('Invalid payment method')
