from django.db.models import Q
from rest_framework import viewsets, generics, filters, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from Rappapi.models import User, Dish,Ingredient
from Rappapi import serializers

class DishViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Dish.objects.filter(active=True) \
        .select_related('chef') \
        .prefetch_related('dish_ingredients__ingredient')

    serializer_class = serializers.DishSerializer

class UserViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser]

class ChefViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = User.objects.filter(role="CHEF", is_accepted=True, is_active=True)
    serializer_class = serializers.ChefSerializer

    def get_queryset(self):
        query = self.queryset

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