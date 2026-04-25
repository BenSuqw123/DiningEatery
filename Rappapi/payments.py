#Sử dụng strategy pattern cho thanh toán
from abc import ABC, abstractmethod
from Rappapi.models import Dish  #Payment


class PaymentStrategy(ABC):
    @abstractmethod
    def process_payment(self, dish, total):
        pass


class CashPaymentStrategy(PaymentStrategy):
    def process_payment(self, dish, total):
        pass

class MoMoPaymentStrategy(PaymentStrategy):
    def process_payment(self, dish, total):
        pass

class VNPayPaymentStrategy(PaymentStrategy):
    def process_payment(self, dish, total):
        pass

# class PayPalPaymentStrategy(PaymentStrategy):
#     def process_payment(self, dish, amount):
#         pass


class PaymentFactory:
    @staticmethod
    def get_payment_strategy(payment_method):
        strategies = {
            'CASH': CashPaymentStrategy(),
            'MOMO': MoMoPaymentStrategy(),
            # 'ZALOPAY': ZaloPayPaymentStrategy(),
            # 'PAYPAL': PayPalPaymentStrategy(),
        }
        strategy = strategies.get(payment_method)
        if not strategy:
            raise ValueError(f"Phương thức thanh toán {payment_method} chưa được hỗ trợ.")
        return strategy