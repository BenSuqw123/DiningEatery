from rest_framework import serializers
from Rappapi.models import (
    IngredientDish, User, Dish, Ingredient, Invoice,
    InvoiceDetail, Rate, Category, Table,
    Chef, Customer, Admin
)


class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", 'avatar']


class UserSerializer(SimpleUserSerializer):
    role = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = SimpleUserSerializer.Meta.fields + ['id', 'username', 'password', 'role']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.avatar:
            data['avatar'] = instance.avatar.url
        return data

    def create(self, validated_data):
        user = User(**validated_data)
        user.set_password(validated_data['password'])
        user.save()
        Customer.objects.create(user=user)
        return user


class ChefSerializer(serializers.ModelSerializer):
    is_accepted = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'avatar', 'is_accepted']

    def get_is_accepted(self, obj):
        if hasattr(obj, 'chef'):
            return obj.chef.is_accepted
        return False

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.avatar:
            data['avatar'] = instance.avatar.url
        return data


class ItemSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image:
            data['image'] = instance.image.url
        return data

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id', 'name']

class IngredientDishSerializer(IngredientSerializer):
    ingredient = IngredientSerializer(read_only=True)

    class Meta:
        model = IngredientDish
        fields = ['ingredient', 'quantity']

class DishSerializer(ItemSerializer):
    ingredients = IngredientDishSerializer(source='dish_ingredients',many=True,read_only=True)
    chefs = ChefSerializer(many=True, read_only=True)

    class Meta:
        model = Dish
        fields = ['id', 'created_at', 'name', 'description', 'price', 'ingredients', 'chefs', 'time_served', 'image']

class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ['id', 'code', 'location', 'capacity', 'status']

class RateSerializer(serializers.ModelSerializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)

    class Meta:
        model = Rate
        fields = ['id', 'customer', 'dish', 'comment', 'created_at', 'rating']
        extra_kwargs = {
            'dish': {'write_only': True},
            'customer': {'write_only': True}
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['customer'] = UserSerializer(instance.customer).data
        return data

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class InvoiceDetailSerializer(serializers.ModelSerializer):
    dish_name = serializers.ReadOnlyField(source='dish.name')

    class Meta:
        model = InvoiceDetail
        fields = ['id', 'dish_name', 'quantity']

class InvoiceSerializer(serializers.ModelSerializer):
    details = InvoiceDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = ['id', 'created_at', 'total_amount', 'is_paid', 'details']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_paid:
            data["method"] = instance.method
            data["transaction_id"] = instance.transaction_id

        return data
