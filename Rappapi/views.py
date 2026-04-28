from django.db import transaction
from rest_framework import viewsets, generics, filters, status, parsers, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from Rappapi.models import (
    User, Dish, Ingredient, Rate, Category, Table,
    TableStatus, PaymentMethod, Invoice, InvoiceDetail, Chef, Customer, Admin
)
from Rappapi import serializers, paginators
from .firebase import update_firebase_table, get_firebase_table
from .serializers import InvoiceDetailSerializer, InvoiceSerializer
from .design_patterns.Factory.payment_factory import PaymentFactory

class DishViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Dish.objects.filter(active=True).prefetch_related('chefs', 'dish_ingredients__ingredient')
    serializer_class = serializers.DishSerializer
    pagination_class = paginators.DishPaginator

    def get_queryset(self):
        query = self.queryset

        q = self.request.query_params.get('q')
        if q:
            query = query.filter(name__icontains=q)

        dish_id = self.request.query_params.get('dish_id')
        if dish_id:
            query = query.filter(id__icontains=dish_id)

        chef_name = self.request.query_params.get('chef_name')
        if chef_name:
            q_first = query.filter(chefs__first_name__icontains=chef_name)
            q_last = query.filter(chefs__last_name__icontains=chef_name)
            query = (q_first | q_last).distinct()

        ingredient_name = self.request.query_params.get('ingre_name')
        if ingredient_name:
            query = query.filter(ingredient__name__icontains=ingredient_name)

        cate_id = self.request.query_params.get('category_id')
        if cate_id:
            query = query.filter(category_id=cate_id)

        time_served = self.request.query_params.get('time_served')
        if time_served:
            query = query.filter(time_served__lte=time_served)

        price = self.request.query_params.get('price')
        if price:
            query = query.filter(price__lte=price)

        return query

    @action(methods=['get'], url_path='chef', detail=True)
    def get_chef(self, request, pk=None):
        chef = self.get_object().chefs.filter(is_active=True)
        return Response(serializers.ChefSerializer(chef, many=True).data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='ingredient', detail=True)
    def get_ingredient(self, request, pk=None):
        ingredient = self.get_object().ingredients.filter(is_active=True)
        return Response(serializers.IngredientSerializer(ingredient, many=True).data, status=status.HTTP_200_OK)

    def get_permissions(self):
        if self.action in ['rating'] and self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    @action(methods=['post', 'get'], url_path='rates', detail=True)
    def rating(self, request, pk):
        if request.method == 'POST':
            # Bảo vệ API: Chỉ cho phép người có Customer Profile đánh giá
            if not hasattr(request.user, 'customer'):
                return Response({"error": "Chỉ khách hàng mới được phép đánh giá."}, status=status.HTTP_403_FORBIDDEN)

            s = serializers.RateSerializer(data={
                'comment': request.data.get('comment'),
                'rating': request.data.get('rating'),
                'customer': request.user.pk,
                'dish': pk
            })

            s.is_valid(raise_exception=True)
            r = s.save()
            return Response(serializers.RateSerializer(r).data, status=status.HTTP_201_CREATED)

        rates = Rate.objects.select_related('customer').filter(active=True, dish_id=pk).order_by('-id')
        p = paginators.RatePaginator()
        page = p.paginate_queryset(rates, request)
        if page is not None:
            serializer = serializers.RateSerializer(page, many=True)
            return p.get_paginated_response(serializer.data)

        return Response(serializers.RateSerializer(rates, many=True).data, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser]
    pagination_class = paginators.ItemPaginator

    @action(methods=['get', 'patch'], url_path='current-user', detail=False,
            permission_classes=[permissions.IsAuthenticated])
    def current_user(self, request):
        u = request.user
        if request.method == 'PATCH':
            s = serializers.SimpleUserSerializer(u, data=request.data, partial=True)
            s.is_valid(raise_exception=True)
            u = s.save()

        return Response(serializers.UserSerializer(u).data, status=status.HTTP_200_OK)


class ChefViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = User.objects.filter(chef__isnull=False, chef__is_accepted=True, is_active=True)
    serializer_class = serializers.ChefSerializer

    def get_queryset(self):
        query = self.queryset.all()
        q = self.request.query_params.get('q')
        if q:
            q_first = query.filter(first_name__icontains=q)
            q_last = query.filter(last_name__icontains=q)
            query = (q_first | q_last).distinct()

        return query


class IngredientViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Ingredient.objects.filter(active=True)
    serializer_class = serializers.IngredientSerializer

    def get_queryset(self):
        query = self.queryset
        q = self.request.query_params.get('q')
        if q:
            query = query.filter(name__contains=q)
        return query


class CategoryViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = serializers.CategorySerializer


class TableViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Table.objects.filter(active=True)
    serializer_class = serializers.TableSerializer

    @action(detail=True, methods=['post'], url_path='checkin', permission_classes=[permissions.IsAuthenticated])
    def check_in(self, request, pk=None):
        if not hasattr(request.user, 'customer'):
            return Response({"error": "Chỉ khách hàng mới được check-in."}, status=status.HTTP_403_FORBIDDEN)

        table = Table.objects.filter(pk=pk, active=True).first()
        if not table:
            return Response({"error": "Không tìm thấy bàn"}, status=status.HTTP_404_NOT_FOUND)

        if table.status != TableStatus.AVAILABLE:
            return Response({"error": "Bàn này không trống."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            table.get_state().customer_checkin(table)
            Invoice.objects.create(customer=request.user,table=table,total_amount=0,is_paid=False,transaction_id=None)
            update_firebase_table(table_id=table.code, status=TableStatus.BOOKED, total_price=0)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": f"Check-in bàn {table.code} thành công!"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='order', permission_classes=[permissions.IsAuthenticated])
    def order_dish(self, request, pk=None):
        dish_id = request.data.get('dish_id')
        table = Table.objects.filter(pk=pk, active=True).first()
        if not table:
            return Response({"error": "Không tìm thấy bàn"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = int(request.data.get('quantity', 1))
            if quantity < 1:
                raise ValueError
        except (ValueError, TypeError):
            return Response({"error": "Số lượng không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)

        if table.status not in [TableStatus.BOOKED, TableStatus.OCCUPIED]:
            return Response({"error": "Bàn chưa có khách check-in."}, status=status.HTTP_400_BAD_REQUEST)

        dish = Dish.objects.filter(pk=dish_id).first()
        if not dish:
            return Response({"error": "Không tìm thấy món"}, status=status.HTTP_404_NOT_FOUND)

        invoice = Invoice.objects.filter(table=table, is_paid=False).first()
        if not invoice:
            return Response({"error": "Không tìm thấy hóa đơn hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            detail, created = InvoiceDetail.objects.get_or_create(invoice=invoice,dish=dish,defaults={'quantity': 0})
            detail.quantity += quantity
            detail.save()
            new_cost = dish.price * quantity
            invoice.total_amount += new_cost
            invoice.save()
            table.get_state().customer_order(table, float(invoice.total_amount))

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "message": f"Đã cập nhật {dish.name} (Tổng số lượng: {detail.quantity})",
            "added_cost": new_cost,
            "total_amount_now": invoice.total_amount
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='checkout', permission_classes=[permissions.IsAuthenticated])
    def checkout(self, request, pk=None):
        table = Table.objects.filter(pk=pk, active=True).first()
        if not table:
            return Response({"error": "Không tìm thấy bàn"}, status=status.HTTP_404_NOT_FOUND)

        method = request.data.get('method')
        if not method:
            return Response({"error":"Vui lòng chọn phương thức thanh toán"}, status=status.HTTP_400_BAD_REQUEST)

        transaction_id = request.data.get('transaction')
        invoice = Invoice.objects.filter(table=table, is_paid=False).first()
        if not invoice:
            return Response({"error": "Không có hóa đơn"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = PaymentFactory.get_strategy(method=method)
            if method != "CASH":
                if not transaction_id:
                    return Response({"error": "Vui lòng cung cấp mã giao dịch"}, status=status.HTTP_400_BAD_REQUEST)
                if Invoice.objects.filter(transaction_id=str(transaction_id)).exists():
                    return Response({"error": "Mã giao dịch đã tồn tại"}, status=status.HTTP_400_BAD_REQUEST)
                invoice  = payment.pay(invoice,table,transaction_id)
                table.get_state().customer_checkout(table)
            else:
                invoice = payment.pay(invoice,table)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializers.InvoiceSerializer(invoice).data,status=status.HTTP_200_OK)


class InvoiceViewSet(viewsets.ViewSet, generics.ListAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = paginators.DishPaginator

    def get_queryset(self):
        query = Invoice.objects.filter(customer=self.request.user).prefetch_related('details__dish')

        q = self.request.query_params.get('q')
        if q:
            query = query.filter(id=q)

        return query