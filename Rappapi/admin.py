from django.contrib import admin
from django.template.response import TemplateResponse
from django.utils.html import mark_safe
from django.urls import path
from django import forms
from django.db.models import Count, Sum
from ckeditor_uploader.widgets import CKEditorUploadingWidget
from Rappapi.models import (
    User, UserRole, Ingredient, Dish, Rate,
    IngredientDish, Invoice, InvoiceDetail,
    Chef, Customer, Admin, Category
)
from django.contrib.auth.admin import UserAdmin


# --- 1. FORMS & INLINES ---

class DishForm(forms.ModelForm):
    # Sử dụng CKEditor cho phần mô tả món ăn
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


# --- 2. CUSTOM USER ADMINS (Inheritance handling) ---

class BaseUserAdmin(UserAdmin):
    """Lớp nền dùng chung cho các loại User"""
    list_display = ['id', 'username', 'role', 'is_active', 'avatar_display']
    search_fields = ['username', 'first_name', 'last_name', 'email']
    list_filter = ['role', 'is_active']
    readonly_fields = ['avatar_display']

    def avatar_display(self, user):
        if user.avatar:
            return mark_safe(f'<img src="{user.avatar.url}" width="50" style="border-radius: 50%;" />')
        return "No Image"

    avatar_display.short_description = 'Avatar'


class AdminProfileAdmin(BaseUserAdmin):
    """Quản lý dành riêng cho Admin"""
    fieldsets = UserAdmin.fieldsets + (
        ('Restaurant Info', {'fields': ('role', 'avatar', 'avatar_display')}),
    )


class ChefProfileAdmin(BaseUserAdmin):
    """Quản lý dành riêng cho Đầu bếp"""
    list_display = BaseUserAdmin.list_display + ['admin_accepted']
    list_filter = BaseUserAdmin.list_filter + ['admin_accepted']

    fieldsets = UserAdmin.fieldsets + (
        ('Chef Verification', {'fields': ('role', 'admin_accepted', 'avatar', 'avatar_display')}),
    )


class CustomerProfileAdmin(BaseUserAdmin):
    """Quản lý dành riêng cho Khách hàng"""
    fieldsets = UserAdmin.fieldsets + (
        ('Customer Info', {'fields': ('role', 'avatar', 'avatar_display')}),
    )


# --- 3. BUSINESS LOGIC ADMINS ---

class DishAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'price', 'display_chefs', 'active', 'image_display']
    search_fields = ['name', 'description']
    list_filter = ['chefs', 'active', 'created_at']
    filter_horizontal = ['chefs']
    readonly_fields = ['image_display']
    form = DishForm
    inlines = [IngredientDishInline]

    def display_chefs(self, obj):
        # Hiển thị danh sách các đầu bếp nấu món này
        return ", ".join([chef.username for chef in obj.chefs.all()])

    display_chefs.short_description = 'Đầu bếp phụ trách'

    def image_display(self, dish):
        if dish.image:
            return mark_safe(f'<img src="{dish.image.url}" width="100" style="border-radius: 8px;" />')
        return "No Image"

    image_display.short_description = 'Ảnh món ăn'


class RateAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'dish', 'rating', 'created_at']
    list_filter = ['rating', 'dish']
    search_fields = ['comment', 'customer__username', 'dish__name']  # Sửa từ user thành customer


class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'total_price', 'created_at', 'active']
    list_filter = ['created_at', 'active']
    search_fields = ['customer__username']  # Sửa từ user thành customer
    inlines = [InvoiceDetailInline]


# --- 4. CUSTOM ADMIN SITE & STATS ---

class RestaurantAdminSite(admin.AdminSite):
    site_header = 'Hệ Thống Quản Lý Nhà Hàng'

    def get_urls(self):
        return [
            path('restaurant-stats/', self.restaurant_stats),
        ] + super().get_urls()

    def restaurant_stats(self, request):
        # Thống kê số món theo Đầu bếp
        chef_stats = Chef.objects.annotate(
            dish_count=Count('dishes')
        ).values('username', 'dish_count')

        # Thống kê doanh thu theo Khách hàng
        revenue_stats = Customer.objects.annotate(
            total_spent=Sum('receipts__total_price')
        ).values('username', 'total_spent').filter(total_spent__gt=0)

        # Tổng doanh thu chung
        total_revenue = Invoice.objects.aggregate(Sum('total_price'))['total_price__sum'] or 0

        return TemplateResponse(request, 'admin/stats.html', {
            'chef_stats': chef_stats,
            'revenue_stats': revenue_stats,
            'total_revenue': total_revenue
        })


# Khởi tạo Admin Site tùy biến
admin_site = RestaurantAdminSite(name='myadmin')

# Đăng ký các Model vào Site mới
admin_site.register(Admin, AdminProfileAdmin)
admin_site.register(Chef, ChefProfileAdmin)
admin_site.register(Customer, CustomerProfileAdmin)
admin_site.register(Dish, DishAdmin)
admin_site.register(Ingredient, admin.ModelAdmin)
admin_site.register(Rate, RateAdmin)
admin_site.register(Invoice, InvoiceAdmin)
admin_site.register(Category)