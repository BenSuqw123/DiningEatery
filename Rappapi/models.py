from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField


# Create your models here.
class BaseModel(models.Model):
    id = models.AutoField(primary_key=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
class UserRole(models.TextChoices):
    CUSTOMER = 'CUSTOMER', 'Customer'
    ADMIN = 'ADMIN', 'Admin'
    CHEF = 'CHEF', 'Chef'

class User(AbstractUser):
    avatar = CloudinaryField('avatar', blank=True, null=True)
    role = models.CharField(
        max_length=10,
        choices=UserRole.choices,
        default=UserRole.CUSTOMER
    )

    def __str__(self):
        return self.username


class Admin(User):

    class Meta:
        verbose_name = 'Admin'
        verbose_name_plural = 'Admins'

class Chef(User):
    admin_accepted = models.ForeignKey(
        Admin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='accepted_chefs',
        limit_choices_to={'role': UserRole.ADMIN}
    )

    class Meta:
        verbose_name = 'Chef'
        verbose_name_plural = 'Chefs'

class Customer(User):

    class Meta:
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'

class Ingredient(BaseModel):
    name = models.CharField(max_length=255)
    def __str__(self):
        return self.name


class Dish(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    chefs = models.ManyToManyField(Chef, related_name='dishes')

    time_served = models.IntegerField(null=True, blank=True)
    image = CloudinaryField('dish_image', blank=True, null=True)
    ingredient = models.ManyToManyField(Ingredient, through='IngredientDish', related_name='dishes')

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-id']
        verbose_name_plural = 'Dishes'

class Rate(BaseModel):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='ratings')
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE, related_name='ratings')
    rating = models.IntegerField(validators=[MinValueValidator(1),MaxValueValidator(5)],default=5)
    comment = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('customer', 'dish')

class IngredientDish(BaseModel):
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE,related_name='ingredient_dishes')
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE, related_name='dish_ingredients')
    quantity = models.CharField(max_length=255)

class Invoice(BaseModel):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='receipts')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

class InvoiceDetail(BaseModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='details')
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

