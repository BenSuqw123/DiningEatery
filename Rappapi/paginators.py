from rest_framework import pagination

class ItemPaginator(pagination.PageNumberPagination):
    page_size = 2

class DishPaginator(pagination.PageNumberPagination):
    page_size = 20

class RatePaginator(pagination.PageNumberPagination):
    page_size = 10

class InvoicePaginator(pagination.PageNumberPagination):
    page_size = 2