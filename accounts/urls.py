from django.urls import path, include
from . import views

urlpatterns = [
       path('', views.signlog_page, name='signlog'),
       path('login/', views.login_view, name='login'),
       path('register/', views.register_view, name='register'),
       path('logout/', views.logout_view, name='logout'),
       path('login-error/', views.login_error, name='login_error'),
   ]