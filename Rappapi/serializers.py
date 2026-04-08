from Rappapi.models import User, Dish, Ingredient,Invoice,InvoiceDetail,Rate
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

class DishSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dish
        fields = ['created_at', 'name', 'description','price','ingredients','chef','time_served','image']

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
class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id','name','quantity']
class RateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rate
        fields = ['id','user','dish','rating','comment','created_at']
