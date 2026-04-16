from django.contrib import admin
from django.template.response import TemplateResponse
from django.utils.html import mark_safe
from django.urls import path
from django import forms
from django.db.models import Count, Sum
from ckeditor_uploader.widgets import CKEditorUploadingWidget
from Rappapi.models import User, UserRole, Ingredient, Dish, Rate, IngredientDish, Invoice, InvoiceDetail
from django.contrib.auth.admin import UserAdmin

class DishForm(forms.ModelForm):
    description = forms.CharField(widget=CKEditorUploadingWidget)

    class Meta:
        model = Dish
        fields = '__all__'

class IngredientDishInline(admin.TabularInline):
    model = IngredientDish
    extra = 1

class InvoiceDetailInline(admin.TabularInline):
    model = InvoiceDetail
    extra = 1
    readonly_fields = ['price']


class AdminUser(UserAdmin):
    list_display = ['id', 'username', 'role', 'is_accepted', 'is_active', 'avatar_display']
    search_fields = ['username', 'first_name', 'last_name']
    list_filter = ['role', 'is_accepted', 'is_active']
    readonly_fields = ['avatar_display']

    fieldsets = UserAdmin.fieldsets + (
        (
            'Custom Restaurant Info',
            {
                'fields': ('role', 'is_accepted', 'admin_accepted', 'avatar', 'avatar_display')
            }
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            'Custom Restaurant Info',
            {
                'fields': ('role', 'is_accepted', 'admin_accepted', 'avatar')
            }
        ),
    )

    def avatar_display(self, user):
        if user.avatar:
            return mark_safe(f'<img src="{user.avatar.url}" width="50" style="border-radius: 50%;" />')
        return "No Image"

    avatar_display.short_description = 'Avatar'

class DishAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'price', 'chef', 'active', 'image_display']
    search_fields = ['name', 'description']
    list_filter = ['chef', 'active', 'created_at']
    readonly_fields = ['image_display']
    form = DishForm
    inlines = [IngredientDishInline]

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return ['image_display']
        return []

    def image_display(self, dish):
        if dish.image:
            return mark_safe(f'<img src="{dish.image.url}" width="120" style="border-radius: 8px;" />')
        return "No Image"
    image_display.short_description = 'Image'

class IngredientAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'active', 'created_at']
    search_fields = ['name']

class RateAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'dish', 'rating', 'created_at']
    list_filter = ['rating', 'dish']
    search_fields = ['comment', 'user__username', 'dish__name']

class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'total_price', 'created_at', 'active']
    list_filter = ['created_at']
    search_fields = ['user__username']
    inlines = [InvoiceDetailInline]

class RestaurantAdminSite(admin.AdminSite):
    site_header = 'Hệ Thống Quản Lý Nhà Hàng'

    def get_urls(self):
        return [
            path('restaurant-stats/', self.restaurant_stats),
        ] + super().get_urls()

    def restaurant_stats(self, request):
        chef_stats = User.objects.filter(role=UserRole.CHEF).annotate(
            dish_count=Count('dishes')
        ).values('id', 'username', 'dish_count')

        revenue_stats = User.objects.filter(role=UserRole.USER).annotate(
            total_spent=Sum('receipts__total_price')
        ).values('id', 'username', 'total_spent').exclude(total_spent=None)

        return TemplateResponse(request, 'admin/stats.html', {
            'chef_stats': chef_stats,
            'revenue_stats': revenue_stats
        })

admin_site = RestaurantAdminSite(name='myadmin')

admin_site.register(User, AdminUser)
admin_site.register(Dish, DishAdmin)
admin_site.register(Ingredient, IngredientAdmin)
admin_site.register(Rate, RateAdmin)
admin_site.register(Invoice, InvoiceAdmin)