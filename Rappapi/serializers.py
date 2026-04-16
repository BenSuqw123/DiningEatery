from Rappapi.models import IngredientDish, User, Dish, Ingredient,Invoice,InvoiceDetail,Rate
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username','password', 'avatar')
        extra_kwargs = {
            'password': {
                'write_only': True
            }
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
        return user

class ChefSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name','last_name', 'avatar']

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
    ingredients = IngredientDishSerializer(
        source='dish_ingredients',  # 👈 cực kỳ quan trọng
        many=True,
        read_only=True
    )

    chefs = ChefSerializer(many=True, read_only=True)
    class Meta:
        model = Dish
        fields = ['id', 'created_at', 'name', 'description','price','ingredients','chefs','time_served','image']

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['id','created_at','user','total_price']

class InvoiceDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceDetail
        fields= ['id','created_at','invoice','dish','quantity','price']
        extra_kwargs = {
            'user':{
                'read_only':True
            }
        }

class RateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rate
        fields = ['id','user','dish','rating','comment','created_at']
