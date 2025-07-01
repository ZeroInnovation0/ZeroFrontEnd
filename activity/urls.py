# activity/urls.py
from django.urls import path
from . import views



urlpatterns = [
    path('publish/', views.publish_post, name='publish'),
    path('posts/<int:post_id>/edit/', views.edit_post, name='edit_post'),
    path('posts/<int:post_id>/delete/', views.delete_post, name='delete_post'),
    path('posts/<slug:slug>/', views.get_posts, name='get_posts'),
    path('comments/<int:post_id>/', views.get_comments, name='get_comments'),
    path('comments/<int:comment_id>/toggle-like/', views.toggle_comment_like, name='toggle_comment_like'),
    path('posts/<int:post_id>/toggle-like/', views.toggle_like, name='toggle_like'),
    path('add_comment/<int:post_id>/', views.add_comment, name='add_comment'),
    path('generate-thumbnail/', views.generate_thumbnail, name='generate_thumbnail'),
    path('delete-thumbnail/', views.delete_thumbnail, name='delete_thumbnail'),
]