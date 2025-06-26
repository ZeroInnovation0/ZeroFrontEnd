from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
# from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages
import re
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.urls import reverse
from social_django.models import UserSocialAuth


def signlog_page(request):
    if request.user.is_authenticated:
        return redirect('home')
    return render(request, 'accounts/zeroSL.html', {'show_login_panel': True})

def select_user_type_view(request):
    if request.user.is_authenticated:
        # Redirect logged in users to home or dashboard
        return redirect('home')  # replace 'home' with your actual home URL name
    return render(request, 'accounts/select_user_type.html')

def login_view(request):
    if request.user.is_authenticated: # Essential for login pages too
        return redirect('home')
    
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')
        remember_me = request.POST.get('remember_me')

        # --- NEW LOGIC TO CHECK FOR GOOGLE-ASSOCIATED ACCOUNT ---
        # 1. Try to find a user with this email
        try:
            # Use filter().first() instead of get() to avoid DoesNotExist error
            # and to handle cases where email might not be unique (though it should be for username=email strategy)
            user_by_email = User.objects.filter(email__iexact=email).first() # Use iexact for case-insensitive email match
        except User.DoesNotExist:
            user_by_email = None # Should not happen with .first() but good practice

        if user_by_email:
            # 2. Check if this user has any social authentication entries for Google
            # 'google-oauth2' is the provider name for Google in social_django
            is_google_linked = user_by_email.social_auth.filter(provider='google-oauth2').exists()

            if is_google_linked:
                # 3. If it's a Google-linked account, show the specific error message
                messages.error(
                    request,
                    "This email is associated with a Google account. Please sign in with google.",
                    extra_tags='login_error google_toast' # Added 'google_toast' tag for specific handling
                )
                # Store data to prefill form if needed
                request.session['login_form_data'] = {'login_email': email}
                request.session['remember_me'] = (remember_me == 'on')
                return redirect('accounts:login') # Redirect back to the login page to display the message
        # --- END NEW LOGIC ---



        user = authenticate(request, username=email, password=password)
        if user is not None:
            login(request, user)
            if remember_me:
                request.session.set_expiry(1209600)
            else:
                request.session.set_expiry(0)
            return redirect('home')
        else:
            request.session['login_form_data'] = {'login_email': email}
            request.session['remember_me'] = (remember_me == 'on')
            # request.session['show_login'] = True
            messages.error(request, "*Invalid email or password.", extra_tags='login_error')
            return redirect('accounts:login')  # redirect to same view on GET

    # GET method: show login/register page
    context = request.session.pop('login_form_data', {})
    # context['show_login'] = request.session.pop('show_login', False)
    context['remember_me'] = request.session.pop('remember_me', False)

    for message in messages.get_messages(request):
        if message.extra_tags == 'login_error':
            context['login_error'] = str(message)
        elif 'google_toast' in message.extra_tags.split(): # Check for the specific 'google_toast' tag
            context['google_login_hint'] = str(message) # Assign to a new context var for separate display
        elif message.extra_tags == 'login_success':
            context['login_success'] = str(message)

    return render(request, 'accounts/zeroSL.html', context)



# Get the active User model (essential for custom user models)
User = get_user_model() 


