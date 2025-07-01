from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404
from accounts.models import User
from .models import Profile, GalleryImage, Fact, Contribution
from django.contrib import messages # Import the messages framework
from django.http import HttpResponseForbidden, HttpResponse
from django.views.decorators.http import require_POST
from .forms import FactForm
import os, re
from activity.models import Post, PostImage
from django.db.models import Prefetch
from django.core.paginator import Paginator


@login_required
def profile_page(request):
    return render(request, 'profiles/profile.html')

@login_required
def profile_detail(request, slug):
    profile = get_object_or_404(Profile, slug=slug)
    is_owner = request.user.is_authenticated and request.user == profile.user

    # Select the template based on the user_type
    user_type = profile.user.user_type
    if user_type == 'investor':
        template_name = 'profiles/investor_profile.html'
    elif user_type == 'entrepreneur':
        template_name = 'profiles/entrepreneur_profile.html'
    elif user_type == 'explorer':
        template_name = 'profiles/explorer_profile.html'
    else:
        template_name = 'profiles/base_profile.html'  # Fallback

    # Fetch posts with images ordered by 'order' field
    # posts = Post.objects.filter(author=profile.user).prefetch_related(
    #     Prefetch('images', queryset=PostImage.objects.all().order_by('order'))
    # ).order_by('-created_at')

    # Fetch initial 4 posts
    posts = Post.objects.filter(author=profile.user).select_related('author__profile').prefetch_related('images').order_by('-created_at')
    paginator = Paginator(posts, 4)  # Initial 4 posts
    page_obj = paginator.page(1)
    posts = page_obj.object_list
    has_next = page_obj.has_next()

    profile_picture_url = (
        profile.profile_picture.url
        if profile.profile_picture
        else '/static/images/default-user.png'
    )

    context = {
        'profile': profile,
        'is_owner': is_owner,
        'form': FactForm(),
        'posts': posts,
        'has_next': has_next,
        'profile_picture_url': profile_picture_url,
    }

    return render(request, template_name, context)


@login_required
def profile_milestones(request, slug):
    # 1. Fetch the profile (404 if missing)
    profile = get_object_or_404(Profile, slug=slug)

    # 2. Grab all experiences and educations for this profile.
    #    (We’ll refine ordering by “latest updated” once we add timestamps.)
    experiences = profile.experiences.all().order_by('-updated_at')
    educations  = profile.educations.all().order_by('-updated_at')

    return render(request,
                  'profiles/profile_milestones.html',
                  {
                    'profile': profile,
                    'experiences': experiences,
                    'educations': educations,
                  })


def update_picture(request, slug):
    profile = get_object_or_404(Profile, slug=slug)

    if request.user != profile.user:
        messages.error(request, "You do not have permission to update this profile.")
        return redirect('profiles:profile_detail', slug=slug)

    if request.method == 'POST' and request.FILES.get('profile_picture'):
        profile.profile_picture = request.FILES['profile_picture']
        profile.save()
        messages.success(request, "Profile picture updated successfully!")
    else:
        messages.error(request, "No file was selected for upload or an error occurred.")

    return redirect('profiles:profile_detail', slug=slug)
from django.shortcuts import redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Profile
@login_required
def update_story(request, slug):
    profile = get_object_or_404(Profile, slug=slug)

    if request.user != profile.user:
        return HttpResponseForbidden()

    if request.method == 'POST':
        profile.story = request.POST.get('story')
        profile.position = request.POST.get('position')
        profile.description = request.POST.get('description')
        profile.save()
        return redirect('profiles:profile_detail', slug=slug)

    return HttpResponse(status=405)

@login_required
def update_video(request, slug):
    profile = get_object_or_404(Profile, slug=slug, user=request.user)
    
    if request.method == 'POST':
        if 'video' in request.FILES:
            profile.video = request.FILES['video']
        if 'video_thumbnail' in request.FILES:
            profile.video_thumbnail = request.FILES['video_thumbnail']
        profile.save()
    
    return redirect('profiles:profile_detail', slug=slug)

@login_required
def delete_video(request, slug):
    profile = get_object_or_404(Profile, slug=slug)

    if request.user != profile.user:
        return HttpResponseForbidden()

    if request.method == 'POST':
        if profile.video:
            profile.video.delete(save=False)
        if profile.video_thumbnail:
            profile.video_thumbnail.delete(save=False)

        profile.video = None
        profile.video_thumbnail = None
        profile.save()
        messages.success(request, "Video deleted successfully!")

    return redirect('profiles:profile_detail', slug=slug)
