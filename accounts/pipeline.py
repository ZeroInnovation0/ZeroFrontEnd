from django.shortcuts import redirect
from django.contrib import messages
from django.urls import reverse
from django.contrib.auth import get_user_model
from social_core.pipeline.user import get_username

User = get_user_model()

def prevent_social_login_if_email_exists(strategy, backend, user, is_new=False, *args, **kwargs):
    """
    Blocks social login (e.g., Google) if the email is already registered
    with a non-social account.
    """
    if user and not is_new and backend.name == 'google-oauth2':
        messages.error(
            strategy.request,
            "This email address is already registered. Please use your email and password to log in instead of Google.",
            extra_tags='google_toast'
        )
        return redirect(reverse('accounts:login'))

    return {'user': user}

def save_user_details(strategy, details, user=None, is_new=False, *args, **kwargs):
    """
    Custom pipeline to save or update user details in the custom User model.
    Runs after social auth authentication.
    """
    if user:
        # User already exists, update fields if needed
        updated = False
        
        # Set user_type to 'explorer' if not set
        if not user.user_type:
            user.user_type = 'individual'
            updated = True
        
        # Update fields from Google response if available
        if 'email' in details and not user.email:
            user.email = details['email']
            updated = True
        
        if 'first_name' in details and not user.first_name:
            user.first_name = details['first_name']
            updated = True
        
        if 'last_name' in details and not user.last_name:
            user.last_name = details['last_name']
            updated = True
        
        # Ensure company_name is empty for explorer
        if user.user_type == 'individual' and user.company_name:
            user.company_name = ''
            updated = True
        
        if updated:
            user.save()
    else:
        # Create new user
        email = details.get('email', '')
        if not email:
            return
        
        username = get_username(strategy, details, user=user)
        
        user = User.objects.create_user(
            username=email,
            email=email,
            password=None,  # No password for social auth users
            user_type='individual',
            first_name=details.get('first_name', ''),
            last_name=details.get('last_name', ''),
            company_name='',
        )
        user.save()
    
    return {'user': user}