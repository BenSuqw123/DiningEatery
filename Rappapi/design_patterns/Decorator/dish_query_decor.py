# design_patterns/Decorator/dish_query.py

class DishQueryDecorator:
    def __init__(self, queryset):
        self._queryset = queryset

    def apply(self):
        return self._queryset


class SearchDecorator(DishQueryDecorator):
    def __init__(self, queryset, q):
        super().__init__(queryset)
        self._q = q

    def apply(self):
        if self._q:
            return self._queryset.filter(name__icontains=self._q)
        return self._queryset


class CategoryDecorator(DishQueryDecorator):
    def __init__(self, queryset, cate_id):
        super().__init__(queryset)
        self._cate_id = cate_id

    def apply(self):
        if self._cate_id:
            return self._queryset.filter(category_id=self._cate_id)
        return self._queryset


class ChefNameDecorator(DishQueryDecorator):
    def __init__(self, queryset, chef_name):
        super().__init__(queryset)
        self._chef_name = chef_name

    def apply(self):
        if self._chef_name:
            q_first = self._queryset.filter(chefs__first_name__icontains=self._chef_name)
            q_last  = self._queryset.filter(chefs__last_name__icontains=self._chef_name)
            return (q_first | q_last).distinct()
        return self._queryset


class MaxPriceDecorator(DishQueryDecorator):
    def __init__(self, queryset, price):
        super().__init__(queryset)
        self._price = price

    def apply(self):
        if self._price:
            return self._queryset.filter(price__lte=self._price)
        return self._queryset


class MaxTimeDecorator(DishQueryDecorator):
    def __init__(self, queryset, time_served):
        super().__init__(queryset)
        self._time_served = time_served

    def apply(self):
        if self._time_served:
            return self._queryset.filter(time_served__lte=self._time_served)
        return self._queryset


class OrderByNameDecorator(DishQueryDecorator):
    def __init__(self, queryset, desc=False):
        super().__init__(queryset)
        self._desc = desc

    def apply(self):
        return self._queryset.order_by('-name' if self._desc else 'name')


class OrderByPriceDecorator(DishQueryDecorator):
    def __init__(self, queryset, desc=False):
        super().__init__(queryset)
        self._desc = desc

    def apply(self):
        return self._queryset.order_by('-price' if self._desc else 'price')


class OrderByRatingDecorator(DishQueryDecorator):
    def __init__(self, queryset, desc=False):
        super().__init__(queryset)
        self._desc = desc

    def apply(self):
        from django.db.models import Avg
        return self._queryset.annotate(
            avg_rating=Avg('ratings__rating')
        ).order_by('avg_rating' if self._desc else '-avg_rating')

class IngredientDecorator(DishQueryDecorator):
    def __init__(self, queryset, ingre_name):
        super().__init__(queryset)
        self._ingre_name = ingre_name

    def apply(self):
        if self._ingre_name:
            return self._queryset.filter(ingredient__name__icontains=self._ingre_name)
        return self._queryset