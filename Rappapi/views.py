import secrets
from datetime import timedelta

from django.db.models import Sum, F
from django.http import HttpResponse
from django.utils import timezone
from django.db import transaction as db_transaction
from oauth2_provider.models import Application, AccessToken, RefreshToken
from oauth2_provider.settings import oauth2_settings
from rest_framework import viewsets, generics, filters, status, parsers, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
import json
from Rappapi.models import User, Dish, Ingredient, Rate, Category, Table, TableBook, TableStatus, Invoice, InvoiceDetail, Chef, Customer, Admin, IngredientDish
from Rappapi import serializers, paginators
from .design_patterns.Decorator.dish_query_decor import SearchDecorator, CategoryDecorator, ChefNameDecorator, MaxPriceDecorator, MaxTimeDecorator, OrderByNameDecorator, OrderByPriceDecorator, OrderByRatingDecorator, IngredientDecorator
from .firebase import update_firebase_table, get_or_create_chat_room, send_chat_message, get_chat_messages, get_chef_rooms
from .serializers import InvoiceDetailSerializer, InvoiceSerializer
from .design_patterns.Factory.payment_factory import PaymentFactory
from .design_patterns.Builder.dish_builder import DishBuilder


class DishViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.RetrieveAPIView):
    queryset = Dish.objects.filter(active=True).prefetch_related('chefs', 'dish_ingredients__ingredient')
    serializer_class = serializers.DishSerializer
    pagination_class = paginators.DishPaginator

    def get_queryset(self):
        query = self.queryset
        p = self.request.query_params

        # filter
        query = SearchDecorator(query, p.get('q')).apply()
        query = CategoryDecorator(query, p.get('category_id')).apply()
        query = ChefNameDecorator(query, p.get('chef_name')).apply()
        query = MaxPriceDecorator(query, p.get('price')).apply()
        query = MaxTimeDecorator(query, p.get('time_served')).apply()
        query = IngredientDecorator(query, p.get('ingre_name')).apply()

        ordering = p.get('ordering')
        ordering_map = {
            'name': OrderByNameDecorator(query),
            '-name': OrderByNameDecorator(query, desc=True),
            'price': OrderByPriceDecorator(query),
            '-price': OrderByPriceDecorator(query, desc=True),
            'rating': OrderByRatingDecorator(query),
            '-rating': OrderByRatingDecorator(query, desc=True),
        }
        if ordering in ordering_map:
            query = ordering_map[ordering].apply()

        return query

    def create(self, request, *args, **kwargs):
        request.parsers = [parsers.MultiPartParser()]
        if not hasattr(request.user, 'chef') or not request.user.chef.is_accepted:
            return Response({"error": "Chỉ đầu bếp đã được duyệt mới được tạo món ăn."}, status=status.HTTP_403_FORBIDDEN)
        try:
            ingredients = json.loads(request.data.get('ingredients', '[]'))
            chef_ids = json.loads(request.data.get('chef_ids', '[]'))
            chefs = User.objects.filter(pk__in=chef_ids, chef__is_accepted=True)
            chef_list = list(chefs)
            if request.user not in chef_list:
                chef_list.append(request.user)

            dish = (DishBuilder( name=request.data.get('name'), description=request.data.get('description'), price=request.data.get('price'), image=request.FILES.get('image'), time_served=request.data.get('time_served'), category_id=request.data.get('category_id'))
                .set_chefs(chef_list)
                .set_ingredients(ingredients)
                .build())
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializers.DishSerializer(dish).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='update', permission_classes=[permissions.IsAuthenticated])
    def update_dish(self, request, pk=None):
        if not hasattr(request.user, 'chef') or not request.user.chef.is_accepted:
            return Response({"error": "Không có quyền."}, status=status.HTTP_403_FORBIDDEN)

        dish = Dish.objects.filter(pk=pk, active=True).first()
        if not dish:
            return Response({"error": "Không tìm thấy món."}, status=status.HTTP_404_NOT_FOUND)

        for field in ['name', 'description', 'price', 'time_served', 'category_id']:
            if field in request.data:
                setattr(dish, field, request.data[field])

        if request.FILES.get('image'):
            dish.image = request.FILES.get('image')

        if 'ingredients' in request.data:
            ingredients = json.loads(request.data.get('ingredients', '[]'))
            dish.dish_ingredients.all().delete()
            for item in ingredients:
                ingredient = Ingredient.objects.filter(name__iexact=item['name']).first()
                if not ingredient:
                    ingredient = Ingredient.objects.create(name=item['name'])
                IngredientDish.objects.create(dish=dish, ingredient=ingredient, quantity=item.get('quantity', ''))

        if 'chef_ids' in request.data:
            chef_ids = json.loads(request.data.get('chef_ids', '[]'))
            chefs = list(User.objects.filter(pk__in=chef_ids, chef__is_accepted=True))
            if request.user not in chefs:
                chefs.append(request.user)
            dish.chefs.set(chefs)

        dish.save()
        return Response(serializers.DishSerializer(dish).data, status=status.HTTP_200_OK)

    def get_permissions(self):
        if self.action in ['rating', 'create'] and self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    @action(methods=['get'], url_path='chef', detail=True)
    def get_chef(self, request, pk=None):
        chefs = self.get_object().chefs.filter(is_active=True)
        return Response(serializers.ChefSerializer(chefs, many=True).data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='ingredient', detail=True)
    def get_ingredient(self, request, pk=None):
        ingredients = self.get_object().ingredients.filter(is_active=True)
        return Response(serializers.IngredientSerializer(ingredients, many=True).data, status=status.HTTP_200_OK)

    @action(methods=['post', 'get'], url_path='rates', detail=True)
    def rating(self, request, pk):
        if request.method == 'POST':
            if not hasattr(request.user, 'customer'):
                return Response({"error": "Chỉ khách hàng mới được phép đánh giá."}, status=status.HTTP_403_FORBIDDEN)

            s = serializers.RateSerializer(data={
                'comment': request.data.get('comment'),
                'rating': request.data.get('rating'),
                'customer': request.user.pk,
                'dish': pk,
            })
            s.is_valid(raise_exception=True)
            r = s.save()
            return Response(serializers.RateSerializer(r).data, status=status.HTTP_201_CREATED)

        rates = Rate.objects.select_related('customer').filter(active=True, dish_id=pk).order_by('-id')
        p = paginators.RatePaginator()
        page = p.paginate_queryset(rates, request)
        if page is not None:
            return p.get_paginated_response(serializers.RateSerializer(page, many=True).data)
        return Response(serializers.RateSerializer(rates, many=True).data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='compare', detail=False)
    def compare(self, request):
        ids = request.query_params.get('ids', '')
        id_list = [i for i in ids.split(',') if i.strip().isdigit()]

        if len(id_list) < 2:
            return Response({"error": "Cần ít nhất 2 món để so sánh"}, status=status.HTTP_400_BAD_REQUEST)

        dishes = Dish.objects.filter(id__in=id_list, active=True).prefetch_related('dish_ingredients__ingredient', 'ratings')
        return Response(serializers.DishCompareSerializer(dishes, many=True).data, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser]

    @action(methods=['get', 'patch'], url_path='current-user', detail=False, permission_classes=[permissions.IsAuthenticated])
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
            query = (
                    query.filter(first_name__icontains=q) | query.filter(last_name__icontains=q)
            ).distinct()
        return query

    @action(detail=False, methods=['get'], url_path='pending',
            permission_classes=[permissions.IsAuthenticated])
    def pending(self, request):
        if not hasattr(request.user, 'admin'):
            return Response({"error": "Chỉ admin mới được xem."}, status=status.HTTP_403_FORBIDDEN)
        chefs = User.objects.filter(chef__isnull=False, chef__is_accepted=False, is_active=True)
        return Response(serializers.ChefSerializer(chefs, many=True).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='approve',
            permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        if not hasattr(request.user, 'admin'):
            return Response({"error": "Chỉ admin mới được duyệt chef."}, status=status.HTTP_403_FORBIDDEN)

        chef_user = User.objects.filter(pk=pk, chef__isnull=False).first()
        if not chef_user:
            return Response({"error": "Không tìm thấy chef."}, status=status.HTTP_404_NOT_FOUND)

        chef = chef_user.chef
        chef.is_accepted = True
        chef.accepted_by = request.user.admin
        chef.save()
        return Response(serializers.ChefSerializer(chef_user).data, status=status.HTTP_200_OK)


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


class ChatViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='room')
    def get_or_create_room(self, request):
        user = request.user

        if hasattr(user, 'customer'):
            customer_id = user.id
            chef_id = request.data.get('chef_id')
            if not chef_id:
                return Response({"error": "Thiếu chef_id"}, status=status.HTTP_400_BAD_REQUEST)
            if not User.objects.filter(id=chef_id, chef__is_accepted=True).exists():
                return Response({"error": "Đầu bếp không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
        elif hasattr(user, 'chef'):
            chef_id = user.id
            customer_id = request.data.get('customer_id')
            if not customer_id:
                return Response({"error": "Thiếu customer_id"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"error": "Không có quyền"}, status=status.HTTP_403_FORBIDDEN)

        room_id = get_or_create_chat_room(customer_id, chef_id)
        return Response({"room_id": room_id, "firebase_path": f"chats/{room_id}/messages"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='send')
    def send_message(self, request):
        user = request.user
        room_id = request.data.get('room_id')
        text = request.data.get('text', '').strip()

        if not room_id or not text:
            return Response({"error": "Thiếu room_id hoặc text"}, status=status.HTTP_400_BAD_REQUEST)

        parts = room_id.split('_')
        try:
            c_id = int(parts[1])
            ch_id = int(parts[3])
        except (IndexError, ValueError):
            return Response({"error": "room_id không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)

        if user.id not in [c_id, ch_id]:
            return Response({"error": "Bạn không thuộc phòng chat này"}, status=status.HTTP_403_FORBIDDEN)

        msg_key = send_chat_message(room_id=room_id, sender_id=user.id, sender_role=user.role, text=text)
        return Response({"message_id": msg_key, "status": "sent"}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='history')
    def get_history(self, request):
        room_id = request.query_params.get('room_id')
        if not room_id:
            return Response({"error": "Thiếu room_id"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(get_chat_messages(room_id), status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='room-chef')
    def my_rooms(self, request):
        if not hasattr(request.user, 'chef'):
            return Response({"error": "Chỉ dành cho đầu bếp"}, status=status.HTTP_403_FORBIDDEN)
        return Response(get_chef_rooms(request.user.id), status=status.HTTP_200_OK)


class TableViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Table.objects.filter(active=True)
    serializer_class = serializers.TableSerializer

    # ── Helper ───────────────────────────────────────────────────────────────

    def get_active_table_book(self, table, user):
        if not hasattr(user, 'customer'):
            return None
        return TableBook.objects.filter(
            table=table,
            customer=user,
            status__in=[TableStatus.BOOKED, TableStatus.OCCUPIED]
        ).order_by('-id').first()

    # ── Danh sách khung giờ đã đặt của một bàn ───────────────────────────────

    @action(detail=True, methods=['get'], url_path='bookedTimes')
    def booked_times(self, request, pk=None):
        table = Table.objects.filter(pk=pk, active=True).first()
        if not table:
            return Response({"error": "Không tìm thấy bàn."}, status=status.HTTP_404_NOT_FOUND)

        books = TableBook.objects.filter(
            table=table,
            status__in=[TableStatus.BOOKED, TableStatus.OCCUPIED]
        ).order_by('start_time')

        return Response(serializers.TableBookSerializer(books, many=True).data, status=status.HTTP_200_OK)

    # ── Đặt bàn ──────────────────────────────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='checkin',
            permission_classes=[permissions.IsAuthenticated])
    def check_in(self, request, pk=None):
        if not hasattr(request.user, 'customer'):
            return Response({"error": "Chỉ khách hàng mới được đặt bàn."}, status=status.HTTP_403_FORBIDDEN)

        table = Table.objects.filter(pk=pk, active=True).first()
        if not table:
            return Response({"error": "Không tìm thấy bàn."}, status=status.HTTP_404_NOT_FOUND)

        start_time = request.data.get('start_time')
        if not start_time:
            return Response({"error": "Vui lòng chọn thời gian đặt bàn."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            start_time = timezone.datetime.fromisoformat(start_time.replace("Z", "+00:00"))
        except Exception:
            return Response({"error": "Thời gian đặt bàn không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        if timezone.is_naive(start_time):
            start_time = timezone.make_aware(start_time)

        if start_time < timezone.now():
            return Response({"error": "Không thể đặt bàn trong quá khứ."}, status=status.HTTP_400_BAD_REQUEST)

        end_time = start_time + timedelta(hours=2)

        # Kiểm tra user đang có bàn chưa hoàn thành (chỉ tính booking chưa hết giờ)
        if TableBook.objects.filter(
                customer=request.user,
                status__in=[TableStatus.BOOKED, TableStatus.OCCUPIED],
                end_time__gt=timezone.now(),
        ).exists():
            return Response({"error": "Bạn đang có bàn chưa hoàn thành."}, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra trùng khung giờ
        if TableBook.objects.filter(
                table=table,
                status__in=[TableStatus.BOOKED, TableStatus.OCCUPIED],
                start_time__lt=end_time,
                end_time__gt=start_time,
        ).exists():
            return Response({"error": "Khung giờ này đã có người đặt."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with db_transaction.atomic():
                TableBook.objects.create(
                    table=table,
                    customer=request.user,
                    start_time=start_time,
                    end_time=end_time,
                    status=TableStatus.BOOKED,
                    note=request.data.get('note', ''),
                )
                Invoice.objects.create(
                    customer=request.user, table=table,
                    total_amount=0, is_paid=False, transaction_id=None,
                )
                table.status = TableStatus.BOOKED
                table.save()
                update_firebase_table(table_id=table.code, status=TableStatus.BOOKED.value, total_price=0)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializers.TableSerializer(table).data, status=status.HTTP_200_OK)

    # ── Hủy đặt bàn — chỉ đúng customer đã đặt mới hủy được ─────────────────

    @action(detail=True, methods=['patch'], url_path='cancelCheckin',
            permission_classes=[permissions.IsAuthenticated])
    def cancel_check_in(self, request, pk=None):
        if not hasattr(request.user, 'customer'):
            return Response({"error": "Chỉ khách hàng mới được hủy đặt bàn."}, status=status.HTTP_403_FORBIDDEN)

        table = Table.objects.filter(pk=pk, active=True).first()
        if not table:
            return Response({"error": "Không tìm thấy bàn."}, status=status.HTTP_404_NOT_FOUND)

        # Chỉ tìm booking của chính request.user — user khác sẽ không tìm thấy
        table_book = TableBook.objects.filter(
            table=table,
            customer=request.user,
            status=TableStatus.BOOKED,
        ).order_by('-id').first()

        if not table_book:
            return Response({"error": "Bạn không có lượt đặt bàn nào để hủy."}, status=status.HTTP_403_FORBIDDEN)

        invoice = Invoice.objects.filter(table=table, customer=request.user, is_paid=False).first()
        if invoice and invoice.details.exists():
            return Response({"error": "Không thể hủy khi đã gọi món."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with db_transaction.atomic():
                if invoice:
                    invoice.delete()
                table_book.delete()

                # Kiểm tra còn booking active nào khác của bàn này không
                remaining = TableBook.objects.filter(
                    table=table,
                    status__in=[TableStatus.BOOKED, TableStatus.OCCUPIED],
                ).exists()

                if not remaining:
                    # Không còn ai đặt → mới set về AVAILABLE
                    table.status = TableStatus.AVAILABLE
                    table.save()
                    update_firebase_table(table_id=table.code, status=TableStatus.AVAILABLE.value, total_price=0)
                # Nếu còn booking khác → giữ nguyên status hiện tại của bàn

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializers.TableSerializer(table).data, status=status.HTTP_200_OK)


    # ── Gọi món ───────────────────────────────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='order',
            permission_classes=[permissions.IsAuthenticated])
    def order_dish(self, request, pk=None):
        if not hasattr(request.user, 'customer'):
            return Response({"error": "Chỉ khách hàng mới được gọi món."}, status=status.HTTP_403_FORBIDDEN)

        table = Table.objects.filter(pk=pk, active=True).first()
        if not table:
            return Response({"error": "Không tìm thấy bàn."}, status=status.HTTP_404_NOT_FOUND)

        try:
            quantity = int(request.data.get('quantity', 1))
            if quantity < 1:
                raise ValueError
        except (ValueError, TypeError):
            return Response({"error": "Số lượng không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        if table.status not in [TableStatus.BOOKED, TableStatus.OCCUPIED]:
            return Response({"error": "Bàn chưa được đặt."}, status=status.HTTP_400_BAD_REQUEST)

        dish = Dish.objects.filter(pk=request.data.get('dish_id')).first()
        if not dish:
            return Response({"error": "Không tìm thấy món."}, status=status.HTTP_404_NOT_FOUND)

        table_book = self.get_active_table_book(table, request.user)
        if not table_book:
            return Response({"error": "Không tìm thấy lượt đặt bàn hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        if not (table_book.start_time <= now <= table_book.end_time):
            return Response({"error": "Chỉ được gọi món trong thời gian sử dụng bàn."}, status=status.HTTP_400_BAD_REQUEST)

        invoice = Invoice.objects.filter(table=table, customer=request.user, is_paid=False).first()
        if not invoice:
            return Response({"error": "Không tìm thấy hóa đơn hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with db_transaction.atomic():
                detail, _ = InvoiceDetail.objects.get_or_create(
                    invoice=invoice, dish=dish, defaults={'quantity': 0}
                )
                detail.quantity += quantity
                detail.save()

                invoice.total_amount += dish.price * quantity
                invoice.save()

                table.status = TableStatus.OCCUPIED
                table.save()
                table_book.status = TableStatus.OCCUPIED
                table_book.save()

                update_firebase_table(
                    table_id=table.code,
                    status=TableStatus.OCCUPIED.value,
                    total_price=float(invoice.total_amount),
                )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializers.InvoiceSerializer(invoice).data, status=status.HTTP_200_OK)

    # ── Thanh toán ────────────────────────────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='checkout',
            permission_classes=[permissions.IsAuthenticated])
    def checkout(self, request, pk=None):
        if not hasattr(request.user, 'customer'):
            return Response({"error": "Chỉ khách hàng mới được thanh toán."}, status=status.HTTP_403_FORBIDDEN)

        table = Table.objects.filter(pk=pk, active=True).first()
        if not table:
            return Response({"error": "Không tìm thấy bàn."}, status=status.HTTP_404_NOT_FOUND)

        method = request.data.get('method')
        if not method:
            return Response({"error": "Vui lòng chọn phương thức thanh toán."}, status=status.HTTP_400_BAD_REQUEST)

        invoice = Invoice.objects.filter(table=table, customer=request.user, is_paid=False).first()
        if not invoice:
            return Response({"error": "Không có hóa đơn."}, status=status.HTTP_400_BAD_REQUEST)

        transaction_id = request.data.get('transaction')

        try:
            with db_transaction.atomic():
                payment = PaymentFactory.get_strategy(method=method)

                if method != "CASH":
                    if not transaction_id:
                        return Response({"error": "Vui lòng cung cấp mã giao dịch."}, status=status.HTTP_400_BAD_REQUEST)
                    if Invoice.objects.filter(transaction_id=str(transaction_id)).exists():
                        return Response({"error": "Mã giao dịch đã tồn tại."}, status=status.HTTP_400_BAD_REQUEST)
                    invoice = payment.pay(invoice, table, transaction_id)
                else:
                    invoice = payment.pay(invoice, table)

                table_book = self.get_active_table_book(table, request.user)
                if table_book:
                    table_book.delete()

                table.status = TableStatus.AVAILABLE
                table.save()
                update_firebase_table(table_id=table.code, status=TableStatus.AVAILABLE.value, total_price=0)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializers.InvoiceSerializer(invoice).data, status=status.HTTP_200_OK)

class StatisViewSet(viewsets.ViewSet,generics.ListAPIView):
    permissions = [permissions.IsAuthenticated]
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer

    @action(methods=['get'], detail=False, url_path='chef-statis')
    def chef_statis(self, request):

        DT_MON = InvoiceDetail.objects.filter('dish__name').annotate(total_quantity=Sum('quantity'),total_revenue=Sum(F('quantity')*F('dish__price')))
        DT_TG = Invoice.objects.filter(is_paid=True).values('created_at__date', 'created_at__month','create_at__year').annotate(total_revenue=Sum('total_amount')).order_by('create_at__date','create_at__year','create_at__year')
        return Response(DT_MON,status=status.HTTP_200_OK)

    @action(methods=['get'], detail=False, url_path='admin-statis')
    def admin_statis(self,request):
        pass