from django.urls import path
from . import views

urlpatterns = [
    path('', views.temp_home_page, name='temp'),
]