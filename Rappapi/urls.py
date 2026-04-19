from django.urls import path, re_path, include
from rest_framework.routers import DefaultRouter
from Rappapi import views

router = DefaultRouter()
router.register('users', views.UserViewSet, basename='user')
router.register('dishes', views.DishViewSet, basename='dish')
router.register('chefs', views.ChefViewSet, basename='chef')
router.register('ingredients', views.IngredientViewSet, basename='ingredient')
router.register('tables', views.TableViewSet, basename='table')

urlpatterns = [
    path('', include(router.urls))
]