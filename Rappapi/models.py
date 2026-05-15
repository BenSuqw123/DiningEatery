from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField
from Rappapi.firebase import update_firebase_table

# ==========================================
# 0. BASE MODEL
# ==========================================
class BaseModel(models.Model):
    id = models.AutoField(primary_key=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ==========================================
# 1. BẢNG USER (Core - Thuần túy định danh)
# ==========================================
class User(AbstractUser):
    avatar = CloudinaryField('avatar', blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    @property
    def role(self):
        if hasattr(self, 'admin'):
            return 'ADMIN'
        if hasattr(self, 'chef'):
            return 'CHEF'
        if hasattr(self, 'customer'):
            return 'CUSTOMER'
        return 'GUEST'

    def __str__(self):
        return self.username


# ==========================================
# 2. CÁC BẢNG COMPOSITION (Vai trò - Phân quyền)
# ==========================================
class Customer(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer')

    class Meta:
        verbose_name = 'Customer Profile'

    def __str__(self):
        return f"Customer: {self.user.username}"


class Admin(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin')

    class Meta:
        verbose_name = 'Admin Profile'

    def __str__(self):
        return f"Admin: {self.user.username}"


class Chef(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='chef')
    is_accepted = models.BooleanField(default=False, verbose_name="Đã được duyệt?")

    # Khóa chặt: Người duyệt BẮT BUỘC phải là một Admin (Không thể là Customer hay Guest)
    accepted_by = models.ForeignKey(
        Admin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_chefs',
        verbose_name="Người duyệt"
    )

    class Meta:
        verbose_name = 'Chef Profile'

    def __str__(self):
        status = "Đã duyệt" if self.is_accepted else "Chờ duyệt"
        return f"Chef: {self.user.username} ({status})"


# ==========================================
# 3. THỰC ĐƠN & MÓN ĂN
# ==========================================
class Ingredient(BaseModel):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class Category(BaseModel):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Dish(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    # Giới hạn: Chỉ những User có túi 'chef' (chef__isnull=False) mới được phụ trách món ăn
    chefs = models.ManyToManyField(
        User,
        related_name='dishes',
        limit_choices_to={'chef__isnull': False}
    )

    time_served = models.IntegerField(null=True, blank=True)
    image = CloudinaryField('dish_image', blank=True, null=True)
    ingredient = models.ManyToManyField(Ingredient, through='IngredientDish', related_name='dishes')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='courses', null=True, blank=True)

    class Meta:
        ordering = ['-id']
        verbose_name_plural = 'Dishes'

    def __str__(self):
        return self.name


class IngredientDish(BaseModel):
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='ingredient_dishes')
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE, related_name='dish_ingredients')
    quantity = models.CharField(max_length=255)


class Rate(BaseModel):
    # Giới hạn: Chỉ những User có túi 'customer' mới được phép đánh giá
    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='ratings',
        limit_choices_to={'customer__isnull': False}
    )
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE, related_name='ratings')
    rating = models.IntegerField(blank=True, null=True)
    comment = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('customer', 'dish')


# ==========================================
# 4. QUẢN LÝ BÀN
# ==========================================
class TableStatus(models.TextChoices):
    AVAILABLE = 'AVAILABLE', 'Trống'
    BOOKED = 'BOOKED', 'Đã đặt'
    OCCUPIED = 'OCCUPIED', 'Đang ăn'


class Table(BaseModel):
    code = models.CharField(max_length=10, unique=True)
    location = models.CharField(max_length=100)
    capacity = models.IntegerField(default=4)
    status = models.CharField(
        max_length=15,
        choices=TableStatus.choices,
        default=TableStatus.AVAILABLE
    )

    def __str__(self):
        return f"{self.code} - {self.get_status_display()}"

    def get_state(self):
        from Rappapi.design_patterns.State.table_state import (
            AvailableTableState,
            CheckInTableState,
            OccupiedTableState
        )

        state_map = {
            TableStatus.AVAILABLE: AvailableTableState(),
            TableStatus.BOOKED: CheckInTableState(),
            TableStatus.OCCUPIED: OccupiedTableState(),
        }

        return state_map[self.status]

    def notify_firebase(self, total_price=0):
        update_firebase_table(
            table_id=self.code,
            status=self.status,
            total_price=total_price
        )


class TableBook(BaseModel):
    table = models.ForeignKey(
        Table,
        on_delete=models.CASCADE,
        related_name='bookings'
    )

    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='table_books',
        limit_choices_to={'customer__isnull': False}
    )

    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    status = models.CharField(
        max_length=15,
        choices=TableStatus.choices,
        default=TableStatus.BOOKED
    )

    note = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-start_time']

    def __str__(self):
        return f"{self.customer.username} - {self.table.code} - {self.status}"
# ==========================================
# 5. NGHIỆP VỤ THANH TOÁN & HÓA ĐƠN
# ==========================================

class PaymentMethod(models.TextChoices):
    CASH = 'CASH', 'Cash'
    MOMO = 'MOMO', 'MoMo'
    STRIPE = 'STRIPE', 'Stripe'
    PAYPAL = 'PAYPAL', 'PayPal'
    ZALOPAY = 'ZALOPAY', 'ZaloPay'

class Invoice(BaseModel):
    customer = models.ForeignKey(User,on_delete=models.CASCADE,related_name='invoices',limit_choices_to={'customer__isnull': False})
    table = models.ForeignKey(Table, on_delete=models.PROTECT, related_name='invoices', null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=False)
    method = models.CharField(max_length=10, choices=PaymentMethod.choices, null=True, blank=True)
    transaction_id = models.CharField(max_length=255, unique=True, blank=True, null=True)

class InvoiceDetail(BaseModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='details')
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

