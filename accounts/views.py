from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages
import re
from django.core.validators import validate_email
from django.core.exceptions import ValidationError


def signlog_page(request):
    if request.user.is_authenticated:
        return redirect('temp')
    return render(request, 'accounts/zeroSL.html')

def login_view(request):
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')
        remember_me = request.POST.get('remember_me')

        user = authenticate(request, username=email, password=password)
        if user is not None:
            login(request, user)
            if remember_me:
                request.session.set_expiry(1209600)
            else:
                request.session.set_expiry(0)
            return redirect('temp')
        else:
            request.session['login_form_data'] = {'login_email': email}
            request.session['remember_me'] = (remember_me == 'on')
            # request.session['show_login'] = True
            messages.error(request, "*Invalid email or password.", extra_tags='login_error')
            return redirect('login')  # redirect to same view on GET

    # GET method: show login/register page
    context = request.session.pop('login_form_data', {})
    # context['show_login'] = request.session.pop('show_login', False)
    context['remember_me'] = request.session.pop('remember_me', False)

    for message in messages.get_messages(request):
        if message.extra_tags == 'login_error':
            context['login_error'] = str(message)

    return render(request, 'accounts/zeroSL.html', context)



def register_view(request):
    if request.method == 'POST':
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        email = request.POST.get('email', '').strip()
        password1 = request.POST.get('password1', '')
        password2 = request.POST.get('password2', '')

        # Store form data in session to prefill after redirect
        request.session['register_form_data'] = {
            'first_name': first_name,
            'last_name': last_name,
            'email': email
        }


        if not first_name or len(first_name.strip()) < 2:
            messages.error(request, "*Min. 2 chars", extra_tags='first_name_error')
            request.session['show_register'] = True
            return redirect('register')

        if not last_name or len(last_name.strip()) < 2:
            messages.error(request, "*Min. 2 chars", extra_tags='last_name_error')
            request.session['show_register'] = True
            return redirect('register')

        # inside register_view POST:
        try:
            validate_email(email)
        except ValidationError:
            messages.error(request, "*Please enter a valid email address.", extra_tags='email_error')
            request.session['show_register'] = True
            return redirect('register')

        # Validation
        if len(password1) < 8:
            messages.error(request, "**At least 8 characters required", extra_tags='password_error')
            request.session['show_register'] = True
            return redirect('register')

        if not re.search(r'\d', password1):
            messages.error(request, "*At least one number reuired", extra_tags='password_error')
            request.session['show_register'] = True
            return redirect('register')

        if not re.search(r'[!@#$%^&*]', password1):
            messages.error(request, "*At least one special character required (!@#$%^&*)", extra_tags='password_error')
            request.session['show_register'] = True
            return redirect('register')

        if password1 != password2:
            messages.error(request, "*The passwords do not match", extra_tags='confirm_error')
            request.session['show_register'] = True
            return redirect('register')

        if User.objects.filter(email=email).exists():
            messages.error(request, "*Email is already in use", extra_tags='email_error')
            request.session['show_register'] = True
            return redirect('register')

        # Passed: create user
        User.objects.create_user(
            username=email,
            email=email,
            password=password1,
            first_name=first_name,
            last_name=last_name
        )
        return redirect('login')

    else:
        # GET method
        context = request.session.pop('register_form_data', {})
        context['show_register'] = request.session.pop('show_register', False)

        # Load errors from messages framework (by tag)
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

        return render(request, 'accounts/zeroSL.html', context)


def logout_view(request):
    logout(request)
    return redirect('signlog')

def login_error(request):
    return render(request, 'accounts/login_error.html', {'error': 'Authentication failed. Please try again.'})