from django.urls import path
from . import views

urlpatterns = [
    path('', views.landing_page, name='landing'),
    path('SignUpLogin/ZeroSL/', views.zero_auth_view, name='zero_auth'),
]