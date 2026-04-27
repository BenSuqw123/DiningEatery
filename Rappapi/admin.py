from django.contrib import admin
from django.template.response import TemplateResponse
from django.utils.html import mark_safe
from django.urls import path
from django import forms
from django.db.models import Count, Sum
from ckeditor_uploader.widgets import CKEditorUploadingWidget
from django.contrib.auth.admin import UserAdmin

from Rappapi.models import (
    User, Customer, Chef, Admin as AdminProfile,
    Ingredient, Dish, Rate, IngredientDish, Invoice,
    InvoiceDetail, Category, Table
)

# --- 1. FORMS & INLINES ---

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
    # Thêm các trường thanh toán mới vào inline của hóa đơn
    fields = ['dish', 'quantity', 'method', 'transaction_id', 'status']

# --- CÁC INLINE CHO PROFILE (COMPOSITION) ---
class CustomerInline(admin.StackedInline):
    model = Customer
    can_delete = True
    verbose_name_plural = 'Hồ sơ Khách hàng (Tích điểm/Hạng)'
    fk_name = 'user'

class AdminProfileInline(admin.StackedInline):
    model = AdminProfile
    can_delete = True
    verbose_name_plural = 'Hồ sơ Quản lý (Điều hành)'
    fk_name = 'user'

class ChefInline(admin.StackedInline):
    model = Chef
    can_delete = True
    verbose_name_plural = 'Hồ sơ Đầu bếp (Kỹ năng/Duyệt)'
    fk_name = 'user'
    fields = ['is_accepted', 'accepted_by']
    autocomplete_fields = ['accepted_by'] # Giúp tìm kiếm Admin nhanh hơn

# --- 2. UNIFIED USER ADMIN ---

class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'get_role', 'is_active', 'phone_number', 'avatar_display']
    list_filter = ['is_active', 'is_staff', 'groups']
    search_fields = ['username', 'email', 'phone_number']
    readonly_fields = ['avatar_display']

    # Nhúng cả 3 loại Profile để Admin có thể "cấp áo" ngay tại đây
    inlines = [CustomerInline, AdminProfileInline, ChefInline]

    fieldsets = UserAdmin.fieldsets + (
        ('Thông tin bổ sung', {'fields': ('avatar', 'avatar_display', 'phone_number')}),
    )

    def get_role(self, obj):
        return obj.role
    get_role.short_description = 'Vai trò hiện tại'

    def avatar_display(self, user):
        if user.avatar:
            return mark_safe(f'<img src="{user.avatar.url}" width="40" style="border-radius: 50%;" />')
        return "No Avatar"
    avatar_display.short_description = 'Ảnh đại diện'

# --- 3. BUSINESS LOGIC ADMINS ---

class DishAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'price', 'category', 'active']
    list_filter = ['category', 'active', 'chefs']
    search_fields = ['name']
    filter_horizontal = ['chefs'] # M2M chọn đầu bếp dễ hơn
    inlines = [IngredientDishInline]
    form = DishForm

class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'table', 'customer', 'total_amount', 'is_paid', 'created_at']
    list_filter = ['is_paid', 'table__status']
    search_fields = ['customer__username', 'table__code']
    inlines = [InvoiceDetailInline]
    readonly_fields = ['total_amount'] # Thường để system tự tính

class AdminProfileAdmin(admin.ModelAdmin):
    search_fields = ['user__username'] # Cần cái này để autocomplete ở Chef hoạt động

# --- 4. CUSTOM ADMIN SITE & STATS ---

class RestaurantAdminSite(admin.AdminSite):
    site_header = 'Hệ Thống Quản Lý Nhà Hàng 2026'

    def get_urls(self):
        return [path('stats/', self.restaurant_stats)] + super().get_urls()

    def restaurant_stats(self, request):
        # Thống kê đầu bếp và số món phụ trách
        chef_stats = User.objects.filter(chef__isnull=False).annotate(
            dish_count=Count('dishes')
        ).values('username', 'dish_count')

        # Thống kê doanh thu theo khách hàng
        revenue_stats = User.objects.filter(customer__isnull=False).annotate(
            total_spent=Sum('invoices__total_amount')
        ).values('username', 'total_spent').filter(total_spent__gt=0)

        # Tổng tiền từ các hóa đơn đã thu tiền
        total_revenue = Invoice.objects.filter(is_paid=True).aggregate(Sum('total_amount'))['total_amount__sum'] or 0

        return TemplateResponse(request, 'admin/stats.html', {
            'chef_stats': chef_stats,
            'revenue_stats': revenue_stats,
            'total_revenue': total_revenue
        })

admin_site = RestaurantAdminSite(name='myadmin')

# Đăng ký các model vào Admin Site tùy chỉnh
admin_site.register(User, CustomUserAdmin)
admin_site.register(AdminProfile, AdminProfileAdmin) # Đăng ký để ChefInline gọi được Autocomplete
admin_site.register(Dish, DishAdmin)
admin_site.register(Category)
admin_site.register(Ingredient)
admin_site.register(Table, admin.ModelAdmin)
admin_site.register(Invoice, InvoiceAdmin)
admin_site.register(Rate, admin.ModelAdmin)