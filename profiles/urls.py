from django.urls import path, include
from . import views
from .views import profile_detail

app_name = 'profiles'

urlpatterns = [
    path('<slug:slug>/', views.profile_detail, name='profile_detail'),
    path('<slug:slug>/milestones/', views.profile_milestones, name='profile_milestones'),
    path('<slug:slug>/update-picture/', views.update_picture, name='update_picture'),
    path('delete-photo/<int:image_id>/', views.delete_photo, name='delete_photo'),
    path('<slug:slug>/update-story/', views.update_story, name='update_story'),
    path('<slug:slug>/update-video/', views.update_video, name='update_video'),
    path('<slug:slug>/delete-video/', views.delete_video, name='delete_video'),
    path('<slug:slug>/update-gallery/', views.update_gallery, name='update_gallery'),
    path('<slug:slug>/update-facts/', views.update_facts, name='update_facts'),
    path('<slug:slug>/update-contributions/', views.update_contributions, name='update_contributions'),
    path('<slug:slug>/facts/add/', views.manage_facts, name='manage_facts'),
    path('facts/<int:fact_id>/edit/', views.edit_fact, name='edit_fact'),
    path('facts/<int:fact_id>/delete/', views.delete_fact, name='delete_fact'),
    path('contributions/<int:contribution_id>/edit/', views.edit_contribution, name='edit_contribution'),
    path('contributions/<int:contribution_id>/delete/', views.delete_contribution, name='delete_contribution'),
    path('<slug:slug>/contributions/add/', views.add_contribution, name='add_contribution'),
]