import os # Still needed for os.path.basename, but maybe less critical with original_filename
# import re # No longer needed for normalize_filename_backend if you remove that function
from django.shortcuts import get_object_or_404, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
# from .models import Profile, GalleryImage # Ensure you import GalleryImage

MAX_IMAGES = 5 # Keep this constant

# Remove the normalize_filename_backend function, it's not needed with this approach.
# def normalize_filename_backend(filename):
#     # ... this function is now removed
#     pass


@login_required
def update_gallery(request, slug):
    profile = get_object_or_404(Profile, slug=slug, user=request.user)

    if request.method == 'POST':
        # Step 1: Handle deletions FIRST
        deleted_ids_str = request.POST.get('deleted_image_ids', '')
        if deleted_ids_str:
            try:
                deleted_ids = [int(i) for i in deleted_ids_str.split(',') if i.strip().isdigit()]
                
                if deleted_ids:
                    images_to_delete = profile.gallery_images.filter(id__in=deleted_ids)
                    if images_to_delete.exists():
                        for img in images_to_delete:
                            if img.image:
                                img.image.delete(save=False)
                            img.delete()
                        messages.success(request, f"Successfully removed {images_to_delete.count()} image(s) from your gallery.")
            except ValueError:
                messages.error(request, "Invalid image deletion request.")
            except Exception as e:
                messages.error(request, f"Error during image deletion: {str(e)}")
        
        # Step 2: Handle new uploads
        uploaded_images = request.FILES.getlist('gallery_images')
        
        # Collect *current* existing original filenames from the database for deduplication
        # This set must be built *after* deletions are processed.
        existing_original_filenames_set = set()
        for img_obj in profile.gallery_images.all():
            if img_obj.original_filename:
                existing_original_filenames_set.add(img_obj.original_filename.lower())

        added_count = 0
        duplicates_skipped = []
        limit_exceeded_skipped = []
        upload_errors = []

        if uploaded_images:
            # Get the count of images *after* any deletions and *before* new additions
            current_image_count = profile.gallery_images.count() 
            
            for image_file in uploaded_images:
                incoming_original_name = image_file.name # Get the exact name from the upload
                
                # Check for duplication (case-insensitive) against original_filename
                if incoming_original_name.lower() in existing_original_filenames_set:
                    duplicates_skipped.append(incoming_original_name)
                    continue 

                # Then, check against the MAX_IMAGES limit
                if current_image_count >= MAX_IMAGES:
                    limit_exceeded_skipped.append(incoming_original_name)
                    continue 

                try:
                    # Create the new GalleryImage, storing the original filename
                    profile.gallery_images.create(
                        image=image_file,
                        original_filename=incoming_original_name # Save the original name
                    )
                    existing_original_filenames_set.add(incoming_original_name.lower()) # Add to set for this batch
                    added_count += 1
                    current_image_count += 1 
                except Exception as e:
                    upload_errors.append(f"'{incoming_original_name}': {str(e)}")
            
            # --- Provide comprehensive feedback messages ---
            if added_count > 0:
                messages.success(request, f"Successfully added {added_count} new image(s) to your gallery.")
            
            if duplicates_skipped:
                messages.info(request, f"Skipped {len(duplicates_skipped)} image(s) already in your gallery: {', '.join(duplicates_skipped)}.")
            
            if limit_exceeded_skipped:
                messages.warning(request, f"Skipped {len(limit_exceeded_skipped)} image(s) because they would exceed the maximum of {MAX_IMAGES} images: {', '.join(limit_exceeded_skipped)}.")

            if upload_errors:
                messages.error(request, "Some images could not be uploaded: " + "; ".join(upload_errors))
            
            # If no new images were uploaded AND no existing images were deleted
            elif not deleted_ids_str:
                messages.info(request, "No new images were uploaded and no existing images were deleted.")

        return redirect('profiles:profile_detail', slug=slug)

