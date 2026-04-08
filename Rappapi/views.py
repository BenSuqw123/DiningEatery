from rest_framework import viewsets, generics, filters, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from Rappapi.models import User, Dish,Ingredient
from Rappapi import serializers

class DishViewSet(viewsets.ViewSet, generics.ListAPIView):
    # queryset = Dish.objects.filter(active=True)
    # serializer_class = serializers.DishSerializer

    # def get_queryset(self):
    #     query = self.request

    #     q = self.request.query_params.get('q')
    #     if q:
    #         query = query.filter(name__icontains=q)

    #     ingre_id = self.request.query_params.get('ingre_id')
    #     if ingre_id:
    #         ingre = Ingredient.objects.filter(id=ingre_id)
    #     @action(methods=['get'], url_path='ingredients', detail=True)
    #     def get_ingredients(self, request,pk):
    #         ingredients = self.get_object().filter(pk=pk)
    #         serializer = serializers.IngredientSerializer(ingredients, many=True)
    pass

class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser]