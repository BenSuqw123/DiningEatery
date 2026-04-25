from django.db.models import Q
from rest_framework import viewsets, generics, filters, status, parsers, permissions
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from Rappapi.models import User, Dish, Ingredient, Chef, Rate, Category
from Rappapi import serializers, paginators
from .firebase import update_firebase_table, get_firebase_table


class DishViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Dish.objects.filter(active=True).prefetch_related('chefs', 'dish_ingredients__ingredient')
    serializer_class = serializers.DishSerializer
    pagination_class = paginators.DishPaginator
    def get_queryset(self):
        query = self.queryset

        q= self.request.query_params.get('q')
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

        return query

    @action(methods=['get'], url_path='chef', detail=True)
    def get_chef(self,request, pk=None):
        chef = self.get_object().chefs.filter(is_active=True)
        return Response(serializers.ChefSerializer(chef, many=True).data, status=status.HTTP_200_OK)

    @action(methods=['get'], url_path='ingredient', detail=True)
    def get_ingredient(self,request, pk=None):
        ingredient = self.get_object().ingredients.filter(is_active=True)
        return Response(serializers.IngredientSerializer(ingredient, many=True).data, status=status.HTTP_200_OK)

    def get_permissions(self):
        if self.action in ['rating'] and self.request.method.__eq__('POST'):
            return [permissions.IsAuthenticated()]

        return [permissions.AllowAny()]

    @action(methods=['post','get'], url_path='rates', detail=True)
    def rating(self, request, pk):
        if request.method.__eq__('POST'):
            s = serializers.RateSerializer(data={
                'comment': request.data.get('comment'),
                'rating': request.data.get('rating'),
                'customer': request.user.pk,
                'dish': pk
            })
            s.is_valid(raise_exception=True)
            r = s.save()
            return Response(serializers.RateSerializer(r).data, status= status.HTTP_201_CREATED)

        rates = Rate.objects.select_related('customer').filter(active=True,dish_id=pk).order_by('-id')
        p = paginators.RatePaginator()
        page = p.paginate_queryset(rates, request)
        if page is not None:
            serializer = serializers.RateSerializer(page, many=True)
            return p.get_paginated_response(serializer.data)

        return Response(serializers.RateSerializer(rates, many=True).data, status= status.HTTP_200_OK)

class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser]
    pagination_class = paginators.ItemPaginator

    @action(methods=['get','patch'], url_path='current-user', detail=False, permission_classes=[permissions.IsAuthenticated])
    def current_user(self, request):
        u = request.user
        if request.method.__eq__('PATCH'):
            s = serializers.SimpleUserSerializer(u, data=request.data)
            s.is_valid(raise_exception=True)
            u = s.save()

        return Response(serializers.UserSerializer(u).data, status=status.HTTP_200_OK)

class ChefViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Chef.objects.filter(role="CHEF", admin_accepted__isnull=False, is_active=True)
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

class TableViewSet(viewsets.ViewSet):

    @action(detail=True, methods=['post'], url_path='book', permission_classes=[permissions.IsAuthenticated])
    def book_table(self, request, pk=None):
        table_id = pk

        table_data = get_firebase_table(table_id)
        if table_data:
            current_status = table_data.get('status')

            if current_status == 'OCCUPIED' or current_status == 'RESERVED':
                return Response({
                    "error": "Bàn này đã được người khác đặt trước"
                }, status=status.HTTP_400_BAD_REQUEST)

        try:
            update_firebase_table(
                table_id=table_id,
                status='RESERVED',
                total_price=0
            )
        except Exception as e:
            return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": f"Đặt bàn {table_id} thành công!"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='order', permission_classes=[permissions.IsAuthenticated])
    def order_dish(self, request, pk=None):
        table_id = pk

        dish_id = request.data.get('dish_id')
        quantity = int(request.data.get('quantity', 1))

        if not dish_id:
            return Response({"error": "Thiếu dish_id của món ăn."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            dish = Dish.objects.get(id=dish_id, active=True)
            new_cost = float(dish.price) * quantity
        except Dish.DoesNotExist:
            return Response({"error": "Món ăn không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

        table_data = get_firebase_table(table_id)
        current_total_price = 0

        if table_data:
            current_total_price = float(table_data.get('total_price', 0))

        # 4. CỘNG DỒN TIỀN
        updated_total_price = current_total_price + new_cost
        try:
            update_firebase_table(
                table_id=table_id,
                status='OCCUPIED',
                total_price=updated_total_price
            )
        except Exception as e:
            return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "message": f"Đã gọi món {dish.name} (x{quantity}) thành công!",
            "added_cost": new_cost,
            "total_price_now": updated_total_price
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='checkout', permission_classes=[permissions.IsAuthenticated])
    def checkout(self, request, pk=None):
        table_id = pk

        update_firebase_table(
            table_id=table_id,
            status='AVAILABLE',
            total_price=0
        )

        return Response({"message": "Thanh toán thành công, bàn đã được dọn"}, status=status.HTTP_200_OK)