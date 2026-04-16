from django.db.models import Q
from rest_framework import viewsets, generics, filters, status, parsers, permissions
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from Rappapi.models import User, Dish, Ingredient, Chef
from Rappapi import serializers

class DishViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Dish.objects.filter(active=True).prefetch_related('chefs', 'dish_ingredients__ingredient')
    serializer_class = serializers.DishSerializer
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

        return query

    @action(methods=['get'], url_path='chef', detail=True)
    def get_chef(self,request, pk=None):
        chef = self.get_object().chefs.filter(is_active=True)
        return Response(serializers.ChefSerializer(chef, many=True).data, status=status.HTTP_200_OK)
    @action(methods=['get'], url_path='ingredient', detail=True)
    def get_ingredient(self,request, pk=None):
        ingredient = self.get_object().ingredients.filter(is_active=True)
        return Response(serializers.IngredientSerializer(ingredient, many=True).data, status=status.HTTP_200_OK)

class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser]

    @action(methods=['get'], url_path='current-user', detail=False, permission_classes=[permissions.IsAuthenticated])
    def current_user(self, request):
        return Response(serializers.UserSerializer(request.user).data, status=status.HTTP_200_OK)

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