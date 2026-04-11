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
    USER = 'USER', 'User'
    ADMIN = 'ADMIN', 'Admin'
    CHEF = 'CHEF', 'Chef'

class User(AbstractUser):
    avatar = CloudinaryField('avatar', blank=True, null=True)

    role = models.CharField(
        max_length=10,
        choices=UserRole.choices,
        default=UserRole.USER
    )

    is_accepted = models.BooleanField(default=False)

    admin_accepted = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': UserRole.ADMIN}
    )

    def __str__(self):
        return self.username

class Ingredient(BaseModel):
    name = models.CharField(max_length=255)
    def __str__(self):
        return self.name

class Dish(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    chef = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dishes')
    time_served = models.IntegerField(null=True, blank=True)
    image = CloudinaryField('dish_image', blank=True, null=True)
    ingredient = models.ManyToManyField(Ingredient, through='IngredientDish', related_name='dishes')
    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Dishes'

class Rate(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings')
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE, related_name='ratings')
    rating = models.IntegerField()
    comment = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('user', 'dish')

class IngredientDish(BaseModel):
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE,related_name='ingredient_dishes')
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE, related_name='dish_ingredients')
    quantity = models.CharField(max_length=255)

class Invoice(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='receipts')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

class InvoiceDetail(BaseModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='details')
    dish = models.ForeignKey(Dish, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    