def register_view(request):
    if request.user.is_authenticated: # Essential for register pages too
        return redirect('home')
    
    ALLOWED_USER_TYPES = ['investor', 'entrepreneur', 'explorer']


    if request.method == 'POST':
        user_type = request.POST.get('user_type', 'explorer')
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        company_name = request.POST.get('company_name', '').strip()
        email = request.POST.get('email', '').strip()
        password1 = request.POST.get('password1', '')
        password2 = request.POST.get('password2', '')

        # Validate user_type from POST data
        if user_type not in ALLOWED_USER_TYPES:
            messages.error(request, "Invalid user type selected.", extra_tags='user_type_error')
            # Redirect to the selection page or a default registration page
            return redirect('accounts:select_user_type') # Or 'accounts:register' if you want a default form

        # Store form data in session to prefill after redirect
        request.session['register_form_data'] = {
            'user_type': user_type,
            'first_name': first_name,
            'last_name': last_name,
            'company_name': company_name,
            'email': email
        }
        
        # Initialize a flag to track if any validation error occurred
        has_error = False

        # --- Type-specific validations ---
        if user_type == 'entrepreneur':
            if not company_name or len(company_name) < 2:
                messages.error(request, "*At least 2 characters required", extra_tags='company_name_error')
                has_error = True

        elif user_type == 'investor': # Added explicit handling for 'investor'
            # Assuming investors also need first and last name, but no company name.
            if not first_name or len(first_name) < 2:
                messages.error(request, "*At least 2 characters", extra_tags='first_name_error')
                has_error = True
            if not last_name or len(last_name) < 2:
                messages.error(request, "*At least 2 characters", extra_tags='last_name_error')
                has_error = True

        else: # user_type is 'explorer'
            if not first_name or len(first_name) < 2:
                messages.error(request, "*At least 2 characters", extra_tags='first_name_error')
                has_error = True
            
            if not last_name or len(last_name) < 2:
                messages.error(request, "*At least 2 characters", extra_tags='last_name_error')
                has_error = True
        
        # If any type-specific errors occurred, redirect early
        if has_error:
            request.session['show_register'] = True
            # --- FIX: Construct URL with reverse and then append query param ---
            redirect_url = reverse('accounts:register') + '?type=' + user_type
            return redirect(redirect_url)
            # -----------------------------------------------------------------

        # --- General validations (apply to all user types) ---

        # Email format validation
        try:
            validate_email(email)
        except ValidationError:
            messages.error(request, "*Please enter a valid email address.", extra_tags='email_error')
            has_error = True
        
        # Password validation (UPDATED ORDER AND CHECKS)
        if len(password1) < 8:
            messages.error(request, "*At least 8 characters required", extra_tags='password_error')
            has_error = True
        elif not re.search(r'[A-Z]', password1): # Check for uppercase
            messages.error(request, "*At least one uppercase letter required", extra_tags='password_error')
            has_error = True
        elif not re.search(r'[a-z]', password1): # Check for lowercase
            messages.error(request, "*At least one lowercase letter required", extra_tags='password_error')
            has_error = True
        elif not re.search(r'\d', password1): # Check for number
            messages.error(request, "*At least one number required", extra_tags='password_error')
            has_error = True
        elif not re.search(r'[!@#$%^&*]', password1): # Check for special character
            messages.error(request, "*At least one special character required", extra_tags='password_error')
            has_error = True
        
        # Passwords must match
        if password1 != password2:
            messages.error(request, "*The passwords do not match", extra_tags='confirm_error')
            has_error = True

        # Email must not be already in use
        if User.objects.filter(email=email).exists():
            messages.error(request, "*Email is already in use", extra_tags='email_error')
            has_error = True
        
        # If any general validation errors occurred, redirect early
        if has_error:
            request.session['show_register'] = True
            # --- FIX: Construct URL with reverse and then append query param ---
            redirect_url = reverse('accounts:register') + '?type=' + user_type
            return redirect(redirect_url)
            # ---------------------------------------------------------

        # --- All validations passed: create user ---
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password1,
        )

        # Set user type and specific fields based on type
        user.user_type = user_type
        if user_type == 'entrepreneur':
            user.company_name = company_name
            user.first_name = '' 
            user.last_name = ''
        elif user_type == 'investor': # Added explicit handling for 'entrepreneur'
            user.first_name = first_name
            user.last_name = last_name
            user.company_name = '' # Clear this if not applicable for entrepreneurs
        else: # user_type is 'explorer'
            user.first_name = first_name
            user.last_name = last_name
            user.company_name = '' 

        # Save all custom fields to the database after setting them
        user.save() 

        if 'register_form_data' in request.session:
            del request.session['register_form_data']
        
        # Also clear the 'show_register' flag if you set it for this form
        if 'show_register' in request.session:
            del request.session['show_register']

        # Redirect to login after successful registration
        messages.success(request, "Registration successful! Please log in.", extra_tags='login_success')
        return redirect('accounts:login') 

    else: # GET method: show login/register page
        # Validate user_type from GET parameter
        user_type = request.GET.get('type', 'explorer').strip() # Default to 'explorer'
        if user_type not in ALLOWED_USER_TYPES:
            user_type = 'explorer' # Set to a default valid type
            messages.warning(request, "Invalid user type specified. Defaulting to Explorer.", extra_tags='user_type_warning')

        context = request.session.pop('register_form_data', {})
        context['user_type'] = user_type
        context['show_register'] = request.session.pop('show_register', True) 

        # Load errors from messages framework (by tag) for rendering
        for message in messages.get_messages(request):
            if message.extra_tags == 'password_error':
                context['password_error'] = str(message)
            elif message.extra_tags == 'confirm_error':
                context['confirm_error'] = str(message)
            elif message.extra_tags == 'email_error':
                context['email_error'] = str(message)
            elif message.extra_tags == 'first_name_error':
                context['f_name_error'] = str(message)
            elif message.extra_tags == 'last_name_error':
                context['l_name_error'] = str(message)
            elif message.extra_tags == 'company_name_error':
                context['company_name_error'] = str(message)
            elif message.extra_tags == 'login_success':
                context['login_success'] = str(message)
            elif message.extra_tags == 'user_type_error': # For errors from POST validation
                context['user_type_error'] = str(message)
            elif message.extra_tags == 'user_type_warning': # For warnings from GET validation
                context['user_type_warning'] = str(message)

        return render(request, 'accounts/zeroSL.html', context)


def logout_view(request):
    logout(request)
    return redirect('accounts:signlog')

def login_error(request):
    return render(request, 'accounts/login_error.html', {'error': 'Authentication failed. Please try again.'})