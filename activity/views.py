from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import csrf_protect
from .models import Post, PostImage, Hashtag, Comment
from accounts.models import User
from profiles.models import Profile
import json
import re
import time
import os
import subprocess
from django.conf import settings
from django.core.files.storage import default_storage
import uuid
import magic
from django.utils import timezone
from profiles.templatetags.custom_timesince import zero_timesince
from django.core.paginator import Paginator

VALID_FILE_TYPES = ['image/jpeg', 'image/png', 'video/mp4', 'video/webm']
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
MAX_FILES = 10

def delete_file_with_retries(file_path, max_attempts=3, delay=0.5):
    """Utility function to delete a file with retries."""
    file_deleted = False
    for attempt in range(max_attempts):
        try:
            print(f"Attempt {attempt + 1}: Deleting {file_path}")
            default_storage.delete(file_path)
            file_deleted = True
            break
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt < max_attempts - 1:
                time.sleep(delay)
    if not file_deleted:
        print(f"WARNING: Could not delete file {file_path}")
    return file_deleted

def generate_thumbnail_for_file(file):
    """Generate a thumbnail for a video file using ffmpeg."""
    video_filename = f'temp_{uuid.uuid4().hex}.mp4'
    thumbnail_filename = f'thumbnails/{uuid.uuid4().hex}.jpg'
    video_path = os.path.join(settings.MEDIA_ROOT, video_filename)
    thumbnail_path = os.path.join(settings.MEDIA_ROOT, thumbnail_filename)

    try:
        # Check if ffmpeg is installed
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True)
        if result.returncode != 0:
            print("FFmpeg not found or failed to execute")
            raise Exception("FFmpeg is not installed on the server")

        # Save video temporarily
        with default_storage.open(video_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        # Ensure the thumbnails directory exists
        os.makedirs(os.path.dirname(thumbnail_path), exist_ok=True)

        # Generate thumbnail with ffmpeg
        result = subprocess.run([
            'ffmpeg',
            '-i', video_path,
            '-ss', '1',
            '-frames:v', '1',
            '-update', '1',
            '-vf', 'scale=160:90',
            thumbnail_path
        ], capture_output=True, text=True, check=True)

        if not default_storage.exists(thumbnail_path):
            raise Exception("Thumbnail file was not created")

        thumbnail_url = f'{settings.MEDIA_URL}{thumbnail_filename}'
        return thumbnail_filename
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg error: {e.stderr}")
        raise Exception(f"FFmpeg failed: {e.stderr}")
    except Exception as e:
        print(f"Thumbnail generation error: {str(e)}")
        raise
    finally:
        if default_storage.exists(video_path):
            delete_file_with_retries(video_path)
        # if default_storage.exists(thumbnail_path):
        #     delete_file_with_retries(thumbnail_path)

@csrf_protect
@require_POST
def generate_thumbnail(request):
    """Generate a thumbnail for a video file via AJAX."""
    if not request.FILES.get('video'):
        return JsonResponse({'error': 'No video file provided'}, status=400)

    video_file = request.FILES['video']
    try:
        thumbnail_filename = generate_thumbnail_for_file(video_file)
        if not thumbnail_filename:
            return JsonResponse({'error': 'Failed to generate thumbnail'}, status=500)
        return JsonResponse({'thumbnail_url': f'{settings.MEDIA_URL}{thumbnail_filename}'})
    except Exception as e:
        print(f"Thumbnail generation failed for {video_file.name}: {str(e)}")
        return JsonResponse({'error': f"Failed to generate thumbnail: {str(e)}"}, status=500)
    
    
@csrf_protect
@require_POST
def delete_thumbnail(request):
    """Delete a thumbnail file via AJAX."""
    try:
        data = json.loads(request.body)
        thumbnail_path = data.get('thumbnail_path')
        if not thumbnail_path:
            return JsonResponse({'success': False, 'error': 'No thumbnail path provided'}, status=400)

        full_path = thumbnail_path  # Changed from os.path.join('thumbnails', thumbnail_path.lstrip('/'))
        if default_storage.exists(full_path):
            delete_file_with_retries(full_path)
            print(f"Deleted thumbnail: {full_path}")
            return JsonResponse({'success': True, 'message': 'Thumbnail deleted successfully'})
        else:
            print(f"Thumbnail not found: {full_path}")
            return JsonResponse({'success': False, 'error': 'Thumbnail file not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON body'}, status=400)
    except Exception as e:
        print(f"Error deleting thumbnail: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
    


@login_required
def publish_post(request):
    if request.method == 'POST':
        user = request.user
        caption = request.POST.get('caption', '').strip()
        category = request.POST.get('category', '')
        media_order = request.POST.get('media_order', '').split(',')

        if caption and len(caption) > 300:
            messages.error(request, "Caption cannot exceed 300 characters.")
            return render(request, 'activity/publish.html', {'caption': caption, 'category': category})

        new_files = request.FILES.getlist('media')
        if len(new_files) > MAX_FILES:
            messages.error(request, f"Cannot upload more than {MAX_FILES} files.")
            return render(request, 'activity/publish.html', {'caption': caption, 'category': category})

        mime = magic.Magic(mime=True)
        for file in new_files:
            file_type = mime.from_buffer(file.read(1024))
            file.seek(0)
            if file_type not in VALID_FILE_TYPES:
                messages.error(request, f"Unsupported file type for {file.name}.")
                return render(request, 'activity/publish.html', {'caption': caption, 'category': category})
            if file.size > MAX_FILE_SIZE:
                messages.error(request, f"File {file.name} is too large. Max size is 100MB.")
                return render(request, 'activity/publish.html', {'caption': caption, 'category': category})

        try:
            post = Post.objects.create(
                author=user,
                caption=caption,
                category=category if category else None
            )

            new_files_map = {f'new:{i}': file for i, file in enumerate(new_files)}
            for index, item in enumerate(media_order):
                if item.startswith('new:'):
                    file = new_files_map.get(item)
                    if file:
                        mime_type = mime.from_buffer(file.read(1024))
                        file.seek(0)
                        thumbnail = None
                        preview_key = f'thumbnail_for_new_{index}'
                        thumbnail = None

                        if mime_type.startswith('video/'):
                            # 1) first see if the JS already POSTed us one
                            preview_thumb = request.POST.get(preview_key)
                            if preview_thumb:
                                thumbnail = preview_thumb
                            else:
                                # 2) otherwise generate one (only once)
                                thumbnail = generate_thumbnail_for_file(file)
                                if not thumbnail:
                                    raise Exception(f"Failed to generate thumbnail for {file.name}")

                        PostImage.objects.create(
                            post=post,
                            file=file,
                            thumbnail=thumbnail,
                            alt_text=f"Image {index + 1}",
                            order=index
                        )

            hashtags = []
            if caption:
                hashtag_pattern = r'#(\w+)'
                hashtags = re.findall(hashtag_pattern, caption)
            if category:
                hashtags.append(category.lower())
            for hashtag_name in hashtags:
                hashtag, created = Hashtag.objects.get_or_create(name=hashtag_name.lower())
                post.hashtags.add(hashtag)

            messages.success(request, "Post published successfully!")
            try:
                profile = Profile.objects.get(user=user)
                return redirect('profiles:profile_detail', slug=profile.slug)
            except Profile.DoesNotExist:
                messages.error(request, "Profile not found for this user.")
                return redirect('home')

        except Exception as e:
            messages.error(request, f"An error occurred while publishing your post: {str(e)}")
            if 'post' in locals():
                post.delete()
            return render(request, 'activity/publish.html', {'caption': caption, 'category': category})

    return render(request, 'activity/publish.html')

@login_required
def edit_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    if post.author != request.user:
        messages.error(request, "You don't have permission to edit this post.")
        return redirect('home')

    if request.method == 'POST':
        caption = request.POST.get('caption', '').strip()
        category = request.POST.get('category', '')
        removed_media = request.POST.get('removed_media', '')
        media_order = request.POST.get('media_order', '').split(',')
        new_files = request.FILES.getlist('media')

        print(f"POST Data: caption={caption}, category={category}")
        print(f"Removed Media: {removed_media}")
        print(f"Media Order: {media_order}")
        print(f"New Files: {[f.name for f in new_files]}")
        print(f"Thumbnail Keys: {[key for key in request.POST if key.startswith('thumbnail_for_new_')]}")

        if caption and len(caption) > 300:
            messages.error(request, "Caption cannot exceed 300 characters.")
            context = {
                'post': post,
                'is_edit_mode': True,
                'existing_media': post.images.all().order_by('order'),
                'caption': caption,
                'category': category
            }
            return render(request, 'activity/publish.html', context)

        removed_ids = [int(id.strip()) for id in removed_media.split(',') if id.strip().isdigit()]
        existing_count = post.images.count() - len(removed_ids)
        if len(new_files) + existing_count > MAX_FILES:
            messages.error(request, f"Total media cannot exceed {MAX_FILES} files.")
            context = {
                'post': post,
                'is_edit_mode': True,
                'existing_media': post.images.all().order_by('order'),
                'caption': caption,
                'category': category
            }
            return render(request, 'activity/publish.html', context)

        mime = magic.Magic(mime=True)
        for file in new_files:
            file_type = mime.from_buffer(file.read(1024))
            file.seek(0)
            if file_type not in VALID_FILE_TYPES:
                messages.error(request, f"Unsupported file type for {file.name}.")
                context = {
                    'post': post,
                    'is_edit_mode': True,
                    'existing_media': post.images.all().order_by('order'),
                    'caption': caption,
                    'category': category
                }
                return render(request, 'activity/publish.html', context)
            if file.size > MAX_FILE_SIZE:
                messages.error(request, f"File {file.name} is too large. Max size is 100MB.")
                context = {
                    'post': post,
                    'is_edit_mode': True,
                    'existing_media': post.images.all().order_by('order'),
                    'caption': caption,
                    'category': category
                }
                return render(request, 'activity/publish.html', context)

        try:
            if removed_media:
                for media_id in removed_ids:
                    try:
                        media_obj = PostImage.objects.get(id=media_id, post=post)
                        if media_obj.file:
                            delete_file_with_retries(media_obj.file.name)
                        if media_obj.thumbnail:
                            delete_file_with_retries(media_obj.thumbnail.name)
                        media_obj.delete()
                    except PostImage.DoesNotExist:
                        pass

            post.caption = caption
            post.category = category if category else None
            post.save()

            new_files_map = {f'new:{i}': file for i, file in enumerate(new_files)}
            existing_media = PostImage.objects.filter(post=post)
            existing_media_map = {f'existing:{media.id}': media for media in existing_media}
            final_media_list = []
            for index, item in enumerate(media_order):
                print(f"Processing media_order item: {item}")
                if item.startswith('existing:'):
                    media = existing_media_map.get(item)
                    print(f"Existing media: {media.id if media else 'Not found'}")
                    if media:
                        final_media_list.append(media)
                elif item.startswith('new:'):
                    file = new_files_map.get(item)
                    print(f"New file: {file.name if file else 'Not found'}")
                    if file:
                        mime_type = mime.from_buffer(file.read(1024))
                        file.seek(0)
                        thumbnail = None
                        new_index = int(item.split(':')[1])  # Extract index from 'new:X'
                        preview_key = f'thumbnail_for_new_{new_index}'
                        print(f"Looking for thumbnail: {preview_key}")
                        thumbnail = request.POST.get(preview_key)
                        if mime_type.startswith('video/') and not thumbnail:
                            print(f"No thumbnail found for {file.name}, generating new one")
                            try:
                                thumbnail = generate_thumbnail_for_file(file)
                                if not thumbnail:
                                    raise Exception(f"Failed to generate thumbnail for {file.name}")
                            except Exception as e:
                                print(f"Thumbnail generation error for {file.name}: {str(e)}")
                                raise
                        new_media = PostImage.objects.create(
                            post=post,
                            file=file,
                            thumbnail=thumbnail,
                            alt_text=f"Image {len(final_media_list) + 1}",
                            order=index
                        )
                        final_media_list.append(new_media)

            for index, media in enumerate(final_media_list):
                media.order = index
                media.save()

            post.hashtags.clear()
            hashtags = []
            if caption:
                hashtag_pattern = r'#(\w+)'
                hashtags = re.findall(hashtag_pattern, caption)
            if category:
                hashtags.append(category.lower())
            for hashtag_name in hashtags:
                hashtag, created = Hashtag.objects.get_or_create(name=hashtag_name.lower())
                post.hashtags.add(hashtag)

            messages.success(request, "Post updated successfully!")
            try:
                profile = Profile.objects.get(user=request.user)
                return redirect('profiles:profile_detail', slug=profile.slug)
            except Profile.DoesNotExist:
                messages.error(request, "Profile not found for this user.")
                return redirect('home')

        except Exception as e:
            import traceback
            print(f"Error in edit_post: {str(e)}")
            print(traceback.format_exc())
            messages.error(request, f"An error occurred while updating your post: {str(e)}. Please check your files and try again.")
            context = {
                'post': post,
                'is_edit_mode': True,
                'existing_media': post.images.all().order_by('order'),
                'caption': caption,
                'category': category
            }
            return render(request, 'activity/publish.html', context)

    context = {
        'post': post,
        'is_edit_mode': True,
        'existing_media': post.images.all().order_by('order')
    }
    return render(request, 'activity/publish.html', context)
@login_required
@require_POST
def delete_post(request, post_id):
    try:
        post = get_object_or_404(Post, id=post_id)
        if post.author != request.user:
            return JsonResponse({'success': False, 'error': 'Permission denied'}, status=403)

        print(f"Deleting post {post_id} with {post.images.count()} media files")

        for image in post.images.all():
            if image.file:
                delete_file_with_retries(image.file.name)
            if image.thumbnail:
                delete_file_with_retries(image.thumbnail.name)
            image.delete()

        post.delete()
        return JsonResponse({'success': True, 'message': 'Post deleted successfully'})
    except Exception as e:
        print(f"Delete error: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
def get_posts(request, slug):
    profile = get_object_or_404(Profile, slug=slug)
    page = int(request.GET.get('page', 1))
    posts_per_page = 2  # Load 2 posts per "View More" click
    posts = Post.objects.filter(author=profile.user).select_related('author__profile').prefetch_related('images').order_by('-created_at')
    paginator = Paginator(posts, posts_per_page)

    try:
        page_obj = paginator.page(page)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e), 'has_next': False}, status=400)

    posts_data = [
        {
            'id': post.id,
            'author_name': post.author.first_name or post.author.username,
            'author_slug': post.author.profile.slug if post.author.profile else post.author.username,
            'author_profile_picture': post.author.profile.profile_picture.url if post.author.profile and post.author.profile.profile_picture else '/static/images/default-user.png',
            'content': post.caption,
            'category': post.category,
            'hashtags': [hashtag.name for hashtag in post.hashtags.all()],
            'created_at': zero_timesince(post.created_at),
            'created_at_iso': post.created_at.isoformat(),
            'media': [
                {
                    'type': 'image' if media.file.name.lower().endswith(('.jpg', '.png', '.jpeg')) else 'video',
                    'url': media.file.url,
                    'alt_text': media.alt_text
                } for media in post.images.all()
            ],
            'liked': request.user in post.likes.all() if request.user.is_authenticated else False,
            'total_likes': post.likes.count(),
            'comment_count': post.comments.count()
        }
        for post in page_obj
    ]

    return JsonResponse({
        'success': True,
        'posts': posts_data,
        'has_next': page_obj.has_next()
    })