@login_required
def delete_photo(request, image_id):
    # Find the photo object by ID
    photo = get_object_or_404(GalleryImage, id=image_id)

    # Check if the user owns the profile related to this photo
    if photo.profile.user != request.user:
        return HttpResponseForbidden("You don't have permission to delete this photo.")

    if request.method == 'POST':
        # Delete the file and the record
        photo.image.delete(save=False)  # deletes the file
        photo.delete()  # deletes the DB record
        return redirect('profiles:profile_detail', slug=photo.profile.slug)

    # For GET request, optionally render a confirmation page or just redirect
    return redirect('profiles:profile_detail', slug=photo.profile.slug)

@login_required
@require_POST
def update_facts(request, slug):
    profile = get_object_or_404(Profile, slug=slug)

    if request.user != profile.user:
        return HttpResponseForbidden()

    for fact in profile.facts.all():
        new_answer = request.POST.get(f"fact_{fact.id}")
        if new_answer is not None:
            fact.answer = new_answer
            fact.save()

    return redirect('profiles:profile_detail', slug=slug)

@login_required
def update_contributions(request, slug):
    profile = get_object_or_404(Profile, slug=slug)

    if request.user != profile.user:
        return HttpResponseForbidden()

    if request.method == 'POST':
        for contrib in profile.contributions.all():
            new_description = request.POST.get(f"contrib_{contrib.id}")
            if new_description is not None:
                contrib.description = new_description
                contrib.save()

        return redirect('profiles:profile_detail', slug=slug)

    return HttpResponse(status=405)

@login_required
def manage_facts(request, slug):
    profile = get_object_or_404(Profile, slug=slug)

    if request.user != profile.user:
        return HttpResponseForbidden()

    if request.method == "POST":
        form = FactForm(request.POST)
        if form.is_valid() and profile.facts.count() < 4:
            new_fact = form.save(commit=False)
            new_fact.profile = profile
            new_fact.save()
            return redirect('profiles:profile_detail', slug=slug)
        else:
            messages.error(request, "Fact could not be added. Make sure the form is valid and you haven't exceeded 4 facts.")
            return redirect('profiles:profile_detail', slug=slug)

    return HttpResponseForbidden()


@login_required
def edit_fact(request, fact_id):
    fact = get_object_or_404(Fact, id=fact_id, profile=request.user.profile)

    if request.method == "POST":
        form = FactForm(request.POST, instance=fact)
        if form.is_valid():
            form.save()
    return redirect('profiles:profile_detail', slug=fact.profile.slug)

@login_required
def delete_fact(request, fact_id):
    fact = get_object_or_404(Fact, id=fact_id, profile=request.user.profile)
    if request.method == "POST":
        profile_slug = fact.profile.slug
        fact.delete()
    return redirect('profiles:profile_detail', slug=profile_slug)

@login_required
def add_contribution(request, slug):
    profile = get_object_or_404(Profile, slug=slug)

    if request.user != profile.user:
        return HttpResponseForbidden()

    if request.method == "POST":
        if profile.contributions.count() >= 9:
            messages.error(request, "You can only add up to 9 contributions.")
            return redirect('profiles:profile_detail', slug=slug)

        title = request.POST.get("title", "").strip()
        description = request.POST.get("description", "").strip()

        if title and description:
            Contribution.objects.create(profile=profile, title=title, description=description)
            messages.success(request, "Contribution added successfully!")
        else:
            messages.error(request, "Both title and description are required.")

    return redirect('profiles:profile_detail', slug=slug)


@login_required
def edit_contribution(request, contribution_id):
    contribution = get_object_or_404(Contribution, id=contribution_id)

    if request.user != contribution.profile.user:
        return HttpResponseForbidden()

    if request.method == "POST":
        title = request.POST.get("title", "").strip()
        description = request.POST.get("description", "").strip()

        if title and description:
            contribution.title = title
            contribution.description = description
            contribution.save()
            messages.success(request, "Contribution updated.")
        else:
            messages.error(request, "Title and description cannot be empty.")

    return redirect('profiles:profile_detail', slug=contribution.profile.slug)


@login_required
def delete_contribution(request, contribution_id):
    contribution = get_object_or_404(Contribution, id=contribution_id)

    if request.user != contribution.profile.user:
        return HttpResponseForbidden()

    if request.method == "POST":
        profile_slug = contribution.profile.slug
        contribution.delete()
        messages.success(request, "Contribution deleted.")
        return redirect('profiles:profile_detail', slug=profile_slug)

    return redirect('profiles:profile_detail', slug=contribution.profile.slug)