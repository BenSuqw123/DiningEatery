from Rappapi.models import Dish, Ingredient, IngredientDish, Category

class DishBuilder:
    def __init__(self, name: str, description: str, price, image, time_served, category_id):
        if not name:
            raise ValueError("name là bắt buộc.")
        if not description:
            raise ValueError("description là bắt buộc.")
        if price is None:
            raise ValueError("price là bắt buộc.")
        if not image:
            raise ValueError("image là bắt buộc.")
        if time_served is None:
            raise ValueError("time_served là bắt buộc.")
        if category_id is None:
            raise ValueError("category_id là bắt buộc.")

        try:
            category = Category.objects.get(pk=category_id)
        except Category.DoesNotExist:
            raise ValueError(f"Category id={category_id} không tồn tại.")

        self._name = name
        self._description = description
        self._price = price
        self._image = image
        self._time_served = int(time_served)
        self._category = category
        self._chefs = []
        self._ingredients = []

    def set_chefs(self, chef_users: list):
        self._chefs = chef_users
        return self

    def set_ingredients(self, ingredients: list):
        self._ingredients = ingredients or []
        return self

    def build(self) -> Dish:
        dish = Dish.objects.create(name=self._name, description=self._description, price=self._price, image=self._image, time_served=self._time_served, category=self._category)

        if self._chefs:
            dish.chefs.set(self._chefs)

        for item in self._ingredients:
            ingredient = Ingredient.objects.get(pk=item['ingredient_id'])
            IngredientDish.objects.create(dish=dish, ingredient=ingredient, quantity=item.get('quantity', ''),)

        return dish