@login_required
@require_GET
def get_comments(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    comments = post.comments.all().select_related('author__profile', 'parent_comment__author').order_by('created_at')

    comments_data = [
        {
            'id': comment.id,
            'author_name': comment.author.first_name or comment.author.username,
            'author_profile_picture': comment.author.profile.profile_picture.url if hasattr(comment.author, 'profile') and comment.author.profile.profile_picture else None,
            'text': comment.text,
            'created_at': zero_timesince(comment.created_at),
            'created_at_iso': comment.created_at.isoformat(),
            'parent_comment': comment.parent_comment.id if comment.parent_comment else None,
            'parent_author_name': comment.parent_comment.author.first_name or comment.parent_comment.author.username if comment.parent_comment else None,
            'parent_author_slug': comment.parent_comment.author.profile.slug if comment.parent_comment and hasattr(comment.parent_comment.author, 'profile') else None,
            'depth': comment.depth,  # Use stored depth
            'liked': request.user in comment.likes.all() if request.user.is_authenticated else False,
            'total_likes': comment.likes.count()
        }
        for comment in comments
    ]
    return JsonResponse({'comments': comments_data})

@login_required
@require_POST
def toggle_comment_like(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id)
    user = request.user

    if user in comment.likes.all():
        comment.likes.remove(user)
        liked = False
    else:
        comment.likes.add(user)
        liked = True

    return JsonResponse({
        'success': True,
        'liked': liked,
        'total_likes': comment.likes.count()
    })

@login_required
@require_POST
def add_comment(request, post_id):
    try:
        data = json.loads(request.body)
        text = data.get('text', '').strip()
        parent_comment_id = data.get('parent_comment_id')
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON body'}, status=400)

    if not text:
        return JsonResponse({'success': False, 'error': 'Comment text is required'}, status=400)

    try:
        post = get_object_or_404(Post, id=post_id)
        parent_comment = None
        depth = 0
        if parent_comment_id:
            parent_comment = get_object_or_404(Comment, id=parent_comment_id)
            if parent_comment.post != post:
                return JsonResponse({'success': False, 'error': 'Parent comment does not belong to this post'}, status=400)
            depth = parent_comment.depth + 1  # Set depth based on parent

        comment = Comment.objects.create(
            post=post,
            author=request.user,
            text=text,
            parent_comment=parent_comment,
            depth=depth  # Store depth
        )

        comment_data = {
            'id': comment.id,
            'author_name': comment.author.first_name or comment.author.username,
            'author_profile_picture': comment.author.profile.profile_picture.url if hasattr(comment.author, 'profile') and comment.author.profile.profile_picture else None,
            'text': comment.text,
            'created_at': zero_timesince(comment.created_at),
            'created_at_iso': comment.created_at.isoformat(),
            'parent_comment': comment.parent_comment.id if comment.parent_comment else None,
            'parent_author_name': comment.parent_comment.author.first_name or comment.parent_comment.author.username if comment.parent_comment else None,
            'parent_author_slug': comment.parent_comment.author.profile.slug if comment.parent_comment and hasattr(comment.parent_comment.author, 'profile') else None,
            'depth': comment.depth,  # Include depth in response
            'liked': False,  # New comment, not liked yet
            'total_likes': 0  # New comment, no likes
        }

        return JsonResponse({'success': True, 'comment': comment_data})

    except Post.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Post not found'}, status=404)
    except Comment.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Parent comment not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    

@login_required
@require_POST
def toggle_like(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    user = request.user

    try:
        if user in post.likes.all():
            post.likes.remove(user)
            liked = False
        else:
            post.likes.add(user)
            liked = True

        return JsonResponse({
            'success': True,
            'liked': liked,
            'total_likes': post.likes.count()
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)