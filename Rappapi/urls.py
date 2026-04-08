from django.urls import path, re_path, include
from drf_yasg.inspectors import view
from rest_framework.routers import DefaultRouter
from Rappapi import views

router = DefaultRouter()
router.register('users', views.UserViewSet, basename='user')
router.register('dishes', views.DishViewSet, basename='dish')
#router.register('invoices', view.)

urlpatterns = [
    path('', include(router.urls))
]